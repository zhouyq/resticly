#!/bin/bash
set -e

# 等待PostgreSQL数据库准备好
echo "Waiting for PostgreSQL to start..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is up - executing command"

# 使用Flask-Migrate进行数据库迁移
echo "Running database migrations..."
if [ -d "migrations/versions" ] && [ "$(ls -A migrations/versions)" ]; then
  # 如果已有迁移文件，直接应用迁移
  echo "Applying existing migrations..."
  python manage.py db_upgrade
  
  # 检查数据库表结构，确保所有必需的列都存在
  echo "Verifying database schema..."
  python db_migrate.py
else
  # 如果没有迁移文件，初始化迁移仓库并创建初始迁移
  echo "Initializing migration repository..."
  python manage.py db_init
  echo "Creating initial migration..."
  python manage.py db_migrate
  echo "Applying initial migration..."
  python manage.py db_upgrade
fi

# 执行传入的命令
exec "$@"