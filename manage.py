#!/usr/bin/env python3
"""
Resticly 数据库迁移管理脚本
用于创建和应用数据库迁移
"""

import os
import sys
import subprocess
import click
from flask.cli import FlaskGroup

from app import app, db

cli = FlaskGroup(app)

@cli.command("db_init")
def db_init():
    """创建迁移仓库"""
    result = subprocess.run(["flask", "db", "init"], capture_output=True, text=True)
    if result.returncode == 0:
        subprocess.run(["flask", "db", "stamp", "head"])
        print("Migration repository has been created.")
    else:
        print(f"Error: {result.stderr}")
        sys.exit(1)

@cli.command("db_migrate")
@click.option("--message", "-m", default="Auto-migration", help="Migration message")
def db_migrate(message):
    """创建迁移脚本"""
    result = subprocess.run(["flask", "db", "migrate", "-m", message], capture_output=True, text=True)
    if result.returncode == 0:
        print("Migration script created.")
    else:
        print(f"Error: {result.stderr}")
        sys.exit(1)

@cli.command("db_upgrade")
def db_upgrade():
    """应用迁移"""
    result = subprocess.run(["flask", "db", "upgrade"], capture_output=True, text=True)
    if result.returncode == 0:
        print("Database has been upgraded.")
    else:
        print(f"Error: {result.stderr}")
        sys.exit(1)

@cli.command("db_downgrade")
def db_downgrade():
    """回滚迁移"""
    result = subprocess.run(["flask", "db", "downgrade"], capture_output=True, text=True)
    if result.returncode == 0:
        print("Database has been downgraded.")
    else:
        print(f"Error: {result.stderr}")
        sys.exit(1)

@cli.command("db_current")
def db_current():
    """显示当前迁移版本"""
    subprocess.run(["flask", "db", "current"])

if __name__ == "__main__":
    cli()