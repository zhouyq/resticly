#!/bin/bash
set -e

# 等待PostgreSQL数据库准备好
echo "Waiting for PostgreSQL to start..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is up - executing command"

# 检查现有表，如果没有仓库表，创建所有表
echo "Checking database tables..."
if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1 FROM repository LIMIT 1" &>/dev/null; then
  echo "Tables not found - creating database tables..."
  python -c "from app import app, db; app.app_context().push(); db.create_all()"
else
  echo "Tables already exist - checking for missing columns..."
  # 检查repo_type列是否存在
  if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT repo_type FROM repository LIMIT 1" &>/dev/null; then
    echo "repo_type column not found - adding column..."
    PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "ALTER TABLE repository ADD COLUMN IF NOT EXISTS repo_type VARCHAR(50) DEFAULT 'local'"
  fi
  # 可以在这里添加更多的列检查...
fi

# 执行传入的命令
exec "$@"