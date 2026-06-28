import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_ready_check(async_client: AsyncClient):
    response = await async_client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}

@pytest.mark.asyncio
async def test_submit_contact_inquiry(async_client: AsyncClient):
    # Test submitting a valid inquiry
    inquiry_data = {
        "name": "Test User",
        "email": "test@example.com",
        "business": "Test Co",
        "service_interest": "Web App",
        "budget": "$10k-$25k",
        "details": "We need a new web application."
    }
    
    response = await async_client.post("/api/v1/contact", json=inquiry_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

@pytest.mark.asyncio
async def test_get_portfolio_empty(async_client: AsyncClient):
    # Without seeding the test db, portfolio should be empty
    response = await async_client.get("/api/v1/portfolio")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_admin_login_fail(async_client: AsyncClient):
    # Test logging in with wrong credentials
    form_data = {
        "username": "admin@mechstrek.in",
        "password": "wrongpassword"
    }
    response = await async_client.post("/api/v1/auth/login", data=form_data)
    assert response.status_code in [400, 401]
