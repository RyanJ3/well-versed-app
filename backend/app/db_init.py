# backend/db_init.py
import os
from sqlalchemy import create_engine, text
from app.database import DATABASE_URL
from app.models import Base

def init_db():
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("Database tables created successfully")

if __name__ == "__main__":
    init_db()