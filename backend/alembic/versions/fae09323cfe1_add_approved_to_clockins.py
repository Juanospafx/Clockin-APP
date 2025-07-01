"""add approved column to clockins

Revision ID: fae09323cfe1
Revises: 77692e05df27
Create Date: 2025-XX-XX XX:XX:XX.XXXXXX
"""
from alembic import op
import sqlalchemy as sa

# estos valores vienen de env.py
revision = 'fae09323cfe1_add_approved'
down_revision = '77692e05df27'
branch_labels = None
depends_on = None

def upgrade():
    # Usamos ALTER TABLE ... ADD COLUMN IF NOT EXISTS para no duplicar
    op.execute("""
        ALTER TABLE clockins
        ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE
    """)
    # Quitar el default, para que la columna quede sin server_default
    op.execute("""
        ALTER TABLE clockins
        ALTER COLUMN approved DROP DEFAULT
    """)

def downgrade():
    # Si queremos revertir, la eliminamos si existe
    op.execute("""
        ALTER TABLE clockins
        DROP COLUMN IF EXISTS approved
    """)
