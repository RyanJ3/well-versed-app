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
        )
    
    API_BIBLE_KEY = os.getenv('API_BIBLE_KEY')
    if not API_BIBLE_KEY:
        raise ValueError("API_BIBLE_KEY not found in environment. Add to .bashrc or .env file")

    API_BIBLE_HOST = os.getenv('API_BIBLE_HOST')
    if not API_BIBLE_HOST:
        raise ValueError("API_BIBLE_HOST not found in environment. Add to .bashrc or .env file")

    DEFAULT_BIBLE_ID = os.getenv('DEFAULT_BIBLE_ID', 'de4e12af7f28f599-02')  # KJV

    @classmethod
    def get_database_url(cls):
        return f"postgresql://{cls.DATABASE_USER}:{cls.DATABASE_PASSWORD}@{cls.DATABASE_HOST}:{cls.DATABASE_PORT}/{cls.DATABASE_NAME}"
    
    @classmethod
    def log_config(cls):
        logger.info(f"WELLVERSED DB - successfully setup!")
        logger.info(f"API_BIBLE_KEY - successfully retrieved!")
    # Authentication
    AUTH_PROVIDER = os.getenv('AUTH_PROVIDER', 'local')  # 'local' or 'cognito'
    JWT_SECRET = os.getenv('JWT_SECRET', 'your-super-secret-key-change-in-production')
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '60'))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '30'))

    # Future Cognito settings
    COGNITO_USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID', '')
    COGNITO_CLIENT_ID = os.getenv('COGNITO_CLIENT_ID', '')
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
