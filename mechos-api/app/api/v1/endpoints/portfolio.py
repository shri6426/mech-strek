from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from app.core.database import get_db
from app.schemas.portfolio import PortfolioProjectResponse
from app.models.portfolio import PortfolioProject

router = APIRouter()

@router.get("/portfolio", response_model=List[PortfolioProjectResponse])
async def get_portfolio_projects(
    category: Optional[str] = Query(None, description="Filter projects by category"),
    db: AsyncSession = Depends(get_db)
):
    query = select(PortfolioProject).where(PortfolioProject.published == True)
    if category and category != "All":
        query = query.where(PortfolioProject.category == category)
    
    query = query.order_by(PortfolioProject.display_order.asc(), PortfolioProject.created_at.desc())
    result = await db.execute(query)
    projects = result.scalars().all()
    return projects
