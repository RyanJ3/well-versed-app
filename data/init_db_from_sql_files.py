#!/usr/bin/env python3
"""
Initialize Well Versed database using SQL files 01-05
"""

import psycopg2
import os
import sys
import time
from pathlib import Path

def wait_for_db(max_retries=30):
    """Wait for PostgreSQL to be ready"""
    print("Waiting for database...")
    
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=os.getenv('DATABASE_HOST', 'db'),
                port=os.getenv('DATABASE_PORT', '5432'),
                database=os.getenv('DATABASE_NAME', 'wellversed01DEV'),
                user=os.getenv('DATABASE_USER', 'postgres'),
                password=os.getenv('DATABASE_PASSWORD', 'postgres')
            )
            conn.close()
            print("Database is ready!")
            return True
        except psycopg2.OperationalError:
            if i < max_retries - 1:
                print(f"Retry {i+1}/{max_retries}...")
                time.sleep(2)
    
    print("Database connection failed")
    return False

def run_sql_file(conn, filepath):
    """Execute SQL file"""
    print(f"Running {filepath.name}...")
    
    with open(filepath, 'r') as f:
        sql = f.read()
    
    cur = conn.cursor()
    try:
        cur.execute(sql)
        conn.commit()
        print(f"✓ {filepath.name} completed")
    except Exception as e:
        conn.rollback()
        print(f"✗ Error in {filepath.name}: {e}")
        raise
    finally:
        cur.close()

def main():
    if not wait_for_db():
        sys.exit(1)
    
    # Connect to database
    conn = psycopg2.connect(
        host=os.getenv('DATABASE_HOST', 'db'),
        port=os.getenv('DATABASE_PORT', '5432'),
        database=os.getenv('DATABASE_NAME', 'wellversed01DEV'),
        user=os.getenv('DATABASE_USER', 'postgres'),
        password=os.getenv('DATABASE_PASSWORD', 'postgres')
    )
    
    # Find SQL files
    data_dir = Path(__file__).parent
    sql_files = sorted(data_dir.glob('0[1-5]_*.sql'))
    
    if not sql_files:
        print("No SQL files found!")
        sys.exit(1)
    
    # Run each SQL file in order
    try:
        for sql_file in sql_files:
            run_sql_file(conn, sql_file)
        
        # Run populate_chapter_counts.py if it exists
        populate_script = data_dir / 'populate_chapter_counts.py'
        if populate_script.exists():
            print("\nRunning populate_chapter_counts.py...")
            import subprocess
            result = subprocess.run([sys.executable, str(populate_script)], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print("✓ Chapter counts populated")
            else:
                print(f"✗ Error: {result.stderr}")
        
        print("\n✅ Database initialization complete!")
        
    except Exception as e:
        print(f"\n❌ Initialization failed: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    main()