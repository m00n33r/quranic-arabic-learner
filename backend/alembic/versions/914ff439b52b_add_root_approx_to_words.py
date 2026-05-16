"""add_root_approx_to_words

Revision ID: 914ff439b52b
Revises: 8bf7dca26d2a
Create Date: 2026-04-10 02:34:55.404941

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '914ff439b52b'
down_revision: Union[str, Sequence[str], None] = '8bf7dca26d2a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('words', sa.Column('root_approx', sa.String(6), nullable=True))
    op.create_index('ix_words_root_approx', 'words', ['root_approx'])


def downgrade() -> None:
    op.drop_index('ix_words_root_approx', table_name='words')
    op.drop_column('words', 'root_approx')
