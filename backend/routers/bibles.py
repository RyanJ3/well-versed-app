import logging
from fastapi import APIRouter, Depends
from services.api_bible import APIBibleService
from config import Config

router = APIRouter()
logger = logging.getLogger(__name__)

def get_service() -> APIBibleService:
    return APIBibleService(Config.API_BIBLE_KEY, Config.DEFAULT_BIBLE_ID)

@router.get("/translations")
async def list_translations(service: APIBibleService = Depends(get_service)):
    """Return available Bible translations from API.Bible"""
    try:
        return service.get_available_bibles()
    except Exception as e:
        logger.error(f"Failed to fetch bible translations: {e}")
        return []
