"""Add REST authentication columns

Revision ID: add_rest_auth_columns
Revises: initial_migration
Create Date: 2025-03-31 14:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_rest_auth_columns'
down_revision = 'initial_migration'
branch_labels = None
depends_on = None


def upgrade():
    # 添加 rest_user 和 rest_pass 列到 repository 表
    try:
        op.add_column('repository', sa.Column('rest_user', sa.String(100), nullable=True))
        print("Added rest_user column to repository table")
    except Exception as e:
        print(f"Column may already exist: {e}")
        
    try:
        op.add_column('repository', sa.Column('rest_pass', sa.String(256), nullable=True))
        print("Added rest_pass column to repository table")
    except Exception as e:
        print(f"Column may already exist: {e}")


def downgrade():
    # 在回滚时移除添加的列
    op.drop_column('repository', 'rest_user')
    op.drop_column('repository', 'rest_pass')