import enum
import uuid
from sqlalchemy import Column, String, Text, DateTime, Enum, func
from app.core.database import Base

class InquiryStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    MEETING_SCHEDULED = "MEETING_SCHEDULED"
    PROPOSAL_SENT = "PROPOSAL_SENT"
    NEGOTIATION = "NEGOTIATION"
    CONVERTED = "CONVERTED"
    PROJECT = "PROJECT"
    ARCHIVED = "ARCHIVED"

class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    business = Column(String, nullable=True)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    details = Column(Text, nullable=False)
    budget = Column(String, nullable=False)
    status = Column(Enum(InquiryStatus), default=InquiryStatus.NEW, nullable=False)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
