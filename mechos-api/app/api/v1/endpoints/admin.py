from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.models.inquiry import Inquiry, InquiryStatus
from app.schemas.inquiry import InquiryResponse

router = APIRouter()

class InquiryStatusUpdate(BaseModel):
    status: InquiryStatus

@router.get("/inquiries", response_model=List[InquiryResponse])
async def list_admin_inquiries(
    status_filter: Optional[InquiryStatus] = None,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    query = select(Inquiry)
    if status_filter:
        query = query.where(Inquiry.status == status_filter)
    query = query.order_by(Inquiry.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/inquiries/{inquiry_id}", response_model=InquiryResponse)
async def update_inquiry_status(
    inquiry_id: str,
    status_in: InquiryStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    query = select(Inquiry).where(Inquiry.id == inquiry_id)
    result = await db.execute(query)
    inquiry = result.scalars().first()

    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    inquiry.status = status_in.status
    await db.commit()
    await db.refresh(inquiry)
    return inquiry

from app.schemas.user import UserResponse, UserCreate
from app.core.security import get_password_hash

@router.get("/clients", response_model=List[UserResponse])
async def list_admin_clients(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    query = select(User).where(User.role == "CLIENT").order_by(User.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/clients", response_model=UserResponse)
async def create_client(
    client_in: dict,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    # Quick creation for admin
    existing = await db.execute(select(User).where(User.email == client_in.get("email")))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    client = User(
        email=client_in.get("email"),
        hashed_password=get_password_hash(client_in.get("password", "changeme")),
        full_name=client_in.get("full_name"),
        role="CLIENT"
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client
