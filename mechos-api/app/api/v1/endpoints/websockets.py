from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket import manager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt
from app.core.config import settings
from app.core.security import ALGORITHM
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.client_portal import ClientProject

router = APIRouter()

async def get_user_from_token(token: str, db: AsyncSession):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        return result.scalars().first()
    except Exception:
        return None

@router.websocket("/ws/chat/{project_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket, 
    project_id: str,
    token: str = Query(...)
):
    async with AsyncSessionLocal() as db:
        user = await get_user_from_token(token, db)
        if not user:
            await websocket.close(code=1008)
            return
            
        if user.role == UserRole.CLIENT:
            query = select(ClientProject).where(ClientProject.id == project_id, ClientProject.client_id == user.id)
            result = await db.execute(query)
            if not result.scalars().first():
                await websocket.close(code=1008)
                return

    await manager.connect(project_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(project_id, {
                "type": "chat_message",
                "project_id": project_id,
                "sender": data.get("sender", "Client"),
                "content": data.get("content", ""),
                "created_at": data.get("created_at")
            })
    except WebSocketDisconnect:
        manager.disconnect(project_id, websocket)

@router.websocket("/ws/kanban")
async def websocket_kanban_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    # Kanban is admin only
    async with AsyncSessionLocal() as db:
        user = await get_user_from_token(token, db)
        if not user or user.role != UserRole.ADMIN:
            await websocket.close(code=1008)
            return

    await manager.connect("kanban", websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast("kanban", {
                "type": "task_updated",
                "task_id": data.get("task_id"),
                "status": data.get("status")
            })
    except WebSocketDisconnect:
        manager.disconnect("kanban", websocket)

@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...)
):
    async with AsyncSessionLocal() as db:
        user = await get_user_from_token(token, db)
        if not user or user.id != user_id:
            await websocket.close(code=1008)
            return

    room_id = f"notify_{user_id}"
    await manager.connect(room_id, websocket)
    try:
        while True:
            # We don't expect messages from client, but we need to keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
