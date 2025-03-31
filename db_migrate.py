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

def table_exists(conn, table):
    """检查表是否存在"""
    cur = conn.cursor()
    cur.execute("SELECT to_regclass(%s)", (f'public.{table}',))
    result = cur.fetchone()
    exists = result is not None and result[0] is not None
    cur.close()
    return exists

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
        if not table_exists(conn, 'repository'):
            print("仓库表不存在，请先运行数据库迁移")
            return False
        
        # 检查repo_type列是否存在
        if column_exists(conn, 'repository', 'repo_type'):
            print("repo_type列已存在")
        else:
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
        print(f"添加repo_type列时发生错误: {e}")
        return False
    finally:
        conn.close()
        
def add_rest_auth_columns():
    """添加rest_user和rest_pass列到repository表"""
    conn = get_db_connection()
    success = True
    
    try:
        # 检查repository表是否存在
        if not table_exists(conn, 'repository'):
            print("仓库表不存在，请先运行数据库迁移")
            return False
        
        # 检查rest_user列是否存在
        if column_exists(conn, 'repository', 'rest_user'):
            print("rest_user列已存在")
        else:
            # 添加rest_user列
            cur = conn.cursor()
            cur.execute("""
                ALTER TABLE repository 
                ADD COLUMN rest_user VARCHAR(100) NULL
            """)
            cur.close()
            print("成功添加rest_user列到repository表")
            
        # 检查rest_pass列是否存在
        if column_exists(conn, 'repository', 'rest_pass'):
            print("rest_pass列已存在")
        else:
            # 添加rest_pass列
            cur = conn.cursor()
            cur.execute("""
                ALTER TABLE repository 
                ADD COLUMN rest_pass VARCHAR(256) NULL
            """)
            cur.close()
            print("成功添加rest_pass列到repository表")
            
        return True
    except Exception as e:
        print(f"添加认证列时发生错误: {e}")
        return False
    finally:
        conn.close()

def main():
    """主函数"""
    print("正在执行数据库迁移检查...")
    repo_type_success = add_repo_type_column()
    rest_auth_success = add_rest_auth_columns()
    
    if repo_type_success and rest_auth_success:
        print("数据库结构检查完成，所有必要的列都已存在")
    else:
        print("数据库结构检查失败，某些必要的列可能无法添加")
        sys.exit(1)

if __name__ == "__main__":
    main()