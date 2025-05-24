# data/setup_database.py
import os
import sys
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# Load environment variables from parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(parent_dir, '.env'))

# SQL files in execution order
SQL_FILES = [
    '01_drop_all.sql',
    '02_create_enums.sql', 
    '03_create_bible_tables.sql',
    '04_create_user_tables.sql',
    '05_create_deck_tables.sql',
    '07_create_triggers.sql',
    '08_create_indexes.sql'
]

def setup_database():
    # Database connection parameters
    conn_params = {
        'host': "localhost",
        'port': os.getenv('DATABASE_PORT'),
        'user': os.getenv('DATABASE_USER'),
        'password': os.getenv('DATABASE_PASSWORD'),
        'database': os.getenv('DATABASE_NAME')
    }
    
    conn = None
    cur = None
    
    try:
        # Connect to database
        print(f"Connecting to database {conn_params['database']}...")
        conn = psycopg2.connect(**conn_params)
        cur = conn.cursor()
        
        # Execute each SQL file
        for sql_file in SQL_FILES:
            file_path = os.path.join(os.path.dirname(__file__), sql_file)
            if os.path.exists(file_path):
                print(f"Executing {sql_file}...")
                with open(file_path, 'r') as f:
                    sql_content = f.read()
                cur.execute(sql_content)
                conn.commit()
                print(f"✓ {sql_file} executed successfully")
            else:
                print(f"⚠ Warning: {sql_file} not found, skipping...")
        
        print("\n✅ Database setup completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error setting up database: {str(e)}")
        if conn:
            conn.rollback()
        raise
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    setup_database()
    
    # Populate Bible data
    print("\n" + "="*50)
    print("Populating Bible data...")
    print("="*50)
    
    try:
        from populate_bible_data import populate_bible_data
        populate_bible_data()
    except Exception as e:
        print(f"⚠️  Warning: Could not populate Bible data: {str(e)}")
    
    # Populate apocryphal content markers
    print("\n" + "="*50)
    print("Populating apocryphal content markers...")
    print("="*50)
    
    try:
        from populate_apocryphal_content import populate_apocryphal_content
        populate_apocryphal_content()
    except Exception as e:
        print(f"⚠️  Warning: Could not populate apocryphal content: {str(e)}")
    
    # Run verification
    print("\n" + "="*50)
    print("Running database verification...")
    print("="*50)
    
    try:
        from verify_database import verify_database
        verify_database()
    except Exception as e:
        print(f"⚠️  Warning: Could not run verification: {str(e)}")