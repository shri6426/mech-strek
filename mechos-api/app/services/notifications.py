from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.services.websocket import manager
from datetime import datetime

async def create_and_broadcast(db: AsyncSession, user_id: str, title: str, body: str, notification_type: str = "info", link: str = None):
    # 1. Persist to DB
    new_notif = Notification(
        user_id=user_id,
        title=title,
        body=body,
        type=notification_type,
        link=link
    )
    db.add(new_notif)
    await db.commit()
    await db.refresh(new_notif)

    # 2. Push via WebSocket manager to /ws/notifications/{user_id}
    # We will use the room_id pattern `notify_{user_id}` for this channel.
    await manager.broadcast(f"notify_{user_id}", {
        "id": new_notif.id,
        "type": "notification",
        "notification_type": new_notif.type,
        "title": new_notif.title,
        "body": new_notif.body,
        "link": new_notif.link,
        "is_read": new_notif.is_read,
        "created_at": new_notif.created_at.isoformat()
    })
    
    return new_notif
