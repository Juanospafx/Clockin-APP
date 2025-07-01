"""add user_locations table

Revision ID: abcdef123456
Revises: fae09323cfe1_add_approved
Create Date: 2025-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'abcdef123456'
down_revision = 'fae09323cfe1_add_approved'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'user_locations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('clockin_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_foreign_key(None, 'user_locations', 'users', ['user_id'], ['id'])
    op.create_foreign_key(None, 'user_locations', 'clockins', ['clockin_id'], ['id'])


def downgrade() -> None:
    op.drop_table('user_locations')
