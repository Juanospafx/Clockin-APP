"""Add postal_code and re-add photo_path to clockins

Revision ID: c8acd2dbaec6
Revises: 4ef8cb98da43
Create Date: 2025-05-28 10:35:59.978564
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c8acd2dbaec6'
down_revision = '4ef8cb98da43'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Añadimos postal_code
    op.add_column(
        'clockins',
        sa.Column('postal_code', sa.String(length=20), nullable=True),
    )
    # Re-añadimos photo_path
    op.add_column(
        'clockins',
        sa.Column('photo_path', sa.String(length=255), nullable=True),
    )

def downgrade() -> None:
    # En rollback, eliminamos primero photo_path y luego postal_code
    op.drop_column('clockins', 'photo_path')
    op.drop_column('clockins', 'postal_code')
