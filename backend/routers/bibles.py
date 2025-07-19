# backend/routers/bibles.py
"""
Note: This requires adding the api_cache table to your database:

CREATE TABLE api_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Also update users table:
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'eng';
"""

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
    cacheExpiry: str

def get_db():
    return DatabaseConnection(db_pool.db_pool)

@router.get("/available", response_model=AvailableBiblesResponse)
async def get_available_bibles(
    language: Optional[str] = None,  # 3-letter ISO 639-3 code (e.g., "eng")
    db: DatabaseConnection = Depends(get_db)
):
    """Get available Bible versions and languages from API.Bible with caching"""
    logger.info(f"Getting available Bibles for language: {language}")
    
    # Check cache first
    cache_key = f"bibles_available_{language or 'all'}"
    cache_query = """
        SELECT cache_data, created_at 
        FROM api_cache 
        WHERE cache_key = %s 
        AND created_at > %s
    """
    
    # Cache for 29 days to ensure it's removed before 30
    cache_expiry = datetime.now() - timedelta(days=29)
    
    cached = db.fetch_one(cache_query, (cache_key, cache_expiry))
    
    if cached:
        logger.info("Returning cached Bible data")
        data = json.loads(cached['cache_data'])
        return AvailableBiblesResponse(
            languages=data['languages'],
            bibles=data['bibles'],
            cacheExpiry=(cached['created_at'] + timedelta(days=29)).isoformat()
        )
    
    # Fetch from API.Bible
    try:
        api_bible = APIBibleService(Config.API_BIBLE_KEY, Config.DEFAULT_BIBLE_ID)
        
        # Get all available Bibles (or filtered by language)
        all_bibles = api_bible.get_available_bibles(language)
        
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
        filtered_bibles = []
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
        cache_data = {
            'languages': [lang.dict() for lang in languages],
            'bibles': [bible.dict() for bible in filtered_bibles]
        }
        
        # Clear old cache entries
        db.execute("DELETE FROM api_cache WHERE cache_key = %s", (cache_key,))
        
        # Insert new cache
        db.execute(
            """
            INSERT INTO api_cache (cache_key, cache_data, created_at)
            VALUES (%s, %s, %s)
            """,
            (cache_key, json.dumps(cache_data), datetime.now())
        )
        
        logger.info(f"Cached {len(languages)} languages and {len(filtered_bibles)} Bibles")
        
        return AvailableBiblesResponse(
            languages=languages,
            bibles=filtered_bibles,
            cacheExpiry=(datetime.now() + timedelta(days=29)).isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error fetching available Bibles: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch available Bibles")

@router.delete("/cache")
async def clear_bible_cache(db: DatabaseConnection = Depends(get_db)):
    """Clear the Bible cache"""
    logger.info("Clearing Bible cache")
    
    db.execute("DELETE FROM api_cache WHERE cache_key LIKE 'bibles_available_%'")
    
    return {"message": "Bible cache cleared"}

@router.get("/bible/{bible_id}")
async def get_bible_details(
    bible_id: str,
    db: DatabaseConnection = Depends(get_db)
):
    """Get details for a specific Bible version"""
    logger.info(f"Getting details for Bible: {bible_id}")
    
    # Check cache
    cache_key = f"bible_details_{bible_id}"
    cache_query = """
        SELECT cache_data, created_at 
        FROM api_cache 
        WHERE cache_key = %s 
        AND created_at > %s
    """
    
    cache_expiry = datetime.now() - timedelta(days=29)
    cached = db.fetch_one(cache_query, (cache_key, cache_expiry))
    
    if cached:
        logger.info("Returning cached Bible details")
        return json.loads(cached['cache_data'])
    
    # Fetch from API
    try:
        api_bible = APIBibleService(Config.API_BIBLE_KEY, Config.DEFAULT_BIBLE_ID)
        
        # This would need to be implemented in APIBibleService
        # For now, we'll get all Bibles and find the one
        all_bibles = api_bible.get_available_bibles()
        
        for bible in all_bibles:
            if bible.get('id') == bible_id:
                # Cache it
                db.execute("DELETE FROM api_cache WHERE cache_key = %s", (cache_key,))
                db.execute(
                    """
                    INSERT INTO api_cache (cache_key, cache_data, created_at)
                    VALUES (%s, %s, %s)
                    """,
                    (cache_key, json.dumps(bible), datetime.now())
                )
                
                return bible
        
        raise HTTPException(status_code=404, detail="Bible not found")
        
    except Exception as e:
        logger.error(f"Error fetching Bible details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch Bible details")