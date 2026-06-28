import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from app.core.config import settings
from app.core.database import Base
from app.models.user import User
from app.models.inquiry import Inquiry
from app.models.portfolio import PortfolioProject
from app.models.testimonial import Testimonial
from app.models.cms import Service, FaqItem
from app.models.audit import AuditLog
from app.models.client_portal import ClientProject, ProjectTimeline, Invoice, ClientFile, ProjectMessage
from app.models.proposal import Proposal, ProposalScopeItem
from app.models.project_management import ProjectTask, ProjectMilestone, ActivityFeed

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = settings.DATABASE_URL or config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    if settings.DATABASE_URL:
        from sqlalchemy.ext.asyncio import create_async_engine
        connectable = create_async_engine(
            settings.DATABASE_URL,
            poolclass=pool.NullPool,
            connect_args={"prepared_statement_cache_size": 0, "statement_cache_size": 0}
        )
    else:
        connectable = async_engine_from_config(
            configuration,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
