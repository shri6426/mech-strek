from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.user import Token, UserResponse
from app.api.deps import get_current_user
from app.core.rate_limit import limiter

router = APIRouter()

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login_access_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    query = select(User).where(User.email == form_data.username)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            subject=user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: User = Depends(get_current_user)
):
    return current_user

from app.core.security import ALGORITHM
from jose import jwt, JWTError
from fastapi.responses import RedirectResponse

@router.get("/magic-login")
async def magic_login(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired magic link",
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "magic":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user or not user.is_active:
        raise credentials_exception

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )

    redirect_url = f"{settings.FRONTEND_URL}/portal?token={access_token}"
    return RedirectResponse(url=redirect_url)


# ─── Google OAuth Endpoints ─────────────────────────
import uuid
from app.services.google_oauth import oauth
from app.models.user import UserRole
from app.core.security import get_password_hash

@router.get("/google/login")
async def google_login(request: Request):
    redirect_uri = settings.GOOGLE_CALLBACK_URL
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        if not user_info or not user_info.get("email"):
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/portal/login?error=google_auth_failed")
    except Exception as e:
        print(f"Authlib authorization exception: {e}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/portal/login?error=google_auth_failed")

    email = user_info.get("email")
    full_name = user_info.get("name", "Google User")

    # Search for user
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        # Auto-create ADMIN role for official mechstrek.in email addresses
        if email.endswith("@mechstrek.in"):
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(str(uuid.uuid4())),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Client SSO requires a pre-existing invited user record
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/portal/login?error=not_registered")

    if not user.is_active:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/portal/login?error=user_inactive")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )

    if user.role == UserRole.ADMIN:
        redirect_url = f"{settings.FRONTEND_URL}/admin?token={access_token}"
    else:
        redirect_url = f"{settings.FRONTEND_URL}/portal?token={access_token}"

    return RedirectResponse(url=redirect_url)

