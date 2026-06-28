from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ServiceBase(BaseModel):
    title: str
    description: str
    price_label: Optional[str] = None
    published: bool = True
    display_order: int = 0

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class FaqItemBase(BaseModel):
    question: str
    answer: str
    published: bool = True
    display_order: int = 0

class FaqItemCreate(FaqItemBase):
    pass

class FaqItemResponse(FaqItemBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
