"""separate employees from application users

Revision ID: 0005_employee_assignees
Revises: 0004_software_license_management
Create Date: 2026-04-05 10:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005_employee_assignees"
down_revision: str | None = "0004_software_license_management"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table_names = inspector.get_table_names()

    if "employees" not in table_names:
        op.create_table(
            "employees",
            sa.Column("id", sa.BigInteger(), nullable=False),
            sa.Column("department_id", sa.BigInteger(), nullable=True),
            sa.Column("employee_code", sa.String(length=100), nullable=False),
            sa.Column("full_name", sa.String(length=150), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("employee_code"),
        )

    asset_columns = {column["name"] for column in inspector.get_columns("assets")}
    if "assigned_employee_id" not in asset_columns:
        op.add_column("assets", sa.Column("assigned_employee_id", sa.BigInteger(), nullable=True))
    asset_fks = {fk["name"] for fk in inspector.get_foreign_keys("assets")}
    if "fk_assets_assigned_employee_id" not in asset_fks:
        op.create_foreign_key("fk_assets_assigned_employee_id", "assets", "employees", ["assigned_employee_id"], ["id"])

    assignment_columns = {column["name"] for column in inspector.get_columns("asset_assignments")}
    if "employee_id" not in assignment_columns:
        op.add_column("asset_assignments", sa.Column("employee_id", sa.BigInteger(), nullable=True))
    assignment_fks = {fk["name"] for fk in inspector.get_foreign_keys("asset_assignments")}
    if "fk_asset_assignments_employee_id" not in assignment_fks:
        op.create_foreign_key("fk_asset_assignments_employee_id", "asset_assignments", "employees", ["employee_id"], ["id"])

    employee_count = bind.execute(sa.text("SELECT COUNT(*) FROM employees")).scalar() or 0
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if employee_count == 0:
        updated_at_expr = "updated_at" if "updated_at" in user_columns else "created_at"
        created_at_expr = "created_at" if "created_at" in user_columns else "NOW()"
        op.execute(
            f"""
            INSERT INTO employees (id, department_id, employee_code, full_name, email, is_active, notes, created_at, updated_at)
            SELECT
                id,
                department_id,
                CONCAT('EMP-', LPAD(id, 5, '0')),
                full_name,
                email,
                is_active,
                'Creato automaticamente dalla migrazione utenti -> employees',
                {created_at_expr},
                {updated_at_expr}
            FROM users
            """
        )
    op.execute(
        """
        UPDATE assets
        SET assigned_employee_id = assigned_user_id
        WHERE assigned_employee_id IS NULL AND assigned_user_id IS NOT NULL
        """
    )
    op.execute(
        """
        UPDATE asset_assignments
        SET employee_id = user_id
        WHERE employee_id IS NULL AND user_id IS NOT NULL
        """
    )
    if "user_id" in assignment_columns:
        op.alter_column("asset_assignments", "user_id", existing_type=sa.BigInteger(), nullable=True)
    op.alter_column("asset_assignments", "employee_id", existing_type=sa.BigInteger(), nullable=False)


def downgrade() -> None:
    op.alter_column("asset_assignments", "user_id", existing_type=sa.BigInteger(), nullable=False)
    op.drop_constraint("fk_asset_assignments_employee_id", "asset_assignments", type_="foreignkey")
    op.drop_column("asset_assignments", "employee_id")
    op.drop_constraint("fk_assets_assigned_employee_id", "assets", type_="foreignkey")
    op.drop_column("assets", "assigned_employee_id")
    op.drop_table("employees")
