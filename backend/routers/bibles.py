# backend/routers/bibles.py
"""Bible routes for API.Bible integration"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
from database import DatabaseConnection
import db_pool
from services.api_bible import APIBibleService
from config import Config
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter()

class BibleVersion(BaseModel):
    id: str
    name: str
    abbreviation: str
    abbreviationLocal: str
    language: str
    languageId: str
    description: Optional[str] = None
    type: str

class LanguageOption(BaseModel):
    id: str
    name: str
    nameLocal: str
    script: str
    scriptDirection: str

class AvailableBiblesResponse(BaseModel):
    languages: List[LanguageOption]
    bibles: List[BibleVersion]

def get_db():
    return DatabaseConnection(db_pool.db_pool)

@router.get("/available", response_model=AvailableBiblesResponse)
async def get_available_bibles(
    language: Optional[str] = None,  # 3-letter ISO 639-3 code (e.g., "eng")
    db: DatabaseConnection = Depends(get_db)
):
    """Get available Bible versions and languages from API.Bible"""
    logger.info(f"Getting available Bibles for language: {language}")
    
    # Fetch from API.Bible
    languages = []
    filtered_bibles = []
    
    try:
        api_bible = APIBibleService(Config.API_BIBLE_KEY, Config.DEFAULT_BIBLE_ID)
        
        # Log the API key status
        logger.info(f"API_BIBLE_KEY configured: {bool(Config.API_BIBLE_KEY)}")
        
        # Get all available Bibles (or filtered by language)
        all_bibles = api_bible.get_available_bibles(language)
        logger.info(f"API.Bible returned {len(all_bibles)} bibles")
        
        # If no Bibles returned, this is likely an API key issue
        if len(all_bibles) == 0:
            logger.error("API.Bible returned 0 bibles - check API key validity")
            raise HTTPException(
                status_code=500, 
                detail="API.Bible returned no Bibles. Please check your API_BIBLE_KEY configuration."
            )
        
        # Extract unique languages if getting all Bibles
        languages_map = {}
        if not language:  # Only extract languages when not filtering
            for bible in all_bibles:
                lang = bible.get('language', {})
                lang_id = lang.get('id')
                if lang_id and lang_id not in languages_map:
                    languages_map[lang_id] = LanguageOption(
                        id=lang_id,
                        name=lang.get('name', ''),
                        nameLocal=lang.get('nameLocal', ''),
                        script=lang.get('script', ''),
                        scriptDirection=lang.get('scriptDirection', 'LTR')
                    )
        
        # Sort languages by name, with English first
        languages = list(languages_map.values())
        languages.sort(key=lambda x: (x.name != 'English', x.name))
        
        # Process Bibles
        for bible in all_bibles:
            filtered_bibles.append(BibleVersion(
                id=bible.get('id', ''),
                name=bible.get('name', ''),
                abbreviation=bible.get('abbreviation', ''),
                abbreviationLocal=bible.get('abbreviationLocal', ''),
                language=bible.get('language', {}).get('name', ''),
                languageId=bible.get('language', {}).get('id', ''),
                description=bible.get('description'),
                type=bible.get('type', 'text')
            ))
        
        # Sort Bibles by name
        filtered_bibles.sort(key=lambda x: x.name)
        
        # Cache the results
        return AvailableBiblesResponse(
            languages=languages,
            bibles=filtered_bibles,
        )
        
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error fetching available Bibles: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch available Bibles: {str(e)}")


@router.get("/bible/{bible_id}")
async def get_bible_details(
    bible_id: str,
    db: DatabaseConnection = Depends(get_db)
):
    """Get details for a specific Bible version"""
    logger.info(f"Getting details for Bible: {bible_id}")
    
    # Fetch from API
    try:
        api_bible = APIBibleService(Config.API_BIBLE_KEY, Config.DEFAULT_BIBLE_ID)
        
        # This would need to be implemented in APIBibleService
        # For now, we'll get all Bibles and find the one
        all_bibles = api_bible.get_available_bibles()
        
        for bible in all_bibles:
            if bible.get('id') == bible_id:
                return bible
        
        raise HTTPException(status_code=404, detail="Bible not found")
        
    except Exception as e:
        logger.error(f"Error fetching Bible details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch Bible details")