"""add asset lifecycle fields"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0002_asset_lifecycle_fields"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("assets", sa.Column("warranty_expiry_date", sa.Date(), nullable=True))
    op.add_column("assets", sa.Column("expected_end_of_life_date", sa.Date(), nullable=True))
    op.add_column("assets", sa.Column("disposal_date", sa.Date(), nullable=True))
    op.add_column("assets", sa.Column("cost_center", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("assets", "cost_center")
    op.drop_column("assets", "disposal_date")
    op.drop_column("assets", "expected_end_of_life_date")
    op.drop_column("assets", "warranty_expiry_date")
