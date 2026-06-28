import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, func
from app.core.database import Base

class Testimonial(Base):
    __tablename__ = "testimonials"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quote = Column(Text, nullable=False)
    author = Column(String, nullable=False)
    role = Column(String, nullable=False)
    company = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    rating = Column(Integer, default=5, nullable=False)
    published = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
