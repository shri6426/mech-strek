from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
import uuid
import stripe

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_client_user
from app.models.user import User
from app.models.client_portal import Invoice
from app.models.payment_event import ProcessedStripeEvent
from app.services.webhook import dispatch_webhook_event

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY
    stripe.api_version = "2023-10-16" # Pin Stripe API version for stability

router = APIRouter()

# Simulation webhook secret — must be set in dev .env to use the simulation webhook
SIMULATION_WEBHOOK_KEY = getattr(settings, 'SIMULATION_WEBHOOK_KEY', 'dev-sim-key-change-me')

class CreatePaymentSessionRequest(BaseModel):
    invoice_id: str

class PaymentSessionResponse(BaseModel):
    session_id: str
    checkout_url: str
    amount: float
    currency: str

class BillingPortalRequest(BaseModel):
    return_url: str = f"{settings.FRONTEND_URL}/portal/invoices"

@router.post("/create-session", response_model=PaymentSessionResponse)
async def create_payment_session(
    body: CreatePaymentSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_client_user)  # SECURITY: require client auth
):
    # SECURITY: enforce invoice ownership — client can only pay their own invoices
    result = await db.execute(select(Invoice).where(
        Invoice.id == body.invoice_id,
        Invoice.client_id == current_user.id
    ))
    invoice = result.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not settings.STRIPE_SECRET_KEY:
        # Fallback to simulated portal if Stripe not configured yet
        session_id = f"pay_sess_{uuid.uuid4().hex[:12]}"
        checkout_url = f"https://checkout.mechstrek.in/pay/{session_id}?amount={invoice.amount}"
        return PaymentSessionResponse(
            session_id=session_id,
            checkout_url=checkout_url,
            amount=invoice.amount,
            currency="INR"
        )

    # Resolve customer user details
    user_res = await db.execute(select(User).where(User.id == invoice.client_id))
    client_user = user_res.scalars().first()
    if not client_user:
        raise HTTPException(status_code=404, detail="Client user profile not found")

    try:
        # 1. Resolve Stripe Customer by email (idempotent lookup/creation)
        stripe_customer_id = None
        customers = stripe.Customer.list(email=client_user.email, limit=1)
        if customers.data:
            stripe_customer_id = customers.data[0].id
        else:
            customer = stripe.Customer.create(
                email=client_user.email,
                name=client_user.full_name or "Client"
            )
            stripe_customer_id = customer.id

        # 2. Create Stripe Checkout Session attached to customer
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'inr',
                    'product_data': {
                        'name': f"Invoice INV-{invoice.id[:8]}",
                    },
                    'unit_amount': int(invoice.amount * 100), # Amount in paise (INR)
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{settings.FRONTEND_URL}/portal/invoices?session_id={{CHECKOUT_SESSION_ID}}&status=success",
            cancel_url=f"{settings.FRONTEND_URL}/portal/invoices?status=cancel",
            metadata={
                "invoice_id": invoice.id,
                "client_id": invoice.client_id
            },
            idempotency_key=f"checkout_inv_{invoice.id}"
        )
        return PaymentSessionResponse(
            session_id=checkout_session.id,
            checkout_url=checkout_session.url,
            amount=invoice.amount,
            currency="INR"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

@router.post("/billing-portal")
async def create_billing_portal(
    body: BillingPortalRequest,
    current_user: User = Depends(get_current_client_user),
):
    """
    Creates a Stripe Billing Portal Session for the client to manage cards and downloads.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=400, detail="Stripe is not configured in this environment.")
        
    try:
        # Resolve customer in Stripe
        customers = stripe.Customer.list(email=current_user.email, limit=1)
        if not customers.data:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name or "Client"
            )
            customer_id = customer.id
        else:
            customer_id = customers.data[0].id
            
        # Create billing portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=body.return_url
        )
        return {"url": portal_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe Portal error: {str(e)}")

@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Webhook handler that processes settlement confirmations from Stripe.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    # If Stripe keys are not set, allow simulation webhook fallback (DEV ONLY)
    if not settings.STRIPE_SECRET_KEY:
        # Block this path entirely in non-development environments
        if settings.ENVIRONMENT != "development":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Simulation webhook is only available in development environments."
            )
        # Require a simulation secret header even in dev
        sim_key = request.headers.get("X-Simulation-Key", "")
        if sim_key != SIMULATION_WEBHOOK_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid X-Simulation-Key header for dev simulation webhook."
            )
        import json
        try:
            data = json.loads(payload.decode("utf-8"))
            invoice_id = data.get("invoice_id")
            event_name = data.get("event")
            if event_name == "payment.settled" and invoice_id:
                result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
                invoice = result.scalars().first()
                if invoice:
                    invoice.status = "Paid"
                    # Generate the actual PDF invoice URL
                    invoice.pdf_url = f"{settings.BACKEND_URL}/api/v1/invoices/client/{invoice.id}/pdf"
                    await db.commit()
                    await dispatch_webhook_event("payment_received", {
                        "invoice_id": invoice.id,
                        "amount": invoice.amount,
                        "client_id": invoice.client_id
                    })
                    return {"status": "success", "message": "Simulated invoice marked as paid"}
        except Exception:
            pass
        return {"status": "ignored"}

    # Process production Stripe Webhook
    if settings.ENVIRONMENT == "production" and not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="STRIPE_WEBHOOK_SECRET is required in production environments to secure endpoints."
        )

    try:
        if settings.STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        else:
            # Fallback for dev if signature secret not configured yet
            import json
            event = json.loads(payload.decode("utf-8"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_id = event.get("id") if isinstance(event, dict) else event.id
    event_type = event.get("type") if isinstance(event, dict) else event.type
    event_data = event.get("data") if isinstance(event, dict) else event.data

    # Event Deduplication: check if this webhook was already processed
    exists_query = select(ProcessedStripeEvent).where(ProcessedStripeEvent.id == event_id)
    exists_res = await db.execute(exists_query)
    if exists_res.scalars().first():
        return {"status": "ignored", "message": "Event already processed"}

    # Settle payments on checkout.session.completed
    if event_type == "checkout.session.completed":
        session = event_data.get("object") if isinstance(event_data, dict) else event_data.object
        metadata = session.get("metadata", {}) if isinstance(session, dict) else getattr(session, "metadata", {})
        invoice_id = metadata.get("invoice_id")
        
        if invoice_id:
            result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
            invoice = result.scalars().first()
            if invoice and invoice.status != "Paid":
                invoice.status = "Paid"
                invoice.pdf_url = f"{settings.BACKEND_URL}/api/v1/invoices/client/{invoice.id}/pdf"
                
                # Record event as processed (inside the transaction block)
                processed_event = ProcessedStripeEvent(id=event_id)
                db.add(processed_event)
                await db.commit()
                
                # Broadcast notification to admin
                from app.services.notifications import create_and_broadcast
                from app.models.user import User, UserRole
                admin_query = select(User).where(User.role == UserRole.ADMIN)
                admin_res = await db.execute(admin_query)
                for admin in admin_res.scalars().all():
                    await create_and_broadcast(db, admin.id, "Payment Received", f"Client paid invoice INV-{invoice.id[:8]} via Stripe", "payment", "/admin/invoices")
                
                await dispatch_webhook_event("payment_received", {
                    "invoice_id": invoice.id,
                    "amount": invoice.amount,
                    "client_id": invoice.client_id
                })
                return {"status": "success", "message": "Invoice marked as paid"}

    # Handle Payment Failure
    elif event_type == "invoice.payment_failed":
        invoice_obj = event_data.get("object") if isinstance(event_data, dict) else event_data.object
        metadata = invoice_obj.get("metadata", {}) if isinstance(invoice_obj, dict) else getattr(invoice_obj, "metadata", {})
        invoice_id = metadata.get("invoice_id")
        
        if invoice_id:
            result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
            invoice = result.scalars().first()
            if invoice and invoice.status != "Overdue":
                invoice.status = "Overdue"
                
                processed_event = ProcessedStripeEvent(id=event_id)
                db.add(processed_event)
                await db.commit()
                return {"status": "success", "message": "Invoice payment marked as failed/overdue"}

    # Handle Refunded Payments
    elif event_type == "charge.refunded":
        charge = event_data.get("object") if isinstance(event_data, dict) else event_data.object
        metadata = charge.get("metadata", {}) if isinstance(charge, dict) else getattr(charge, "metadata", {})
        invoice_id = metadata.get("invoice_id")
        
        if invoice_id:
            result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
            invoice = result.scalars().first()
            if invoice and invoice.status != "Refunded":
                invoice.status = "Refunded"
                
                processed_event = ProcessedStripeEvent(id=event_id)
                db.add(processed_event)
                await db.commit()
                return {"status": "success", "message": "Invoice marked as refunded"}

    # Register untracked events to avoid processing them in future runs
    processed_event = ProcessedStripeEvent(id=event_id)
    db.add(processed_event)
    await db.commit()
    return {"status": "ignored"}

@router.get("/verify-session/{session_id}")
async def verify_payment_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_client_user)
):
    """
    Called by the client-side success page to verify Checkout Session status server-side.
    Avoids trusting query parameters directly from the browser.
    """
    if not settings.STRIPE_SECRET_KEY:
        # Development fallback mode
        return {"status": "paid", "message": "Simulated paid status verified"}
        
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        invoice_id = session.metadata.get("invoice_id")
        payment_status = session.payment_status # "paid", "unpaid", "no_payment_required"
        
        if invoice_id:
            result = await db.execute(select(Invoice).where(Invoice.id == invoice_id, Invoice.client_id == current_user.id))
            invoice = result.scalars().first()
            if invoice:
                if payment_status == "paid" and invoice.status != "Paid":
                    invoice.status = "Paid"
                    # Generate the PDF invoice url dynamically
                    invoice.pdf_url = f"{settings.BACKEND_URL}/api/v1/invoices/client/{invoice.id}/pdf"
                    await db.commit()
                    
                return {
                    "status": invoice.status.lower(),
                    "payment_status": payment_status,
                    "invoice_id": invoice.id,
                    "amount": invoice.amount
                }
                
        raise HTTPException(status_code=404, detail="Invoice matching checkout session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify payment session: {str(e)}")
