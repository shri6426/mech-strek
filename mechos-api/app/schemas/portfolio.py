from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

class PortfolioProjectBase(BaseModel):
    title: str
    category: str
    client: str
    year: str
    description: str
    challenge: Optional[str] = None
    solution: Optional[str] = None
    impact: Optional[str] = None
    image_url: str
    tags: List[str] = []
    featured: bool = False
    published: bool = True
    display_order: int = 0

class PortfolioProjectCreate(PortfolioProjectBase):
    pass

class PortfolioProjectResponse(PortfolioProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
