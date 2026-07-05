from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.inquiry import InquiryStatus

class InquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    business: Optional[str] = Field(None, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    details: str = Field(..., min_length=10, max_length=5000)
    budget: str = Field(..., min_length=2, max_length=50)

class InquiryResponse(InquiryCreate):
    id: str
    status: InquiryStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
