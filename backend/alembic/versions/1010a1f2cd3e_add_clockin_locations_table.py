"""add clockin_locations table

Revision ID: 1010a1f2cd3e
Revises: fae09323cfe1_add_approved
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '1010a1f2cd3e'
down_revision = 'fae09323cfe1_add_approved'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'clockin_locations',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('clockin_id', sa.UUID(), sa.ForeignKey('clockins.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False)
    )


def downgrade() -> None:
    op.drop_table('clockin_locations')
