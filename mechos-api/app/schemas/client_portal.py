from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Client Project ---
class ClientProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "In Progress"
    progress_percent: Optional[int] = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ClientProjectCreate(ClientProjectBase):
    client_id: str

class ClientProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    progress_percent: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ClientProjectResponse(ClientProjectBase):
    id: str
    client_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# --- Project Timeline ---
class ProjectTimelineBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_completed: Optional[bool] = False
    date: Optional[datetime] = None
    display_order: Optional[int] = 0

class ProjectTimelineCreate(ProjectTimelineBase):
    project_id: str

class ProjectTimelineUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    date: Optional[datetime] = None
    display_order: Optional[int] = None

class ProjectTimelineResponse(ProjectTimelineBase):
    id: str
    project_id: str

    class Config:
        orm_mode = True

# --- Invoice ---
class InvoiceBase(BaseModel):
    amount: float
    status: Optional[str] = "Pending"
    due_date: datetime
    pdf_url: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    client_id: str
    project_id: Optional[str] = None

class InvoiceResponse(InvoiceBase):
    id: str
    client_id: str
    project_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# --- Client File ---
class ClientFileBase(BaseModel):
    file_name: str
    file_url: str
    file_type: Optional[str] = "document"

class ClientFileCreate(ClientFileBase):
    project_id: str

class ClientFileResponse(ClientFileBase):
    id: str
    project_id: str
    uploader_id: str
    created_at: datetime

    class Config:
        orm_mode = True

# --- Project Message ---
class ProjectMessageBase(BaseModel):
    content: str

class ProjectMessageCreate(ProjectMessageBase):
    project_id: str

class ProjectMessageResponse(ProjectMessageBase):
    id: str
    project_id: str
    sender_id: str
    created_at: datetime

    class Config:
        orm_mode = True

