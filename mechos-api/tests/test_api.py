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

@pytest.mark.asyncio
async def test_admin_login_success(async_client: AsyncClient, admin_user):
    # Test logging in with correct credentials
    form_data = {
        "username": "admin@mechstrek.in",
        "password": "password123"
    }
    response = await async_client.post("/api/v1/auth/login", data=form_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_client_read_notifications_empty(async_client: AsyncClient, client_headers):
    # Retrieve notifications when empty
    response = await async_client.get("/api/v1/notifications", headers=client_headers)
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_notifications_crud(async_client: AsyncClient, db_session, client_user, client_headers):
    from app.models.notification import Notification
    
    # Seed a notification in DB
    notif = Notification(
        user_id=client_user.id,
        title="Test Notification",
        body="Body of notification",
        type="info",
        is_read=False
    )
    db_session.add(notif)
    await db_session.commit()
    await db_session.refresh(notif)
    
    # 1. Read notifications
    response = await async_client.get("/api/v1/notifications", headers=client_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Test Notification"
    
    # 2. Dismiss specific notification
    notif_id = data[0]["id"]
    response = await async_client.delete(f"/api/v1/notifications/{notif_id}", headers=client_headers)
    assert response.status_code == 204
    
    # 3. Read again - should be empty
    response = await async_client.get("/api/v1/notifications", headers=client_headers)
    assert response.status_code == 200
    assert len(response.json()) == 0

@pytest.mark.asyncio
async def test_client_invoices_and_pdf(async_client: AsyncClient, db_session, client_user, client_headers):
    from app.models.client_portal import Invoice
    from datetime import datetime, timedelta
    
    # Seed an invoice in DB
    invoice = Invoice(
        client_id=client_user.id,
        amount=15000.0,
        status="Pending",
        due_date=datetime.now() + timedelta(days=30)
    )
    db_session.add(invoice)
    await db_session.commit()
    await db_session.refresh(invoice)
    
    # 1. Fetch client invoices
    response = await async_client.get("/api/v1/invoices/client", headers=client_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["amount"] == 15000.0
    
    # 2. Pay the invoice
    inv_id = data[0]["id"]
    response = await async_client.post(f"/api/v1/invoices/client/{inv_id}/pay", headers=client_headers)
    assert response.status_code == 200
    paid_inv = response.json()
    assert paid_inv["status"] == "Paid"
    
    # 3. Get invoice PDF download
    response = await async_client.get(f"/api/v1/invoices/client/{inv_id}/pdf", headers=client_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0

@pytest.mark.asyncio
async def test_verify_session(async_client: AsyncClient, client_headers):
    response = await async_client.get("/api/v1/payments/verify-session/mock_session_123", headers=client_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "paid"
