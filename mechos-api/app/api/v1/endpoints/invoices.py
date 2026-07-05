from typing import Any, List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.services.storage import upload_file_to_supabase
from pydantic import BaseModel
import re

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_admin_user, get_current_client_user
from app.core.rate_limit import limiter
from app.models.user import User
from app.models.client_portal import Invoice
from app.schemas.client_portal import InvoiceResponse

# Valid invoice statuses — enforced on all status mutations
VALID_STATUSES = {"Pending", "Paid", "Overdue", "Refunded", "Under Review", "Cancelled"}

# UTR: 12–22 alphanumeric characters (standard Indian payment reference format)
UTR_PATTERN = re.compile(r'^[0-9A-Za-z]{12,22}$')

# Max screenshot size: 5 MB
MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024

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

class InvoiceStatusUpdate(BaseModel):
    status: Literal["Pending", "Paid", "Overdue", "Refunded", "Under Review", "Cancelled"]

@router.patch("/admin/{invoice_id}/status", response_model=InvoiceResponse)
async def update_invoice_status(
    *,
    db: AsyncSession = Depends(get_db),
    invoice_id: str,
    status_update: InvoiceStatusUpdate,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(Invoice).where(Invoice.id == invoice_id)
    result = await db.execute(query)
    invoice = result.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.status = status_update.status

    await db.commit()
    await db.refresh(invoice)
    return invoice

# --- Client Checkout Simulation (DEVELOPMENT ONLY) ---
@router.post("/client/{invoice_id}/pay", response_model=InvoiceResponse)
async def process_client_payment(
    *,
    db: AsyncSession = Depends(get_db),
    invoice_id: str,
    current_user: User = Depends(get_current_client_user)
) -> Any:
    # Guard: This simulation endpoint must never run in production
    if settings.ENVIRONMENT == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Direct payment simulation is disabled in production. Use the UPI manual payment or Stripe flow."
        )

    query = select(Invoice).where(Invoice.id == invoice_id, Invoice.client_id == current_user.id)
    result = await db.execute(query)
    invoice = result.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == "Paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid")

    # Simulate instant settlement (dev only)
    invoice.status = "Paid"
    invoice.pdf_url = f"{settings.BACKEND_URL}/api/v1/invoices/client/{invoice.id}/pdf"

    await db.commit()
    await db.refresh(invoice)

    from app.services.notifications import create_and_broadcast
    from app.models.user import UserRole
    admin_query = select(User).where(User.role == UserRole.ADMIN)
    admin_res = await db.execute(admin_query)
    for admin in admin_res.scalars().all():
        await create_and_broadcast(db, admin.id, "Payment Received", f"Client paid invoice INV-{invoice.id[:8]}", "payment", "/admin/invoices")

    return invoice

