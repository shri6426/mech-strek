from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import shutil
import os
import uuid
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_admin_user
from app.services.storage import upload_file_to_supabase
from app.models.user import User, UserRole
from app.models.client_portal import ClientProject, ProjectTimeline, Invoice, ProjectMessage, ClientFile
from app.models.inquiry import Inquiry, InquiryStatus
from app.models.project_management import ProjectTask, ActivityFeed
from app.schemas.client_portal import (
    ClientProjectCreate, ClientProjectUpdate, ClientProjectResponse,
    ProjectTimelineCreate, ProjectTimelineUpdate, ProjectTimelineResponse,
    ProjectTimelineBase,
    InvoiceCreate, InvoiceResponse,
    ProjectMessageCreate, ProjectMessageResponse,
    ClientFileResponse
)
from app.core.security import create_magic_token, get_password_hash

router = APIRouter()

class ClientInvite(BaseModel):
    email: EmailStr
    full_name: str

@router.post("/clients/invite")
async def invite_client(
    *,
    db: AsyncSession = Depends(get_db),
    invite_in: ClientInvite,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    # Check if user already exists
    query = select(User).where(User.email == invite_in.email)
    result = await db.execute(query)
    user = result.scalars().first()

    if user:
        if user.role != UserRole.CLIENT:
            raise HTTPException(status_code=400, detail="User already exists and is not a client.")
    else:
        # Create a new client user
        import secrets
        import string
        dummy_pass = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
        hashed_password = get_password_hash(dummy_pass)
        user = User(
            email=invite_in.email,
            full_name=invite_in.full_name,
            hashed_password=hashed_password,
            role=UserRole.CLIENT,
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    from app.core.config import settings
    import logging
    logger = logging.getLogger(__name__)

    magic_token = create_magic_token(user.id)
    magic_link = f"{settings.BACKEND_URL}/api/v1/auth/magic-login?token={magic_token}"

    try:
        from app.services.email import send_invite_email
        send_invite_email(email=user.email, name=user.full_name, magic_link=magic_link)
    except Exception as exc:
        logger.warning("Email could not be sent: %s", exc)
        logger.info("Magic Link fallback: %s", magic_link)

    return {
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "magic_link": magic_link
    }

from datetime import datetime, timezone, timedelta
from sqlalchemy import func

class AdminDashboardMetrics(BaseModel):
    new_leads: int
    today_meetings: int
    invoices_pending: int
    projects_due: int
    overdue_tasks: int
    revenue_this_month: float
    recent_activity: List[Any]

@router.get("/dashboard-metrics", response_model=AdminDashboardMetrics)
async def get_admin_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    # 1. New Leads (Inquiries with status == NEW)
    leads_q = select(func.count()).select_from(Inquiry).where(Inquiry.status == InquiryStatus.NEW)
    leads_res = await db.execute(leads_q)
    new_leads = leads_res.scalar() or 0

    # 2. Today's Meetings (Simulated to 2)
    today_meetings = 2

    # 3. Invoices Pending (Invoices with status == Pending)
    invoices_q = select(func.count()).select_from(Invoice).where(Invoice.status == "Pending")
    invoices_res = await db.execute(invoices_q)
    invoices_pending = invoices_res.scalar() or 0

    # 4. Projects Due (Projects with end_date in the next 7 days)
    now = datetime.now(timezone.utc)
    seven_days_later = now + timedelta(days=7)
    projects_q = select(func.count()).select_from(ClientProject).where(
        ClientProject.end_date >= now,
        ClientProject.end_date <= seven_days_later
    )
    projects_res = await db.execute(projects_q)
    projects_due = projects_res.scalar() or 0

    # 5. Overdue Tasks (Tasks with status != DONE and due_date in the past)
    tasks_q = select(func.count()).select_from(ProjectTask).where(
        ProjectTask.status != "DONE",
        ProjectTask.due_date < now
    )
    tasks_res = await db.execute(tasks_q)
    overdue_tasks = tasks_res.scalar() or 0

    # 6. Revenue This Month (Sum of paid invoices created this month)
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    rev_q = select(func.sum(Invoice.amount)).where(
        Invoice.status == "Paid",
        Invoice.created_at >= first_day_of_month
    )
    rev_res = await db.execute(rev_q)
    revenue_this_month = rev_res.scalar() or 0.0

    # 7. Recent Activity (ActivityFeed records, limit to 10)
    activity_q = select(ActivityFeed).order_by(ActivityFeed.timestamp.desc()).limit(10)
    activity_res = await db.execute(activity_q)
    activities = activity_res.scalars().all()
    
    recent_activity = []
    for act in activities:
        recent_activity.append({
            "id": act.id,
            "project_id": act.project_id,
            "action": act.action,
            "details": act.details,
            "timestamp": act.timestamp
        })

    return {
        "new_leads": new_leads,
        "today_meetings": today_meetings,
        "invoices_pending": invoices_pending,
        "projects_due": projects_due,
        "overdue_tasks": overdue_tasks,
        "revenue_this_month": float(revenue_this_month),
        "recent_activity": recent_activity
    }

# --- Admin Project Routes ---
@router.post("/projects", response_model=ClientProjectResponse)
async def create_project(
    *,
    db: AsyncSession = Depends(get_db),
    project_in: ClientProjectCreate,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    # Verify client exists
    query = select(User).where(User.id == project_in.client_id)
    result = await db.execute(query)
    client = result.scalars().first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    project = ClientProject(**project_in.dict())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project

@router.get("/projects", response_model=List[ClientProjectResponse])
async def read_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ClientProject)
    result = await db.execute(query)
    projects = result.scalars().all()
    return projects

@router.get("/projects/{project_id}", response_model=ClientProjectResponse)
async def read_project_by_id(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ClientProject).where(ClientProject.id == project_id)
    result = await db.execute(query)
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.patch("/projects/{project_id}", response_model=ClientProjectResponse)
async def update_project(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    project_in: ClientProjectUpdate,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ClientProject).where(ClientProject.id == project_id)
    result = await db.execute(query)
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    return project

# --- Admin Timeline / Milestone Routes ---
@router.get("/projects/{project_id}/timelines", response_model=List[ProjectTimelineResponse])
async def read_admin_project_timelines(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ProjectTimeline).where(ProjectTimeline.project_id == project_id).order_by(ProjectTimeline.display_order.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/projects/{project_id}/timelines", response_model=ProjectTimelineResponse)
async def create_admin_project_timeline(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    timeline_in: ProjectTimelineBase,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    timeline = ProjectTimeline(project_id=project_id, **timeline_in.dict())
    db.add(timeline)
    await db.commit()
    await db.refresh(timeline)

    # Recalculate project progress percentage automatically
    query = select(ProjectTimeline).where(ProjectTimeline.project_id == project_id)
    res = await db.execute(query)
    all_t = res.scalars().all()
    if all_t:
        completed = sum(1 for t in all_t if t.is_completed)
        progress = int((completed / len(all_t)) * 100)
        proj_q = select(ClientProject).where(ClientProject.id == project_id)
        proj_res = await db.execute(proj_q)
        proj = proj_res.scalars().first()
        if proj:
            proj.progress_percent = progress
            await db.commit()

    return timeline

@router.patch("/projects/{project_id}/timelines/{timeline_id}", response_model=ProjectTimelineResponse)
async def update_admin_project_timeline(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    timeline_id: str,
    timeline_in: ProjectTimelineUpdate,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ProjectTimeline).where(ProjectTimeline.id == timeline_id, ProjectTimeline.project_id == project_id)
    result = await db.execute(query)
    timeline = result.scalars().first()
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline milestone not found")

    update_data = timeline_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(timeline, field, value)

    await db.commit()
    await db.refresh(timeline)

    # Recalculate project progress percentage automatically
    query_all = select(ProjectTimeline).where(ProjectTimeline.project_id == project_id)
    res = await db.execute(query_all)
    all_t = res.scalars().all()
    if all_t:
        completed = sum(1 for t in all_t if t.is_completed)
        progress = int((completed / len(all_t)) * 100)
        proj_q = select(ClientProject).where(ClientProject.id == project_id)
        proj_res = await db.execute(proj_q)
        proj = proj_res.scalars().first()
        if proj:
            proj.progress_percent = progress
            await db.commit()

    return timeline

@router.delete("/projects/{project_id}/timelines/{timeline_id}")
async def delete_admin_project_timeline(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    timeline_id: str,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ProjectTimeline).where(ProjectTimeline.id == timeline_id, ProjectTimeline.project_id == project_id)
    result = await db.execute(query)
    timeline = result.scalars().first()
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline milestone not found")

    await db.delete(timeline)
    await db.commit()
    return {"status": "success", "message": "Milestone deleted"}

# --- Admin File Routes ---
@router.get("/projects/{project_id}/files", response_model=List[ClientFileResponse])
async def read_admin_project_files(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ClientFile).where(ClientFile.project_id == project_id).order_by(ClientFile.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/projects/{project_id}/files/upload", response_model=ClientFileResponse)
async def upload_admin_project_file(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "bin"
    
    # Read bytes and upload to Supabase Storage
    file_bytes = await file.read()
    content_type = file.content_type or "application/octet-stream"
    file_url = await upload_file_to_supabase(file_bytes, file.filename, content_type)

    client_file = ClientFile(
        project_id=project_id,
        uploader_id=current_user.id,
        file_name=file.filename,
        file_url=file_url,
        file_type=file_extension.lower()
    )
    db.add(client_file)
    await db.commit()
    await db.refresh(client_file)
    return client_file

# --- Admin Invoice Routes ---
@router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(
    *,
    db: AsyncSession = Depends(get_db),
    invoice_in: InvoiceCreate,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    invoice = Invoice(**invoice_in.dict())
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice

@router.get("/invoices", response_model=List[InvoiceResponse])
async def read_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(Invoice)
    result = await db.execute(query)
    invoices = result.scalars().all()
    return invoices

# --- Admin Message Routes ---
@router.get("/projects/{project_id}/messages", response_model=List[ProjectMessageResponse])
async def read_admin_project_messages(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ProjectMessage).where(ProjectMessage.project_id == project_id).order_by(ProjectMessage.created_at.desc())
    result = await db.execute(query)
    messages = result.scalars().all()
    return messages

@router.post("/projects/{project_id}/messages", response_model=ProjectMessageResponse)
async def post_admin_project_message(
    project_id: str,
    message_in: ProjectMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    message = ProjectMessage(
        project_id=project_id,
        sender_id=current_user.id,
        message=message_in.message
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    project_q = select(ClientProject).where(ClientProject.id == project_id)
    project_res = await db.execute(project_q)
    project = project_res.scalars().first()
    if project:
        from app.services.notifications import create_and_broadcast
        await create_and_broadcast(db, project.client_id, "New Message", "The MechStrek team sent a new message.", "message", "/portal/messages")

    return message

# --- Admin Activity Routes ---
@router.get("/projects/{project_id}/activities")
async def read_admin_project_activities(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ActivityFeed).where(ActivityFeed.project_id == project_id).order_by(ActivityFeed.timestamp.desc())
    result = await db.execute(query)
    return result.scalars().all()

