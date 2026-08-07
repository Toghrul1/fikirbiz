"""Add image_generations table

Revision ID: 8f2a3c5e9b71
Revises: 6e4758be9f4f
Create Date: 2026-08-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '8f2a3c5e9b71'
down_revision: Union[str, Sequence[str], None] = '6e4758be9f4f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('image_generations',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_image_generations_user_id', 'image_generations', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_image_generations_user_id', table_name='image_generations')
    op.drop_table('image_generations')
