"""Merge heads before unifying user roles

Revision ID: 6272d0e533fa
Revises: 83eba7ebc6f2_add_created_at, fae09323cfe1_add_approved
Create Date: 2025-06-03 08:19:14.748252

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6272d0e533fa'
down_revision: Union[str, None] = ('83eba7ebc6f2_add_created_at', 'fae09323cfe1_add_approved')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
