# backend/routers/config.py
from fastapi import APIRouter
from pydantic import BaseModel
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class FrontendConfig(BaseModel):
    mapboxToken: str
    api_bible_host: str

@router.get("/config/frontend", response_model=FrontendConfig)
async def get_frontend_config():
    """Get configuration values needed by the frontend"""
    mapbox_token = os.getenv('MAPBOX_TOKEN')
    api_bible_host = os.getenv('API_BIBLE_HOST')
    
    if not mapbox_token:
        logger.error("MAPBOX_TOKEN environment variable not set")
        raise ValueError("MAPBOX_TOKEN environment variable not set")


    if not api_bible_host:
        logger.error("API_BIBLE_HOST environment variable not set")
        raise ValueError("API_BIBLE_HOST environment variable not set")

    return FrontendConfig(
        mapboxToken=mapbox_token,
        api_bible_host=api_bible_host
    )