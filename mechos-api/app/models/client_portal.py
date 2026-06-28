import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, func, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class ClientProject(Base):
    __tablename__ = "client_projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="In Progress", nullable=False) # e.g. "Onboarding", "In Progress", "Review", "Completed"
    progress_percent = Column(Integer, default=0, nullable=False)
    today_update = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    client = relationship("User")
    timelines = relationship("ProjectTimeline", back_populates="project", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="project", cascade="all, delete-orphan")
    files = relationship("ClientFile", back_populates="project", cascade="all, delete-orphan")
    messages = relationship("ProjectMessage", back_populates="project", cascade="all, delete-orphan")

class ProjectTimeline(Base):
    __tablename__ = "project_timelines"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("client_projects.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    date = Column(DateTime(timezone=True), nullable=True) # Target or completion date
    display_order = Column(Integer, default=0, nullable=False)

    project = relationship("ClientProject", back_populates="timelines")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("client_projects.id"), nullable=True)
    amount = Column(Float, nullable=False)
    status = Column(String, default="Pending", nullable=False) # "Pending", "Paid", "Overdue"
    due_date = Column(DateTime(timezone=True), nullable=False)
    pdf_url = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    client = relationship("User")
    project = relationship("ClientProject", back_populates="invoices")

class ClientFile(Base):
    __tablename__ = "client_files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("client_projects.id"), nullable=False, index=True)
    uploader_id = Column(String, ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_type = Column(String, nullable=True) # e.g. "pdf", "image", "document"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("ClientProject", back_populates="files")
    uploader = relationship("User")

class ProjectMessage(Base):
    __tablename__ = "project_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("client_projects.id"), nullable=False, index=True)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("ClientProject", back_populates="messages")
    sender = relationship("User")
