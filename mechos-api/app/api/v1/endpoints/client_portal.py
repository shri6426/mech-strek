from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import shutil
import os
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_client_user
from app.services.storage import upload_file_to_supabase
from app.models.user import User
from app.models.client_portal import ClientProject, ProjectTimeline, Invoice, ProjectMessage, ClientFile
from app.schemas.client_portal import (
    ClientProjectResponse,
    ProjectTimelineResponse,
    InvoiceResponse,
    ProjectMessageCreate, 
    ProjectMessageResponse,
    ClientFileResponse
)
from app.models.project_management import ProjectTask, ProjectMilestone
from app.schemas.project_management import ProjectTaskResponse, ProjectTaskCreate
from pydantic import BaseModel

router = APIRouter()

class ClientDashboardResponse(BaseModel):
    project_name: str
    progress_percent: int
    today_update: Optional[str] = None
    next_milestone: Optional[dict] = None
    outstanding_invoice_amount: float

@router.get("/dashboard", response_model=ClientDashboardResponse)
async def get_client_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_client_user)
) -> Any:
    # 1. Fetch current project for this client
    query = select(ClientProject).where(ClientProject.client_id == current_user.id)
    result = await db.execute(query)
    project = result.scalars().first()

    if not project:
        raise HTTPException(status_code=404, detail="No active project found for this client.")

    # 2. Fetch the next uncompleted milestone
    milestone_query = select(ProjectMilestone).where(
        ProjectMilestone.project_id == project.id,
        ProjectMilestone.is_completed == False
    ).order_by(ProjectMilestone.due_date.asc())
    milestone_res = await db.execute(milestone_query)
    next_milestone_model = milestone_res.scalars().first()

    next_milestone = None
    if next_milestone_model:
        next_milestone = {
            "title": next_milestone_model.title,
            "due_date": next_milestone_model.due_date
        }

    # 3. Fetch outstanding invoice amount (total of all pending/overdue invoices)
    invoice_query = select(Invoice).where(
        Invoice.client_id == current_user.id,
        Invoice.status.in_(["Pending", "Overdue"])
    )
    invoice_res = await db.execute(invoice_query)
    invoices = invoice_res.scalars().all()
    outstanding_amount = sum(inv.amount for inv in invoices)

    return {
        "project_name": project.name,
        "progress_percent": project.progress_percent,
        "today_update": project.today_update,
        "next_milestone": next_milestone,
        "outstanding_invoice_amount": outstanding_amount
    }

@router.get("/projects", response_model=List[ClientProjectResponse])
async def read_my_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Get all projects for the currently logged-in client.
    """
    query = select(ClientProject).where(ClientProject.client_id == current_user.id)
    result = await db.execute(query)
    projects = result.scalars().all()
    return projects

@router.get("/projects/{project_id}/timelines", response_model=List[ProjectTimelineResponse])
async def read_project_timelines(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Get timelines/milestones for a project owned by the client.
    """
    query = select(ClientProject).where(ClientProject.id == project_id, ClientProject.client_id == current_user.id)
    result = await db.execute(query)
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    t_query = select(ProjectTimeline).where(ProjectTimeline.project_id == project_id).order_by(ProjectTimeline.display_order.asc())
    t_res = await db.execute(t_query)
    return t_res.scalars().all()

@router.get("/projects/{project_id}/files", response_model=List[ClientFileResponse])
async def read_project_files(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Get files for a specific project.
    """
    query = select(ClientProject).where(ClientProject.id == project_id, ClientProject.client_id == current_user.id)
    result = await db.execute(query)
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    f_query = select(ClientFile).where(ClientFile.project_id == project_id).order_by(ClientFile.created_at.desc())
    f_res = await db.execute(f_query)
    return f_res.scalars().all()

@router.post("/projects/{project_id}/files/upload", response_model=ClientFileResponse)
async def upload_project_file(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Upload a resource or deliverable file for a project.
    """
    query = select(ClientProject).where(ClientProject.id == project_id, ClientProject.client_id == current_user.id)
    result = await db.execute(query)
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

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

@router.get("/invoices", response_model=List[InvoiceResponse])
async def read_my_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Get all invoices for the currently logged-in client.
    """
    query = select(Invoice).where(Invoice.client_id == current_user.id)
    result = await db.execute(query)
    invoices = result.scalars().all()
    return invoices

@router.get("/projects/{project_id}/messages", response_model=List[ProjectMessageResponse])
async def read_project_messages(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Get messages for a specific project. Ensures the client owns the project.
    """
    query = select(ClientProject).where(ClientProject.id == project_id, ClientProject.client_id == current_user.id)
    result = await db.execute(query)
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = select(ProjectMessage).where(ProjectMessage.project_id == project_id).order_by(ProjectMessage.created_at.desc())
    result = await db.execute(query)
    messages = result.scalars().all()
    return messages

@router.post("/projects/{project_id}/messages", response_model=ProjectMessageResponse)
async def post_project_message(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    message_in: ProjectMessageCreate,
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Post a new message to a project.
    """
    query = select(ClientProject).where(ClientProject.id == project_id, ClientProject.client_id == current_user.id)
    result = await db.execute(query)
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    message = ProjectMessage(
        project_id=project_id,
        sender_id=current_user.id,
        content=message_in.content
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    from app.services.notifications import create_and_broadcast
    from app.models.user import UserRole
    admin_query = select(User).where(User.role == UserRole.ADMIN)
    admin_res = await db.execute(admin_query)
    for admin in admin_res.scalars().all():
        await create_and_broadcast(db, admin.id, "New Client Message", f"New message in project '{project.name}'", "message", f"/admin/projects/{project_id}")

    return message

@router.get("/projects/{project_id}/tickets", response_model=List[ProjectTaskResponse])
async def read_project_tickets(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Get support tickets for a specific project.
    """
    query = select(ClientProject).where(ClientProject.id == project_id, ClientProject.client_id == current_user.id)
    result = await db.execute(query)
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    t_query = select(ProjectTask).where(ProjectTask.project_id == project_id, ProjectTask.task_type == "TICKET").order_by(ProjectTask.created_at.desc())
    t_res = await db.execute(t_query)
    return t_res.scalars().all()

@router.post("/projects/{project_id}/tickets", response_model=ProjectTaskResponse)
async def create_project_ticket(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: str,
    ticket_in: ProjectTaskCreate,
    current_user: User = Depends(get_current_client_user)
) -> Any:
    """
    Create a new support ticket (saved as a ProjectTask with task_type=TICKET).
    """
    query = select(ClientProject).where(ClientProject.id == project_id, ClientProject.client_id == current_user.id)
    result = await db.execute(query)
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    ticket = ProjectTask(
        project_id=project_id,
        title=ticket_in.title,
        description=ticket_in.description,
        status="TODO",
        priority=ticket_in.priority or "MEDIUM",
        task_type="TICKET"
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket
