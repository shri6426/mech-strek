from authlib.integrations.starlette_client import OAuth
from app.core.config import settings

oauth = OAuth()

# Register the google client dynamically
# Authlib will validate client_id and client_secret parameters
google_client_config = {
    "client_id": settings.GOOGLE_CLIENT_ID,
    "client_secret": settings.GOOGLE_CLIENT_SECRET,
    "server_metadata_url": "https://accounts.google.com/.well-known/openid-configuration",
    "client_kwargs": {
        "scope": "openid email profile"
    }
}

if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        **google_client_config
    )
else:
    # Register mock client or placeholder if not configured to avoid startup crashes
    oauth.register(
        name="google",
        client_id="dummy_id",
        client_secret="dummy_secret",
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={
            "scope": "openid email profile"
        }
    )
