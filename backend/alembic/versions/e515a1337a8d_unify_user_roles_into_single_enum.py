"""Unify user roles into single enum

Revision ID: e515a1337a8d
Revises: 6272d0e533fa_merge_heads_before_unifying_user_roles
Create Date: 2025-06-03 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# -------------------------------------------------------------------
revision = 'e515a1337a8d'
down_revision = '6272d0e533fa'
branch_labels = None
depends_on = None
# -------------------------------------------------------------------

def upgrade():
    # 1) Creamos el nuevo enum en la base de datos
    op.execute("CREATE TYPE userroleenum AS ENUM ('admin','field','office');")

    # 2) Si hay filas con role='user', las convertimos a 'field'
    op.execute("UPDATE users SET role = 'field' WHERE role::text = 'user';")

    # 3) Quitamos cualquier default que existiera en users.role
    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT;")

    # 4) Cambiamos el tipo de la columna role a userroleenum
    op.alter_column(
        'users',
        'role',
        type_=postgresql.ENUM('admin','field','office', name='userroleenum'),
        postgresql_using="role::text::userroleenum",
        nullable=False,
        existing_type=sa.Enum('admin','user', name='roleenum')
    )

    # 5) Eliminamos el enum antiguo roleenum
    op.execute("DROP TYPE roleenum;")

    # 6) Eliminamos la columna users.user_type (y su enum)
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('user_type')
    op.execute("DROP TYPE IF EXISTS usertypeenum;")

def downgrade():
    # 1) Volvemos a crear el enum usertypeenum
    op.execute("CREATE TYPE usertypeenum AS ENUM ('office','field');")

    # 2) Readicionamos la columna user_type con su enum original
    op.add_column('users',
        sa.Column(
            'user_type',
            sa.Enum('office','field', name='usertypeenum'),
            nullable=False,
            server_default='office'
        )
    )

    # 3) Quitamos default de role antes de revertir tipo
    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT;")

    # 4) Cambiamos el tipo de users.role de vuelta a roleenum
    op.alter_column(
        'users',
        'role',
        type_=sa.Enum('admin','user', name='roleenum'),
        postgresql_using="role::text::roleenum",
        nullable=False,
        existing_type=postgresql.ENUM('admin','field','office', name='userroleenum')
    )

    # 5) Eliminamos userroleenum
    op.execute("DROP TYPE userroleenum;")

    # 6) Recreamos roleenum
    op.execute("CREATE TYPE roleenum AS ENUM ('admin','user');")
