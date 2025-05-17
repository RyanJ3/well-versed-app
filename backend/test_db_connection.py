# Create file test_aurora.py
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get connection details from environment or use defaults
host = os.getenv('DATABASE_HOST', 'localhost')
port = os.getenv('DATABASE_PORT', '5432')
user = os.getenv('DATABASE_USER', 'postgres')
password = os.getenv('DATABASE_PASSWORD', 'postgres')
dbname = os.getenv('DATABASE_NAME', 'well_versed')

# Build connection string
conn_str = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
print(f"Connecting to: {host}:{port}/{dbname} as {user}")

# Test connection
try:
    engine = create_engine(conn_str)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        print(f"Connection successful! Result: {result}")
except Exception as e:
    print(f"Connection failed: {str(e)}")