from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "TODO"
    priority: Optional[str] = "MEDIUM"
    task_type: Optional[str] = "TASK"
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None

class ProjectTaskCreate(ProjectTaskBase):
    project_id: str

class ProjectTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    task_type: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None

class ProjectTaskResponse(ProjectTaskBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
