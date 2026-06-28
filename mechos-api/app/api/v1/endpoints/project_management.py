from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.models.project_management import ProjectTask
from app.schemas.project_management import ProjectTaskCreate, ProjectTaskUpdate, ProjectTaskResponse

router = APIRouter()

@router.get("/tasks", response_model=List[ProjectTaskResponse])
async def read_all_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ProjectTask).order_by(ProjectTask.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/tasks", response_model=ProjectTaskResponse)
async def create_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_in: ProjectTaskCreate,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    task = ProjectTask(**task_in.dict())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

@router.patch("/tasks/{task_id}", response_model=ProjectTaskResponse)
async def update_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_id: str,
    task_in: ProjectTaskUpdate,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(ProjectTask).where(ProjectTask.id == task_id)
    result = await db.execute(query)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return task
