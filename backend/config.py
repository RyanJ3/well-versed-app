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
    
    # API.Bible - Enhanced validation
    API_BIBLE_KEY = os.getenv('API_BIBLE_KEY')
    if not API_BIBLE_KEY:
        raise ValueError(
            "\n" + "="*60 + "\n"
            "API_BIBLE_KEY not found in environment!\n\n"
            "To fix this:\n"
            "1. Get a free API key from: https://scripture.api.bible/\n"
            "2. Add to your .env file:\n"
            "   API_BIBLE_KEY=your_actual_key_here\n"
            "3. Restart the backend\n" +
            "="*60
        )
    
    # Check for placeholder values
    if API_BIBLE_KEY in ['your_api_key_here', 'YOUR_API_KEY_HERE', 'api_key_here', '']:
        raise ValueError(
            "\n" + "="*60 + "\n"
            "API_BIBLE_KEY appears to be a placeholder!\n\n"
            f"Current value: '{API_BIBLE_KEY}'\n\n"
            "Please replace it with your actual API key:\n"
            "1. Get a free API key from: https://scripture.api.bible/\n"
            "2. Update your .env file with the real key\n"
            "3. Restart the backend\n" +
            "="*60
        )
    
    # Basic key format validation
    if len(API_BIBLE_KEY) < 10:
        raise ValueError(
            "\n" + "="*60 + "\n"
            "API_BIBLE_KEY seems too short to be valid!\n\n"
            f"Current length: {len(API_BIBLE_KEY)} characters\n"
            "API.Bible keys are typically 32+ characters long.\n\n"
            "Please check your API key and try again.\n" +
            "="*60
        )
    
    DEFAULT_BIBLE_ID = os.getenv('DEFAULT_BIBLE_ID', 'de4e12af7f28f599-02')  # KJV

    @classmethod
    def get_database_url(cls):
        return f"postgresql://{cls.DATABASE_USER}:{cls.DATABASE_PASSWORD}@{cls.DATABASE_HOST}:{cls.DATABASE_PORT}/{cls.DATABASE_NAME}"
    
    @classmethod
    def log_config(cls):
        logger.info("="*60)
        logger.info("Configuration loaded successfully!")
        logger.info("="*60)
        logger.info(f"Database: {cls.DATABASE_NAME} on {cls.DATABASE_HOST}:{cls.DATABASE_PORT}")
        logger.info(f"API: Running on {cls.API_HOST}:{cls.API_PORT}")
        logger.info(f"Frontend URL: {cls.FRONTEND_URL}")
        logger.info(f"API.Bible key: {'✓ Configured' if cls.API_BIBLE_KEY else '✗ Missing'} (length: {len(cls.API_BIBLE_KEY) if cls.API_BIBLE_KEY else 0})")
        logger.info(f"Default Bible: {cls.DEFAULT_BIBLE_ID}")
        logger.info("="*60)