from sqlalchemy import Column, String, DateTime, func
from app.core.database import Base

class ProcessedStripeEvent(Base):
    __tablename__ = "processed_stripe_events"

    id = Column(String, primary_key=True) # Stripe Event ID (evt_...)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
