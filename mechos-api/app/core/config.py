from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, field_validator
from typing import Optional, Any

class Settings(BaseSettings):
    PROJECT_NAME: str = "MechOS API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development" # development, staging, production
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    
    # Google OAuth Settings
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_CALLBACK_URL: str = "http://localhost:8000/api/v1/auth/google/callback"
    
    # Seeding Settings
    INITIAL_ADMIN_EMAIL: str = "admin@mechstrek.in"
    INITIAL_ADMIN_PASSWORD: str = "AdminPassword123!"
    
    # Email Settings
    EMAIL_FROM: str = "MechOS <noreply@mechstrek.in>"
    
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "mechos_db"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v: Optional[str], values: Any) -> Any:
        if isinstance(v, str) and v:
            return v
        return f"postgresql+asyncpg://postgres:postgres@localhost:5432/mechos_db"

    SECRET_KEY: str = "temporary_secret_key_for_development"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    RESEND_API_KEY: Optional[str] = None
    ADMIN_NOTIFICATION_EMAIL: str = "mechstrek@gmail.com"

    # Admin email allowlist for Google OAuth auto-provisioning (comma-separated)
    # Example: "admin@mechstrek.in,cto@mechstrek.in"
    ADMIN_ALLOWED_EMAILS: str = ""  # Set in .env

    # Simulation webhook secret (dev only, must be set in .env)
    SIMULATION_WEBHOOK_KEY: str = "dev-sim-key-change-me"

    # Stripe Settings
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # Supabase Settings
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_BUCKET: str = "client-vault"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
