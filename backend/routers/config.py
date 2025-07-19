# backend/routers/config.py
from fastapi import APIRouter
from pydantic import BaseModel
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class FrontendConfig(BaseModel):
    mapboxToken: str

@router.get("/config/frontend", response_model=FrontendConfig)
async def get_frontend_config():
    """Get configuration values needed by the frontend"""
    mapbox_token = os.getenv('MAPBOX_TOKEN')
    
    if not mapbox_token:
        logger.warning("MAPBOX_TOKEN environment variable not set")
    
    return FrontendConfig(
        mapboxToken=mapbox_token
    )