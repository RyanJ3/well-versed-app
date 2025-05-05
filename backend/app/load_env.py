#!/usr/bin/env python3
# load_env.py - Script to load environment variables from external location
import os
import sys
import dotenv

# Path to external .env file
ENV_FILE_PATH = "C:/configs/.env"

def load_env():
    """Load environment variables from external .env file"""
    if not os.path.exists(ENV_FILE_PATH):
        print(f"Error: Environment file not found at {ENV_FILE_PATH}")
        print("Please create this file with the required environment variables.")
        print("Required variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD")
        sys.exit(1)
    
    # Load the environment variables
    dotenv.load_dotenv(ENV_FILE_PATH)
    
    # Verify required variables
    required_vars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        print(f"Please add them to {ENV_FILE_PATH}")
        sys.exit(1)
    
    print("Environment variables loaded successfully.")

if __name__ == "__main__":
    load_env()