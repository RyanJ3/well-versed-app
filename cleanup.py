#!/usr/bin/env python3
"""
Well Versed App Cleanup Script
Removes unused files and optimizes project structure
"""

import os
import shutil
from pathlib import Path

def remove_file_safely(filepath):
    """Remove file if it exists"""
    if os.path.exists(filepath):
        os.remove(filepath)
        print(f"✓ Removed: {filepath}")
    else:
        print(f"- Not found: {filepath}")

def remove_dir_safely(dirpath):
    """Remove directory if it exists"""
    if os.path.exists(dirpath):
        shutil.rmtree(dirpath)
        print(f"✓ Removed directory: {dirpath}")
    else:
        print(f"- Directory not found: {dirpath}")

def cleanup_unused_files():
    """Remove all unused files"""
    print("🧹 Cleaning up unused files...\n")
    
    # Backend cleanup
    print("Backend files:")
    backend_files = [
        "backend/setup.py",
        "backend/utils.py",
        "backend/create_fastapi_backend.py",
        "backend/populate_bible_verses.py", 
        "backend/populate_all_verses.py",
        "backend/test_db_connection.py",
        "backend/init_db.py"
    ]
    
    for file in backend_files:
        remove_file_safely(file)
    
    # Frontend cleanup
    print("\nFrontend files:")
    frontend_files = [
        "frontend/src/app/models/index.ts",
        "frontend/src/app/models/interfaces.ts", 
        "frontend/src/app/home/home.component.css",
        "frontend/src/app/profile/profile.component.spec.ts",
        "frontend/src/app/api-test/api-test.components.ts",
        "frontend/src/app/app.module.ts",
        "frontend/src/environments.docker.ts",
        "frontend/src/app/bible-tracker/bible-tracker.module.ts"
    ]
    
    for file in frontend_files:
        remove_file_safely(file)
    
    # Scripts cleanup
    print("\nScript files:")
    script_files = [
        "scripts/separate_components.py",
        "scripts/exclude_from_formatting.py",
        "frontend/src/app/models/psalm_151_fix.py"
    ]
    
    for file in script_files:
        remove_file_safely(file)
    
    # Data files cleanup
    print("\nData files:")
    data_files = [
        "data/02_populate_books.sql",
        "data/03_populate_apocrypha.sql", 
        "data/04_create_test_data.sql",
        "data/05_helper_functions.sql",
        "data/Dockerfile.init",
        "data/init_db_from_sql_files.py",
        "data/populate_chapter_counts.py"
    ]
    
    for file in data_files:
        remove_file_safely(file)

def optimize_docker_config():
    """Create optimized docker-compose with only necessary services"""
    print("\n🐳 Optimizing Docker configuration...")
    
    optimized_compose = """version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: wellversed-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-wellversed01DEV}
    ports:
      - "${DATABASE_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: wellversed-backend
    environment:
      DATABASE_HOST: db
      DATABASE_PORT: 5432
      DATABASE_USER: ${POSTGRES_USER:-postgres}
      DATABASE_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      DATABASE_NAME: ${POSTGRES_DB:-wellversed01DEV}
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: wellversed-frontend
    ports:
      - "4200:4200"
    depends_on:
      - backend
    networks:
      - app-network
    volumes:
      - ./frontend/src:/app/src
      - /app/node_modules
    command: npm run serve

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
"""
    
    with open("docker-compose.optimized.yml", "w") as f:
        f.write(optimized_compose)
    print("✓ Created docker-compose.optimized.yml")

def create_db_init_script():
    """Create simplified database initialization"""
    print("\n🗄️ Creating simplified DB init...")
    
    init_script = """#!/usr/bin/env python3
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
"""
    
    with open("init_db_simple.py", "w") as f:
        f.write(init_script)
    print("✓ Created init_db_simple.py")

def optimize_frontend_structure():
    """Suggest frontend structure optimizations"""
    print("\n⚡ Frontend optimization suggestions:")
    print("1. Consolidate bible models into single barrel export")
    print("2. Add lazy loading for routes")
    print("3. Implement OnPush change detection")
    print("4. Add trackBy functions for *ngFor loops")

def main():
    print("🚀 Well Versed App Optimization\n")
    
    # Confirm before proceeding
    response = input("This will remove unused files. Continue? (y/N): ")
    if response.lower() != 'y':
        print("Aborted.")
        return
    
    cleanup_unused_files()
    optimize_docker_config()
    create_db_init_script()
    optimize_frontend_structure()
    
    print("\n✅ Cleanup complete!")
    print("\nNext steps:")
    print("1. Test with: docker-compose -f docker-compose.optimized.yml up")
    print("2. Review remaining files for further optimization")
    print("3. Add performance monitoring")
    print("4. Implement suggested frontend improvements")

if __name__ == "__main__":
    main()