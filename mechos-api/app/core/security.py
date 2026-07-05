from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
import bcrypt
import uuid
from app.core.config import settings

ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    jti = str(uuid.uuid4())  # unique token ID — used for revocation
    to_encode = {"exp": expire, "sub": str(subject), "jti": jti}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_magic_token(subject: Union[str, Any]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    jti = str(uuid.uuid4())
    to_encode = {"exp": expire, "sub": str(subject), "type": "magic", "jti": jti}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_auth_code() -> str:
    """Generate a cryptographically secure one-time auth code for the URL exchange flow."""
    return uuid.uuid4().hex + uuid.uuid4().hex  # 64-char hex, single-use

