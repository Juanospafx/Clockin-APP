"""add clockin_history table

Revision ID: 77692e05df27
Revises: 015e8a2b5002
Create Date: 2025-05-30 11:58:49.069020

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '77692e05df27'
down_revision: Union[str, None] = '015e8a2b5002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------------------------------------------------------
    # 1) CREAR Y CONVERTIR role → roleenum (igual que antes)
    # ---------------------------------------------------------
    # 1.1) crear tipo si no existe
    op.execute("""
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'roleenum') THEN
        CREATE TYPE roleenum AS ENUM('admin','user');
      END IF;
    END$$;
    """)
    # 1.2) quitar default antiguo
    op.alter_column('users','role', server_default=None)
    # 1.3) recastear la columna
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE roleenum USING role::roleenum;")
    # 1.4) reaplicar default y NOT NULL
    op.alter_column(
      'users','role',
      server_default=sa.text("'user'::roleenum"),
      nullable=False
    )

    # ---------------------------------------------------------
    # 2) RENOMBRAR user_type_enum → usertypeenum (sin recasteo)
    # ---------------------------------------------------------
    # 2.1) quitar default viejo
    op.alter_column('users','user_type', server_default=None)
    # 2.2) renombrar tipo
    op.execute("ALTER TYPE user_type_enum RENAME TO usertypeenum;")
    # 2.3) reaplicar default y NOT NULL (ya es el mismo tipo)
    op.alter_column(
      'users','user_type',
      server_default=sa.text("'office'::usertypeenum"),
      nullable=False
    )

    # ---------------------------------------------------------
    # 3) resto de operaciones auto-generadas
    # ---------------------------------------------------------
    op.drop_index(op.f('idx_clockin_history_clockin_id'), table_name='clockin_history')
    op.drop_index(op.f('idx_clockin_history_project_id'), table_name='clockin_history')
    op.drop_index(op.f('idx_clockin_history_user_id'), table_name='clockin_history')

    op.alter_column('clockins', 'user_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('clockins', 'start_time',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.DateTime(),
               existing_nullable=False)
    op.alter_column('clockins', 'end_time',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.DateTime(),
               existing_nullable=True)
    op.alter_column('clockins', 'location_lat',
               existing_type=sa.NUMERIC(precision=9, scale=6),
               type_=sa.Float(),
               existing_nullable=True)
    op.alter_column('clockins', 'location_long',
               existing_type=sa.NUMERIC(precision=9, scale=6),
               type_=sa.Float(),
               existing_nullable=True)
    op.drop_constraint(op.f('clockins_user_id_fkey'), 'clockins', type_='foreignkey')
    op.drop_constraint(op.f('clockins_project_id_fkey'), 'clockins', type_='foreignkey')
    op.create_foreign_key(None, 'clockins', 'users', ['user_id'], ['id'])
    op.create_foreign_key(None, 'clockins', 'projects', ['project_id'], ['id'])

    op.alter_column('detections', 'clockin_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.drop_constraint(op.f('detections_clockin_id_fkey'), 'detections', type_='foreignkey')
    op.create_foreign_key(None, 'detections', 'clockins', ['clockin_id'], ['id'])

    op.alter_column('project_history', 'project_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('project_history', 'user_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('project_history', 'date',
               existing_type=sa.DATE(),
               type_=sa.DateTime(),
               existing_nullable=False)
    op.alter_column('project_history', 'clockin_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.drop_constraint(op.f('project_history_user_id_fkey'), 'project_history', type_='foreignkey')
    op.drop_constraint(op.f('project_history_clockin_id_fkey'), 'project_history', type_='foreignkey')
    op.drop_constraint(op.f('project_history_project_id_fkey'), 'project_history', type_='foreignkey')
    op.create_foreign_key(None, 'project_history', 'users', ['user_id'], ['id'])
    op.create_foreign_key(None, 'project_history', 'clockins', ['clockin_id'], ['id'])
    op.create_foreign_key(None, 'project_history', 'projects', ['project_id'], ['id'])

    op.alter_column('projects', 'location_lat',
               existing_type=sa.NUMERIC(precision=9, scale=6),
               type_=sa.Float(),
               existing_nullable=True)
    op.alter_column('projects', 'location_long',
               existing_type=sa.NUMERIC(precision=9, scale=6),
               type_=sa.Float(),
               existing_nullable=True)

    op.create_unique_constraint(None, 'users', ['username'])
    op.create_unique_constraint(None, 'users', ['email'])


def downgrade() -> None:
    # -- revertir rename de usertypeenum --
    op.alter_column('users','user_type', server_default=None)
    op.execute("ALTER TYPE usertypeenum RENAME TO user_type_enum;")
    op.alter_column(
      'users','user_type',
      server_default=sa.text("'office'::character varying"),
      nullable=False
    )

    # -- revertir roleenum --
    op.alter_column('users','role', server_default=None)
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(10) USING role::text;")
    op.alter_column(
      'users','role',
      server_default=sa.text("'user'::character varying"),
      nullable=False
    )
    op.execute("DROP TYPE IF EXISTS roleenum;")

    # -- resto del downgrade auto-generado (igual que antes) --
    op.drop_constraint(None, 'users', type_='unique')
    op.drop_constraint(None, 'users', type_='unique')
    op.alter_column('projects', 'location_long',
               existing_type=sa.Float(),
               type_=sa.NUMERIC(precision=9, scale=6),
               existing_nullable=True)
    op.alter_column('projects', 'location_lat',
               existing_type=sa.Float(),
               type_=sa.NUMERIC(precision=9, scale=6),
               existing_nullable=True)
    op.drop_constraint(None, 'project_history', type_='foreignkey')
    op.drop_constraint(None, 'project_history', type_='foreignkey')
    op.drop_constraint(None, 'project_history', type_='foreignkey')
    op.create_foreign_key(op.f('project_history_project_id_fkey'), 'project_history', 'projects', ['project_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('project_history_clockin_id_fkey'), 'project_history', 'clockins', ['clockin_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('project_history_user_id_fkey'), 'project_history', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.alter_column('project_history', 'clockin_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('project_history', 'date',
               existing_type=sa.DateTime(),
               type_=sa.DATE(),
               existing_nullable=False)
    op.alter_column('project_history', 'user_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('project_history', 'project_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.drop_constraint(None, 'detections', type_='foreignkey')
    op.create_foreign_key(op.f('detections_clockin_id_fkey'), 'detections', 'clockins', ['clockin_id'], ['id'], ondelete='CASCADE')
    op.alter_column('detections', 'clockin_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.drop_constraint(None, 'clockins', type_='foreignkey')
    op.drop_constraint(None, 'clockins', type_='foreignkey')
    op.create_foreign_key(op.f('clockins_project_id_fkey'), 'clockins', 'projects', ['project_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('clockins_user_id_fkey'), 'clockins', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.alter_column('clockins', 'location_long',
               existing_type=sa.FLOAT(),
               type_=sa.NUMERIC(precision=9, scale=6),
               existing_nullable=True)
    op.alter_column('clockins', 'location_lat',
               existing_type=sa.FLOAT(),
               type_=sa.NUMERIC(precision=9, scale=6),
               existing_nullable=True)
    op.alter_column('clockins', 'end_time',
               existing_type=sa.DateTime(),
               type_=postgresql.TIMESTAMP(timezone=True),
               existing_nullable=True)
    op.alter_column('clockins', 'start_time',
               existing_type=sa.DateTime(),
               type_=postgresql.TIMESTAMP(timezone=True),
               existing_nullable=False)
    op.alter_column('clockins', 'user_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.create_index(op.f('idx_clockin_history_user_id'), 'clockin_history', ['user_id'], unique=False)
    op.create_index(op.f('idx_clockin_history_project_id'), 'clockin_history', ['project_id'], unique=False)
    op.create_index(op.f('idx_clockin_history_clockin_id'), 'clockin_history', ['clockin_id'], unique=False)
