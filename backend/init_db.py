# backend/init_db.py
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get connection details from environment
host = os.getenv('DATABASE_HOST')
port = os.getenv('DATABASE_PORT')
user = os.getenv('DATABASE_USER')
password = os.getenv('DATABASE_PASSWORD')
dbname = os.getenv('DATABASE_NAME')

# Build connection string
conn_str = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
# print(f"Connecting to: {host}:{port}/{dbname} as {user}")
print(f"initializing to AWS")

# Read SQL files
with open('data/setup.sql', 'r') as f:
    setup_sql = f.read()

# Execute setup SQL
try:
    engine = create_engine(conn_str)
    with engine.connect() as conn:
        conn.execute(text(setup_sql))
        conn.commit()
        print("Database schema initialized successfully!")
except Exception as e:
    print(f"Error initializing database: {str(e)}")