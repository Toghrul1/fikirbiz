"""Add is_approved column and update role default

Revision ID: 9a1b2c3d4e5f
Revises: 8f2a3c5e9b71
Create Date: 2026-08-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9a1b2c3d4e5f'
down_revision: Union[str, Sequence[str], None] = '8f2a3c5e9b71'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_approved', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    # Update existing users to be approved so current admin/users can login
    op.execute("UPDATE users SET is_approved = true")


def downgrade() -> None:
    op.drop_column('users', 'is_approved')
