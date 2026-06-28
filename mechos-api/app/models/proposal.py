import uuid
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="DRAFT", nullable=False)  # DRAFT, SENT, ACCEPTED, REJECTED
    total_amount = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    client = relationship("User")
    scope_items = relationship("ProposalScopeItem", back_populates="proposal", cascade="all, delete-orphan")

class ProposalScopeItem(Base):
    __tablename__ = "proposal_scope_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    proposal_id = Column(String, ForeignKey("proposals.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, default=0.0, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    proposal = relationship("Proposal", back_populates="scope_items")
