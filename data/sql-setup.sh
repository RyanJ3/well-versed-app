#!/usr/bin/env python3
"""
Safe database initialization using existing SQL scripts
Only runs if tables don't exist or with explicit confirmation
"""

import psycopg2
import os
import sys
import time
from pathlib import Path

class SafeSQLInitializer:
    def __init__(self):
        self.conn = None
        self.cur = None
        
    def wait_for_db(self, max_retries=30):
        """Wait for PostgreSQL to be ready"""
        print("Waiting for database...")
        for i in range(max_retries):
            try:
                self.connect()
                print("Database ready!")
                return True
            except psycopg2.OperationalError:
                if i < max_retries - 1:
                    print(f"Retry {i+1}/{max_retries}...")
                    time.sleep(2)
        print("Database connection failed")
        return False
    
    def connect(self):
        """Connect to database"""
        self.conn = psycopg2.connect(
            host=os.getenv('DATABASE_HOST', 'db'),
            port=os.getenv('DATABASE_PORT', '5432'),
            database=os.getenv('DATABASE_NAME', 'wellversed01DEV'),
            user=os.getenv('DATABASE_USER', 'postgres'),
            password=os.getenv('DATABASE_PASSWORD', 'postgres')
        )
        self.cur = self.conn.cursor()
        
    def check_initialization_needed(self):
        """Check if database needs initialization"""
        try:
            # Check for core tables
            self.cur.execute("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('users', 'books', 'user_verse_ranges')
            """)
            table_count = self.cur.fetchone()[0]
            
            if table_count == 0:
                print("No existing tables found - proceeding with initialization")
                return True
            
            # Check if tables have data
            self.cur.execute("SELECT COUNT(*) FROM books")
            book_count = self.cur.fetchone()[0]
            
            if book_count == 0:
                print("Tables exist but are empty - proceeding with data population")
                return True
            
            print(f"Found {table_count} tables with {book_count} books - database already initialized")
            return False
            
        except psycopg2.Error:
            print("Database appears uninitialized - proceeding")
            return True
    
    def get_user_confirmation(self):
        """Get confirmation for override"""
        # Check environment override
        force_init = os.getenv('FORCE_DB_INIT', '').lower() in ['true', '1', 'yes']
        if force_init:
            print("FORCE_DB_INIT set - overriding existing data")
            return True
        
        # Non-interactive mode
        if not sys.stdin.isatty():
            print("Non-interactive mode - skipping initialization")
            print("Set FORCE_DB_INIT=true to override")
            return False
        
        # Interactive prompt
        while True:
            response = input("Database exists. Override? [y/N]: ").strip().lower()
            if response in ['', 'n', 'no']:
                return False
            elif response in ['y', 'yes']:
                return True
            print("Enter 'y' or 'n' (default: no)")
    
    def run_sql_file(self, filepath):
        """Execute SQL file"""
        print(f"Running {filepath.name}...")
        try:
            with open(filepath, 'r') as f:
                sql = f.read()
            self.cur.execute(sql)
            self.conn.commit()
            print(f"✓ {filepath.name} completed")
        except Exception as e:
            self.conn.rollback()
            print(f"✗ Error in {filepath.name}: {e}")
            raise
    
    def run_initialization(self):
        """Run all SQL scripts in order"""
        data_dir = Path(__file__).parent
        sql_files = sorted(data_dir.glob('0[1-5]_*.sql'))
        
        if not sql_files:
            print("No SQL files found!")
            return False
        
        try:
            for sql_file in sql_files:
                self.run_sql_file(sql_file)
            
            # Run chapter counts population if available
            populate_script = data_dir / 'populate_chapter_counts.py'
            if populate_script.exists():
                print("Running chapter counts population...")
                import subprocess
                result = subprocess.run([sys.executable, str(populate_script)], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    print("✓ Chapter counts populated")
                else:
                    print(f"✗ Chapter counts error: {result.stderr}")
            
            return True
            
        except Exception as e:
            print(f"Initialization failed: {e}")
            return False
    
    def run(self):
        """Main execution"""
        try:
            if not self.wait_for_db():
                sys.exit(1)
            
            # Check environment override first
            force_init = os.getenv('FORCE_DB_INIT', '').lower() in ['true', '1', 'yes']
            
            if force_init:
                print("FORCE_DB_INIT is set - proceeding with initialization")
            else:
                # Check if initialization is needed
                if not self.check_initialization_needed():
                    if not self.get_user_confirmation():
                        print("✅ Database already initialized - skipping")
                        return
            
            # Run initialization
            print("Starting database initialization...")
            if self.run_initialization():
                print("✅ Database initialization complete!")
            else:
                print("❌ Initialization failed")
                sys.exit(1)
                
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
        finally:
            if self.cur:
                self.cur.close()
            if self.conn:
                self.conn.close()

if __name__ == '__main__':
    initializer = SafeSQLInitializer()
    initializer.run()