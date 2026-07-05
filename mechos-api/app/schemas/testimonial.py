from pydantic import BaseModel, HttpUrl, ConfigDict
from typing import Optional
from datetime import datetime

class TestimonialBase(BaseModel):
    quote: str
    author: str
    role: str
    company: str
    avatar_url: Optional[str] = None
    rating: int = 5
    published: bool = True
    display_order: int = 0

class TestimonialCreate(TestimonialBase):
    pass

class TestimonialResponse(TestimonialBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
