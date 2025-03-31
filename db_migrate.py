import os
import sys
import psycopg2
from psycopg2 import sql

def get_db_connection():
    """获取数据库连接"""
    conn = psycopg2.connect(
        host=os.environ.get('PGHOST', 'localhost'),
        database=os.environ.get('PGDATABASE', 'resticly'),
        user=os.environ.get('PGUSER', 'resticly'),
        password=os.environ.get('PGPASSWORD', 'resticly')
    )
    conn.autocommit = True
    return conn

def column_exists(conn, table, column):
    """检查列是否存在"""
    cur = conn.cursor()
    cur.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = %s AND column_name = %s
    """, (table, column))
    exists = bool(cur.fetchone())
    cur.close()
    return exists

def add_repo_type_column():
    """添加repo_type列到repository表"""
    conn = get_db_connection()
    try:
        # 检查repository表是否存在
        cur = conn.cursor()
        cur.execute("SELECT to_regclass('public.repository')")
        if not cur.fetchone()[0]:
            print("仓库表不存在，请先创建表")
            cur.close()
            return False
        
        cur.close()
        
        # 检查repo_type列是否存在
        if column_exists(conn, 'repository', 'repo_type'):
            print("repo_type列已存在")
            return True
        
        # 添加repo_type列
        cur = conn.cursor()
        cur.execute("""
            ALTER TABLE repository 
            ADD COLUMN repo_type VARCHAR(50) DEFAULT 'local'
        """)
        cur.close()
        print("成功添加repo_type列到repository表")
        return True
    except Exception as e:
        print(f"发生错误: {e}")
        return False
    finally:
        conn.close()

def main():
    """主函数"""
    print("正在执行数据库迁移...")
    if add_repo_type_column():
        print("数据库迁移成功完成")
    else:
        print("数据库迁移失败")
        sys.exit(1)

if __name__ == "__main__":
    main()