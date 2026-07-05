import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, Boolean, DateTime, func, ForeignKey
from app.core.database import Base


class AuthCode(Base):
    """
    One-time short-lived code issued after Google OAuth / magic-link login.
    The frontend exchanges this code for a real JWT via GET /auth/exchange?code=XXX.
    Prevents JWT from ever appearing in redirect URLs (no browser history / log leakage).
    """
    __tablename__ = "auth_codes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class RevokedToken(Base):
    """
    Blocklist of revoked JWT IDs (jti claim).  Checked in get_current_user so
    that a forced logout / token rotation takes effect immediately even though
    the JWT itself hasn't expired yet.
    """
    __tablename__ = "revoked_tokens"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    jti = Column(String, unique=True, index=True, nullable=False)   # JWT id claim
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    revoked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)  # for cleanup
