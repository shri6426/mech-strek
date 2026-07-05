from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
import uuid
import stripe

from app.core.database import get_db
from app.core.config import settings
from app.models.client_portal import Invoice
from app.services.webhook import dispatch_webhook_event

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter()

class CreatePaymentSessionRequest(BaseModel):
    invoice_id: str

class PaymentSessionResponse(BaseModel):
    session_id: str
    checkout_url: str
    amount: float
    currency: str

@router.post("/create-session", response_model=PaymentSessionResponse)
async def create_payment_session(
    body: CreatePaymentSessionRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Invoice).where(Invoice.id == body.invoice_id))
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

    try:
        # Create real Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
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
            }
        )
        return PaymentSessionResponse(
            session_id=checkout_session.id,
            checkout_url=checkout_session.url,
            amount=invoice.amount,
            currency="INR"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Webhook handler that processes settlement confirmations from Stripe.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    # If Stripe keys are not set, allow simulation webhook fallback
    if not settings.STRIPE_SECRET_KEY:
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

    event_type = event.get("type") if isinstance(event, dict) else event.type
    event_data = event.get("data") if isinstance(event, dict) else event.data

    if event_type == "checkout.session.completed":
        session = event_data.get("object") if isinstance(event_data, dict) else event_data.object
        metadata = session.get("metadata", {}) if isinstance(session, dict) else getattr(session, "metadata", {})
        invoice_id = metadata.get("invoice_id")
        
        if invoice_id:
            result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
            invoice = result.scalars().first()
            if invoice and invoice.status != "Paid":
                invoice.status = "Paid"
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

    return {"status": "ignored"}