@router.get("/client", response_model=List[InvoiceResponse])
async def read_client_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Get all invoices for the currently logged-in client.
    """
    query = select(Invoice).where(Invoice.client_id == current_user.id).order_by(Invoice.created_at.desc())
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    # Ensure PDF URLs are correctly formatted dynamically on read
    for invoice in invoices:
        invoice.pdf_url = f"{settings.BACKEND_URL}/api/v1/invoices/client/{invoice.id}/pdf"
        
    return invoices

from fastapi.responses import StreamingResponse
from app.services.pdf import generate_invoice_pdf
from app.models.client_portal import ClientProject

@router.get("/client/{invoice_id}/pdf")
async def get_invoice_pdf(
    *,
    db: AsyncSession = Depends(get_db),
    invoice_id: str,
    current_user: User = Depends(get_current_client_user)
):
    """
    Download a professional PDF copy of the invoice.
    """
    query = select(Invoice).where(Invoice.id == invoice_id, Invoice.client_id == current_user.id)
    result = await db.execute(query)
    invoice = result.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    project_name = None
    if invoice.project_id:
        proj_query = select(ClientProject).where(ClientProject.id == invoice.project_id)
        proj_res = await db.execute(proj_query)
        project = proj_res.scalars().first()
        if project:
            project_name = project.name
            
    pdf_buffer = generate_invoice_pdf(invoice, current_user, project_name)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_INV-{invoice_id[:8]}.pdf"}
    )

class VerifyPaymentRequest(BaseModel):
    approve: bool
    rejection_reason: Optional[str] = None

@router.post("/client/{invoice_id}/submit-manual-payment", response_model=InvoiceResponse)
@limiter.limit("5/minute")
async def submit_manual_payment(
    *,
    request: Request,
    db: AsyncSession = Depends(get_db),
    invoice_id: str,
    utr: str = Form(...),
    screenshot: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Submits a manual bank or UPI transfer with UTR and optional screenshot for review.
    """
    query = select(Invoice).where(Invoice.id == invoice_id, Invoice.client_id == current_user.id)
    result = await db.execute(query)
    invoice = result.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == "Paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid")

    if invoice.status == "Under Review":
        raise HTTPException(status_code=400, detail="A payment submission is already under review for this invoice.")

    # Validate UTR format (12-22 alphanumeric characters)
    utr = utr.strip().upper()
    if not UTR_PATTERN.match(utr):
        raise HTTPException(status_code=400, detail="Invalid UTR format. Must be 12–22 alphanumeric characters.")

    # Ensure UTR is unique — prevent double-spend across different invoices
    utr_exists_query = select(Invoice).where(Invoice.utr == utr, Invoice.id != invoice_id)
    utr_exists_res = await db.execute(utr_exists_query)
    if utr_exists_res.scalars().first():
        raise HTTPException(status_code=400, detail="This UTR reference has already been submitted for another invoice.")

    screenshot_url = None
    if screenshot:
        # Validate extension
        ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
        ext = screenshot.filename.split(".")[-1].lower() if "." in screenshot.filename else "bin"
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File extension '.{ext}' is not allowed for screenshots.")

        # Enforce 5 MB file size limit to prevent memory exhaustion
        file_bytes = await screenshot.read(MAX_SCREENSHOT_BYTES + 1)
        if len(file_bytes) > MAX_SCREENSHOT_BYTES:
            raise HTTPException(status_code=413, detail="Screenshot exceeds the 5 MB size limit.")

        screenshot_url = await upload_file_to_supabase(file_bytes, screenshot.filename, screenshot.content_type)

    invoice.utr = utr
    if screenshot_url:
        invoice.screenshot_url = screenshot_url
    invoice.payment_method = "MANUAL_UPI"
    invoice.status = "Under Review"
    
    await db.commit()
    await db.refresh(invoice)
    
    # Broadcast to admin
    from app.services.notifications import create_and_broadcast
    from app.models.user import UserRole
    admin_query = select(User).where(User.role == UserRole.ADMIN)
    admin_res = await db.execute(admin_query)
    for admin in admin_res.scalars().all():
        await create_and_broadcast(
            db, 
            admin.id, 
            "Manual Payment Submitted", 
            f"Client submitted manual payment for invoice INV-{invoice.id[:8]} (UTR: {utr})", 
            "payment", 
            "/admin/invoices"
        )
        
    return invoice



@router.post("/admin/{invoice_id}/verify-payment", response_model=InvoiceResponse)
async def verify_payment(
    *,
    db: AsyncSession = Depends(get_db),
    invoice_id: str,
    body: VerifyPaymentRequest,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """
    Approves or rejects a client's manual UPI / bank transfer UTR submission.
    """
    query = select(Invoice).where(Invoice.id == invoice_id)
    result = await db.execute(query)
    invoice = result.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.status == "Paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid")
        
    from app.services.notifications import create_and_broadcast
    
    if body.approve:
        invoice.status = "Paid"
        invoice.pdf_url = f"{settings.BACKEND_URL}/api/v1/invoices/client/{invoice.id}/pdf"
        await db.commit()
        await db.refresh(invoice)
        
        # Settle notifications to client
        await create_and_broadcast(
            db,
            invoice.client_id,
            "Payment Approved",
            f"Your manual payment for invoice INV-{invoice.id[:8]} has been approved and marked as Paid.",
            "payment",
            "/portal/invoices"
        )
    else:
        # Rejected
        invoice.status = "Pending"
        invoice.utr = None
        invoice.screenshot_url = None
        await db.commit()
        await db.refresh(invoice)
        
        reason = body.rejection_reason or "Verification of transaction reference failed."
        await create_and_broadcast(
            db,
            invoice.client_id,
            "Payment Rejected",
            f"Your manual payment for invoice INV-{invoice.id[:8]} was rejected. Reason: {reason}",
            "payment",
            "/portal/invoices"
        )
        
    return invoice
