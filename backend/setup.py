#!/usr/bin/env python3
import os

def create_backend_structure():
    """Creates the directory structure and files for the Well Versed backend"""
    
    # Base directory
    base_dir = "backend"
    os.makedirs(f"{base_dir}/app/api", exist_ok=True)
    
    # Create empty files
    files = [
        "__init__.py",
        "main.py",
        "config.py",
        "database.py",
        "models.py",
        "schemas.py",
        "api/__init__.py",
        "api/router.py",
        "api/users.py"
    ]
    
    for file in files:
        path = os.path.join(base_dir, "app", file)
        open(path, 'w').close()
        print(f"Created {path}")
    
    # Create root files
    root_files = ["requirements.txt", "Dockerfile", "README.md"]
    for file in root_files:
        path = os.path.join(base_dir, file)
        open(path, 'w').close()
        print(f"Created {path}")
    
    print("\nBackend structure created successfully!")
    print("Now paste the appropriate content into each file.")

if __name__ == "__main__":
    create_backend_structure()