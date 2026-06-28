from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.inquiry import InquiryCreate, InquiryResponse
from app.models.inquiry import Inquiry
from app.core.config import settings
import resend

from app.services.webhook import dispatch_webhook_event
from app.core.rate_limit import limiter

router = APIRouter()

@router.post("/contact", response_model=InquiryResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def submit_contact_form(
    inquiry_in: InquiryCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Retrieve IP Address for audit logging
    client_ip = request.client.host if request.client else None

    # Save Inquiry to PostgreSQL database
    new_inquiry = Inquiry(
        name=inquiry_in.name,
        business=inquiry_in.business,
        email=inquiry_in.email,
        phone=inquiry_in.phone,
        details=inquiry_in.details,
        budget=inquiry_in.budget,
        ip_address=client_ip
    )
    db.add(new_inquiry)
    await db.commit()
    await db.refresh(new_inquiry)

    await dispatch_webhook_event("new_inquiry", {
        "id": new_inquiry.id,
        "name": new_inquiry.name,
        "business": new_inquiry.business,
        "email": new_inquiry.email,
        "budget": new_inquiry.budget
    })

    from app.services.notifications import create_and_broadcast
    from app.models.user import User, UserRole
    from sqlalchemy.future import select
    admin_query = select(User).where(User.role == UserRole.ADMIN)
    admin_res = await db.execute(admin_query)
    for admin in admin_res.scalars().all():
        await create_and_broadcast(db, admin.id, "New Lead", f"New inquiry from {inquiry_in.name}", "lead", "/admin/crm")

    # Trigger Email Notification via Resend if API key is provided
    if settings.RESEND_API_KEY:
        resend.api_key = settings.RESEND_API_KEY
        try:
            resend.Emails.send({
                "from": "Mech Strek Inquiries <noreply@mechstrek.in>",
                "to": [settings.ADMIN_NOTIFICATION_EMAIL],
                "subject": f"🚀 New Project Inquiry from {inquiry_in.name}",
                "html": f"""
                    <h2>New Inquiry Received</h2>
                    <p><strong>Name:</strong> {inquiry_in.name}</p>
                    <p><strong>Business:</strong> {inquiry_in.business or 'N/A'}</p>
                    <p><strong>Email:</strong> {inquiry_in.email}</p>
                    <p><strong>Phone:</strong> {inquiry_in.phone or 'N/A'}</p>
                    <p><strong>Budget:</strong> {inquiry_in.budget}</p>
                    <p><strong>Details:</strong></p>
                    <p>{inquiry_in.details}</p>
                """
            })
        except Exception as e:
            # Non-blocking log for email failures
            print(f"Failed to send resend email: {e}")

    return new_inquiry
