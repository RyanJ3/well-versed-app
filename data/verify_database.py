# data/verify_database.py
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(parent_dir, '.env'))

def verify_database():
    # Database connection parameters
    conn_params = {
        'host': os.getenv('DATABASE_HOST'),
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
        
        # Check tables
        print("\n📊 Checking tables...")
        tables_query = """
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
        """
        cur.execute(tables_query)
        tables = cur.fetchall()
        print(f"Found {len(tables)} tables:")
        for table in tables:
            print(f"  ✓ {table[0]}")
        
        # Check enum types
        print("\n🏷️ Checking enum types...")
        enums_query = """
        SELECT typname 
        FROM pg_type 
        WHERE typtype = 'e' 
        ORDER BY typname;
        """
        cur.execute(enums_query)
        enums = cur.fetchall()
        print(f"Found {len(enums)} enum types:")
        for enum in enums:
            print(f"  ✓ {enum[0]}")
        
        # Check indexes
        print("\n🔍 Checking indexes...")
        indexes_query = """
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT LIKE '%_pkey'
        ORDER BY indexname;
        """
        cur.execute(indexes_query)
        indexes = cur.fetchall()
        print(f"Found {len(indexes)} custom indexes")
        
        # Check triggers
        print("\n⚡ Checking triggers...")
        triggers_query = """
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        ORDER BY trigger_name;
        """
        cur.execute(triggers_query)
        triggers = cur.fetchall()
        print(f"Found {len(triggers)} triggers:")
        for trigger in triggers:
            print(f"  ✓ {trigger[0]} on {trigger[1]}")
        
        # Check table row counts
        print("\n📈 Checking table row counts...")
        for table in ['users', 'books', 'decks', 'user_verses']:
            cur.execute(f"SELECT COUNT(*) FROM {table};")
            count = cur.fetchone()[0]
            print(f"  {table}: {count} rows")
        
        print("\n✅ Database verification completed!")
        
    except Exception as e:
        print(f"\n❌ Error verifying database: {str(e)}")
        raise
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    verify_database()