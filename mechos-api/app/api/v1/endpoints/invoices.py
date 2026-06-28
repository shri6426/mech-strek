from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_admin_user, get_current_client_user
from app.models.user import User
from app.models.client_portal import Invoice
from app.schemas.client_portal import InvoiceResponse

router = APIRouter()

# --- Admin Revenue & Invoice Operations ---
from app.schemas.client_portal import InvoiceCreate
@router.post("/admin", response_model=InvoiceResponse)
async def create_admin_invoice(
    *,
    db: AsyncSession = Depends(get_db),
    invoice_in: InvoiceCreate,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(User).where(User.id == invoice_in.client_id)
    result = await db.execute(query)
    client = result.scalars().first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    invoice = Invoice(
        client_id=invoice_in.client_id,
        project_id=invoice_in.project_id,
        amount=invoice_in.amount,
        status=invoice_in.status or "Pending",
        due_date=invoice_in.due_date,
        pdf_url=invoice_in.pdf_url
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)

    from app.services.notifications import create_and_broadcast
    await create_and_broadcast(db, invoice.client_id, "New Invoice", f"A new invoice for ₹{invoice.amount} is due.", "invoice", "/portal/invoices")

    return invoice

@router.get("/admin/summary")
async def get_financial_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(Invoice)
    result = await db.execute(query)
    invoices = result.scalars().all()

    total_revenue = sum(inv.amount for inv in invoices if inv.status == "Paid")
    pending_revenue = sum(inv.amount for inv in invoices if inv.status == "Pending")
    overdue_revenue = sum(inv.amount for inv in invoices if inv.status == "Overdue")

    return {
        "total_revenue": total_revenue,
        "pending_revenue": pending_revenue,
        "overdue_revenue": overdue_revenue,
        "total_invoices_count": len(invoices)
    }

@router.patch("/admin/{invoice_id}/status", response_model=InvoiceResponse)
async def update_invoice_status(
    *,
    db: AsyncSession = Depends(get_db),
    invoice_id: str,
    status_update: dict,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(Invoice).where(Invoice.id == invoice_id)
    result = await db.execute(query)
    invoice = result.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    new_status = status_update.get("status")
    if new_status:
        invoice.status = new_status

    await db.commit()
    await db.refresh(invoice)
    return invoice

# --- Client Checkout Simulation ---
@router.post("/client/{invoice_id}/pay", response_model=InvoiceResponse)
async def process_client_payment(
    *,
    db: AsyncSession = Depends(get_db),
    invoice_id: str,
    current_user: User = Depends(get_current_client_user)
) -> Any:
    query = select(Invoice).where(Invoice.id == invoice_id, Invoice.client_id == current_user.id)
    result = await db.execute(query)
    invoice = result.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == "Paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid")

    # Simulate instant settlement
    invoice.status = "Paid"
    
    # If no pdf_url is set, set a mock receipt URL
    if not invoice.pdf_url:
        invoice.pdf_url = f"https://receipts.mechstrek.in/receipt_{invoice.id[:8]}.pdf"

    await db.commit()
    await db.refresh(invoice)

    from app.services.notifications import create_and_broadcast
    from app.models.user import UserRole
    admin_query = select(User).where(User.role == UserRole.ADMIN)
    admin_res = await db.execute(admin_query)
    for admin in admin_res.scalars().all():
        await create_and_broadcast(db, admin.id, "Payment Received", f"Client paid invoice INV-{invoice.id[:8]}", "payment", "/admin/invoices")

    return invoice
