import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
import sys
import json
import sqlalchemy
from sqlalchemy.types import TypeDecorator, TEXT

class SqliteArray(TypeDecorator):
    impl = TEXT
    cache_ok = True
    def __init__(self, *args, **kwargs):
        super().__init__()
    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return None
    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return None

# Override ARRAY for SQLite testing support
sqlalchemy.ARRAY = SqliteArray

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.core.config import settings

# Use an in-memory SQLite database for testing, since we just want fast functional tests.
# In a real scenario we'd spin up a test Postgres DB, but sqlite is faster for unit tests.
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine_test, class_=AsyncSession)

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def setup_db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine_test.dispose()

@pytest.fixture(scope="function")
async def db_session(setup_db) -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session

import httpx

@pytest.fixture(scope="function")
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = httpx.ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
