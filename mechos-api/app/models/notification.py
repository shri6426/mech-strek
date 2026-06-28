import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)          # recipient user ID
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    type = Column(String, nullable=False, default="info")         # message | invoice | proposal | lead | payment
    link = Column(String, nullable=True)                          # deep link e.g. /portal/invoices
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
