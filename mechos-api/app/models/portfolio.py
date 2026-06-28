import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, func, ARRAY
from app.core.database import Base

class PortfolioProject(Base):
    __tablename__ = "portfolio_projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    client = Column(String, nullable=False)
    year = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    challenge = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    impact = Column(String, nullable=True)
    image_url = Column(String, nullable=False)
    tags = Column(ARRAY(String), nullable=True)
    featured = Column(Boolean, default=False, nullable=False)
    published = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
