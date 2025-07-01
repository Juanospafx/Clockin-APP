"""add created_at to clockins

Revision ID: 83eba7ebc6f2_add_created_at
Revises: 77692e05df27
Create Date: 2025-06-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '83eba7ebc6f2_add_created_at'
down_revision = '77692e05df27'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(""
        'clockins',
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('NOW()')
        )
    )
    # Opcional: elimina el default una vez poblados los registros
    op.alter_column('clockins', 'created_at', server_default=None)

def downgrade():
    op.drop_column('clockins', 'created_at')
