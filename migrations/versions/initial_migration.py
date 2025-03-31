"""Initial migration

Revision ID: initial_migration
Revises: 
Create Date: 2025-03-31 09:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'initial_migration'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # 这些操作会在数据库已经存在相关表/列时被跳过
    # 确保repository表有repo_type字段
    try:
        op.add_column('repository', sa.Column('repo_type', sa.String(50), server_default='local'))
        print("Added repo_type column to repository table")
    except Exception as e:
        print(f"Column may already exist: {e}")


def downgrade():
    # 不要在回滚时删除repo_type列，因为这是核心功能，我们不希望丢失数据
    pass