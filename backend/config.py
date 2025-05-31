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
    DATABASE_NAME = os.getenv('DATABASE_NAME')
    DATABASE_USER = os.getenv('DATABASE_USER')
    DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')
    DATABASE_PORT = int(os.getenv('DATABASE_PORT'))
    
    # API
    API_HOST = os.getenv('API_HOST')
    API_PORT = int(os.getenv('API_PORT'))
    LOG_LEVEL = os.getenv('LOG_LEVEL')
    
    # CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL')
    
    # API.Bible
    API_BIBLE_KEY = os.getenv('API_BIBLE_KEY')
    DEFAULT_BIBLE_ID = os.getenv('DEFAULT_BIBLE_ID', 'de4e12af7f28f599-02')  # KJV

    @classmethod
    def get_database_url(cls):
        return f"postgresql://{cls.DATABASE_USER}:{cls.DATABASE_PASSWORD}@{cls.DATABASE_HOST}:{cls.DATABASE_PORT}/{cls.DATABASE_NAME}"
    
    @classmethod
    def log_config(cls):
        """Log configuration (hiding sensitive data)"""
        logger.info(f"Database: {cls.DATABASE_HOST}:{cls.DATABASE_PORT}/{cls.DATABASE_NAME}")
        logger.info(f"API: {cls.API_HOST}:{cls.API_PORT}")
        logger.info(f"Frontend URL: {cls.FRONTEND_URL}")