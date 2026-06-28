from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    query = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50)
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    *,
    db: AsyncSession = Depends(get_db),
    notification_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    query = select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    result = await db.execute(query)
    notif = result.scalars().first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif

@router.patch("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = update(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False).values(is_read=True)
    await db.execute(stmt)
    await db.commit()
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def dismiss_notification(
    *,
    db: AsyncSession = Depends(get_db),
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    query = select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    result = await db.execute(query)
    notif = result.scalars().first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    await db.delete(notif)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
