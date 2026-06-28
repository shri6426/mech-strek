from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.core.database import get_db
from app.schemas.testimonial import TestimonialResponse
from app.models.testimonial import Testimonial

router = APIRouter()

@router.get("/testimonials", response_model=List[TestimonialResponse])
async def get_testimonials(db: AsyncSession = Depends(get_db)):
    query = select(Testimonial).where(Testimonial.published == True).order_by(Testimonial.display_order.asc())
    result = await db.execute(query)
    return result.scalars().all()
