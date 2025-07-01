"""Add status, address and dates to Project

Revision ID: 351dcb8c8758
Revises: e515a1337a8d
Create Date: 2025-06-03 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '351dcb8c8758'
down_revision = 'e515a1337a8d'
branch_labels = None
depends_on = None


def upgrade():
    # 1) Crear (si no existe) el tipo ENUM para projectstatusenum
    projectstatusenum = sa.Enum(
        'start',
        'in_progress',
        'finished',
        name='projectstatusenum'
    )
    projectstatusenum.create(op.get_bind(), checkfirst=True)

    # 2) Agregar columnas a la tabla 'projects' solo si no existen
    op.execute("""
        ALTER TABLE projects
          ADD COLUMN IF NOT EXISTS status projectstatusenum NOT NULL DEFAULT 'start',
          ADD COLUMN IF NOT EXISTS state VARCHAR(100),
          ADD COLUMN IF NOT EXISTS city VARCHAR(100),
          ADD COLUMN IF NOT EXISTS street VARCHAR(200),
          ADD COLUMN IF NOT EXISTS street_number VARCHAR(50),
          ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
          ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
          ADD COLUMN IF NOT EXISTS location_long DOUBLE PRECISION,
          ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
    """)


def downgrade():
    # 1) Quitar columnas (en orden inverso) solo si existen
    op.execute("""
        ALTER TABLE projects
          DROP COLUMN IF EXISTS end_date,
          DROP COLUMN IF EXISTS start_date,
          DROP COLUMN IF EXISTS location_long,
          DROP COLUMN IF EXISTS location_lat,
          DROP COLUMN IF EXISTS postal_code,
          DROP COLUMN IF EXISTS street_number,
          DROP COLUMN IF EXISTS street,
          DROP COLUMN IF EXISTS city,
          DROP COLUMN IF EXISTS state,
          DROP COLUMN IF EXISTS status;
    """)

    # 2) Eliminar (si existe) el tipo ENUM projectstatusenum
    projectstatusenum = sa.Enum(
        'start',
        'in_progress',
        'finished',
        name='projectstatusenum'
    )
    projectstatusenum.drop(op.get_bind(), checkfirst=True)
