# backend/config.py
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class Config:
    # Database
    DATABASE_HOST = os.getenv('DATABASE_HOST')
    if not DATABASE_HOST:
        raise ValueError("DATABASE_HOST not found in environment. Add to .bashrc or .env file")
    
    DATABASE_NAME = os.getenv('DATABASE_NAME')
    if not DATABASE_NAME:
        raise ValueError("DATABASE_NAME not found in environment. Add to .bashrc or .env file")
    
    DATABASE_USER = os.getenv('DATABASE_USER')
    if not DATABASE_USER:
        raise ValueError("DATABASE_USER not found in environment. Add to .bashrc or .env file")
    
    DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')
    if not DATABASE_PASSWORD:
        raise ValueError("DATABASE_PASSWORD not found in environment. Add to .bashrc or .env file")
    
    DATABASE_PORT = int(os.getenv('DATABASE_PORT', '5432'))
    
    # API
    API_HOST = os.getenv('API_HOST', '0.0.0.0')
    API_PORT = os.getenv('API_PORT', '8000')
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL')
    if not FRONTEND_URL:
        raise ValueError("FRONTEND_URL not found in environment. Add to .bashrc or .env file")
    
    # API.Bible
    API_BIBLE_KEY = os.getenv('API_BIBLE_KEY')
    if not API_BIBLE_KEY:
        raise ValueError(
            "API_BIBLE_KEY not found in environment. "
            "Add to .bashrc or .env file. "
            "Get your API key from https://scripture.api.bible/"
        )
    
    DEFAULT_BIBLE_ID = os.getenv('DEFAULT_BIBLE_ID', 'de4e12af7f28f599-02')  # KJV

    @classmethod
    def get_database_url(cls):
        return f"postgresql://{cls.DATABASE_USER}:{cls.DATABASE_PASSWORD}@{cls.DATABASE_HOST}:{cls.DATABASE_PORT}/{cls.DATABASE_NAME}"
    
    @classmethod
    def log_config(cls):
        logger.info(f"WELLVERSED DB - successfully setup!")
        logger.info(f"API_BIBLE_KEY - successfully retrieved!")