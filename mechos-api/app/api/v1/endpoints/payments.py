from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
import uuid

from app.core.database import get_db
from app.models.client_portal import Invoice
from app.services.webhook import dispatch_webhook_event

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

    session_id = f"pay_sess_{uuid.uuid4().hex[:12]}"
    # Simulated payment portal checkout URL
    checkout_url = f"https://checkout.mechstrek.in/pay/{session_id}?amount={invoice.amount}"

    return PaymentSessionResponse(
        session_id=session_id,
        checkout_url=checkout_url,
        amount=invoice.amount,
        currency="INR"
    )

@router.post("/webhook")
async def payment_webhook(payload: dict, db: AsyncSession = Depends(get_db)):
    """
    Webhook handler that processes settlement confirmations from payment providers.
    """
    invoice_id = payload.get("invoice_id")
    event = payload.get("event")

    if event == "payment.settled" and invoice_id:
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
            return {"status": "success", "message": "Invoice marked as paid"}

    return {"status": "ignored"}
