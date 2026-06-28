"""update inquiry statuses

Revision ID: 3e76a37a706c
Revises: '9a3bbdcf52da'
Create Date: 2026-06-30 23:16:07.668396

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3e76a37a706c'
down_revision: Union[str, None] = '9a3bbdcf52da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Commit existing transaction to run ALTER TYPE
    op.execute("COMMIT")
    for value in ["MEETING_SCHEDULED", "PROPOSAL_SENT", "NEGOTIATION", "PROJECT"]:
        try:
            op.execute(f"ALTER TYPE inquirystatus ADD VALUE '{value}'")
        except Exception:
            pass

def downgrade() -> None:
    pass
