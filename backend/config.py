# backend/config.py
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class Config:
    # Database
    DATABASE_HOST = os.getenv('DATABASE_HOST', 'localhost')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'wellversed01DEV')
    DATABASE_USER = os.getenv('DATABASE_USER', 'postgres')
    DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD', 'postgres')
    DATABASE_PORT = int(os.getenv('DATABASE_PORT', '5432'))
    
    # API
    API_HOST = os.getenv('API_HOST', '0.0.0.0')
    API_PORT = int(os.getenv('API_PORT', '8000'))
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:4200')
    
    @classmethod
    def get_database_url(cls):
        return f"postgresql://{cls.DATABASE_USER}:{cls.DATABASE_PASSWORD}@{cls.DATABASE_HOST}:{cls.DATABASE_PORT}/{cls.DATABASE_NAME}"
    
    @classmethod
    def log_config(cls):
        """Log configuration (hiding sensitive data)"""
        logger.info(f"Database: {cls.DATABASE_HOST}:{cls.DATABASE_PORT}/{cls.DATABASE_NAME}")
        logger.info(f"API: {cls.API_HOST}:{cls.API_PORT}")
        logger.info(f"Frontend URL: {cls.FRONTEND_URL}")