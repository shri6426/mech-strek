from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.core.database import get_db
from app.schemas.cms import ServiceResponse, FaqItemResponse
from app.models.cms import Service, FaqItem

router = APIRouter()

@router.get("/services", response_model=List[ServiceResponse])
async def get_services(db: AsyncSession = Depends(get_db)):
    query = select(Service).where(Service.published == True).order_by(Service.display_order.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/faq", response_model=List[FaqItemResponse])
async def get_faq_items(db: AsyncSession = Depends(get_db)):
    query = select(FaqItem).where(FaqItem.published == True).order_by(FaqItem.display_order.asc())
    result = await db.execute(query)
    return result.scalars().all()
