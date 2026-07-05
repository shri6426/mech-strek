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
    assert response.json() == {"status": "ready", "db": "connected"}

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

from unittest.mock import AsyncMock, patch
from fastapi.responses import RedirectResponse

@pytest.mark.asyncio
async def test_google_login_redirect(async_client: AsyncClient):
    with patch("app.services.google_oauth.oauth.google.authorize_redirect", return_value=RedirectResponse("https://accounts.google.com/o/oauth2/v2/auth")):
        response = await async_client.get("/api/v1/auth/google/login", follow_redirects=False)
        assert response.status_code in [302, 307]
        assert "accounts.google.com" in response.headers["location"]

@pytest.mark.asyncio
async def test_google_callback_new_admin(async_client: AsyncClient, db_session):
    # SECURITY NOTE: Only emails in ADMIN_ALLOWED_EMAILS or INITIAL_ADMIN_EMAIL can be auto-promoted.
    # Using the seeded INITIAL_ADMIN_EMAIL ensures the allowlist check passes.
    from app.core.config import settings as app_settings
    mock_token = {"userinfo": {"email": app_settings.INITIAL_ADMIN_EMAIL, "name": "Initial Admin"}}
    
    with patch("app.services.google_oauth.oauth.google.authorize_access_token", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = mock_token
        response = await async_client.get("/api/v1/auth/google/callback", follow_redirects=False)
        assert response.status_code in [302, 307]
        assert "/admin/login?code=" in response.headers["location"]

@pytest.mark.asyncio
async def test_google_callback_existing_admin(async_client: AsyncClient, db_session, admin_user):
    mock_token = {"userinfo": {"email": admin_user.email, "name": admin_user.full_name}}
    
    with patch("app.services.google_oauth.oauth.google.authorize_access_token", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = mock_token
        response = await async_client.get("/api/v1/auth/google/callback", follow_redirects=False)
        assert response.status_code in [302, 307]
        assert "/admin/login?code=" in response.headers["location"]

@pytest.mark.asyncio
async def test_google_callback_unregistered_client(async_client: AsyncClient):
    mock_token = {"userinfo": {"email": "unregistered@gmail.com", "name": "Unregistered Client"}}
    
    with patch("app.services.google_oauth.oauth.google.authorize_access_token", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = mock_token
        response = await async_client.get("/api/v1/auth/google/callback", follow_redirects=False)
        assert response.status_code in [302, 307]
        assert "error=not_registered" in response.headers["location"]

@pytest.mark.asyncio
async def test_manual_payment_flow(async_client: AsyncClient, db_session, client_user, client_headers, admin_headers):
    from app.models.client_portal import Invoice
    from app.models.user import User
    from datetime import datetime, timedelta
    from sqlalchemy.future import select
    
    res = await db_session.execute(select(User).where(User.email == "client@mechstrek.in"))
    client = res.scalars().first()
    
    invoice = Invoice(
        client_id=client.id,
        amount=5000.0,
        status="Pending",
        due_date=datetime.now() + timedelta(days=30)
    )
    db_session.add(invoice)
    await db_session.commit()
    await db_session.refresh(invoice)
    
    # 1. Submit manual payment
    response = await async_client.post(
        f"/api/v1/invoices/client/{invoice.id}/submit-manual-payment",
        data={"utr": "UTR123456789"},
        headers=client_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Under Review"
    assert data["utr"] == "UTR123456789"
    assert data["payment_method"] == "MANUAL_UPI"
    
    # 2. Admin verifies and approves payment
    response = await async_client.post(
        f"/api/v1/invoices/admin/{invoice.id}/verify-payment",
        json={"approve": True},
        headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Paid"
