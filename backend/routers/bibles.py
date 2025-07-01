from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
import logging

from services.api_bible import APIBibleService
from config import Config
from database import DatabaseConnection
import db_pool

logger = logging.getLogger(__name__)

router = APIRouter()

class BibleInfo(BaseModel):
    id: str
    abbreviation: str
    name: str

def get_db():
    """Dependency to get a database connection (for consistency)."""
    return DatabaseConnection(db_pool.db_pool)

@router.get("/", response_model=List[BibleInfo])
async def list_bibles(db: DatabaseConnection = Depends(get_db)):
    """Return available Bible translations from API.Bible."""
    api_bible = APIBibleService(Config.API_BIBLE_KEY, Config.DEFAULT_BIBLE_ID)
    raw_bibles = api_bible.get_available_bibles()
    bibles: List[BibleInfo] = []
    for item in raw_bibles:
        if all(k in item for k in ("id", "abbreviation", "name")):
            bibles.append(
                BibleInfo(id=item["id"], abbreviation=item["abbreviation"], name=item["name"])
            )
    logger.info(f"Returned {len(bibles)} bible versions")
    return bibles
