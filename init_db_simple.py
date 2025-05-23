#!/usr/bin/env python3
# Simplified database initialization
import os
import psycopg2
import time

def wait_for_db():
    for i in range(30):
        try:
            conn = psycopg2.connect(
                host=os.getenv('DATABASE_HOST', 'localhost'),
                port=os.getenv('DATABASE_PORT', '5432'),
                user=os.getenv('DATABASE_USER', 'postgres'),
                password=os.getenv('DATABASE_PASSWORD', 'postgres'),
                dbname=os.getenv('DATABASE_NAME', 'wellversed01DEV')
            )
            conn.close()
            return True
        except:
            time.sleep(2)
    return False

def init_db():
    if not wait_for_db():
        print("Database connection failed")
        return
    
    # Use the existing init_database.py
    from data.init_database import DatabaseInitializer
    initializer = DatabaseInitializer()
    initializer.run()

if __name__ == '__main__':
    init_db()
