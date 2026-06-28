from sqlalchemy import Column, String, DateTime, func, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, index=True)
    target = Column(String)  # e.g., "Inquiry", "PortfolioProject"
    target_id = Column(Integer, nullable=True)
    user_id = Column(String, ForeignKey("users.id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(String, nullable=True) # JSON string or text

    user = relationship("User")
