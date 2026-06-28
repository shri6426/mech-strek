import asyncio
import sys
import os

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def seed_admin():
    async with AsyncSessionLocal() as session:
        from app.core.config import settings
        email = settings.INITIAL_ADMIN_EMAIL
        password = settings.INITIAL_ADMIN_PASSWORD

        # Check if user already exists
        query = select(User).where(User.email == email)
        result = await session.execute(query)
        existing_user = result.scalars().first()

        if existing_user:
            print(f"User {email} already exists!")
            return

        admin_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name="MechStrek Founder",
            role=UserRole.ADMIN,
            is_active=True
        )

        session.add(admin_user)
        await session.commit()
        print(f"✅ Successfully seeded admin user: {email} / {password}")

if __name__ == "__main__":
    asyncio.run(seed_admin())
