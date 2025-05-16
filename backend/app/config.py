from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, validator
from typing import Any, Dict, Optional, Union
import os
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Well Versed API"
    
    # Database connection
    DATABASE_HOST: str
    DATABASE_PORT: str
    DATABASE_USER: str
    DATABASE_PASSWORD: str
    DATABASE_NAME: str
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        
        # Create PostgreSQL connection string manually
        return f"postgresql+psycopg2://{values.get('DATABASE_USER')}:{values.get('DATABASE_PASSWORD')}@{values.get('DATABASE_HOST')}:{values.get('DATABASE_PORT')}/{values.get('DATABASE_NAME') or ''}"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()