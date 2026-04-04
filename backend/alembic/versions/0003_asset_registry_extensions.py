"""asset registry extensions

Revision ID: 0003_asset_registry_extensions
Revises: 0002_asset_lifecycle_fields
Create Date: 2026-04-04 23:45:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_asset_registry_extensions"
down_revision: str | None = "0002_asset_lifecycle_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("asset_categories", sa.Column("parent_id", sa.BigInteger(), nullable=True))
    op.create_foreign_key(
        "fk_asset_categories_parent_id_asset_categories",
        "asset_categories",
        "asset_categories",
        ["parent_id"],
        ["id"],
    )

    op.add_column("assets", sa.Column("asset_type", sa.String(length=100), nullable=True))
    op.add_column("assets", sa.Column("brand", sa.String(length=150), nullable=True))
    op.add_column("assets", sa.Column("location_floor", sa.String(length=50), nullable=True))
    op.add_column("assets", sa.Column("location_room", sa.String(length=100), nullable=True))
    op.add_column("assets", sa.Column("location_rack", sa.String(length=100), nullable=True))
    op.add_column("assets", sa.Column("location_slot", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("assets", "location_slot")
    op.drop_column("assets", "location_rack")
    op.drop_column("assets", "location_room")
    op.drop_column("assets", "location_floor")
    op.drop_column("assets", "brand")
    op.drop_column("assets", "asset_type")

    op.drop_constraint("fk_asset_categories_parent_id_asset_categories", "asset_categories", type_="foreignkey")
    op.drop_column("asset_categories", "parent_id")
