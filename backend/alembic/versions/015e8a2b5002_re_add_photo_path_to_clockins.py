"""Re-add photo_path to clockins

Revision ID: 015e8a2b5002
Revises: c8acd2dbaec6
Create Date: 2025-05-28 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '015e8a2b5002'
down_revision = 'c8acd2dbaec6'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Solo añadimos photo_path (el postal_code ya lo tiene la revisión anterior)
    op.add_column(
        'clockins',
        sa.Column('photo_path', sa.String(length=255), nullable=True),
    )

def downgrade() -> None:
    op.drop_column('clockins', 'photo_path')
