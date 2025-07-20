# backend/routers/users.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from database import DatabaseConnection
from psycopg2 import errors
import db_pool

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    first_name: Optional[str]
    last_name: Optional[str]
    denomination: Optional[str]
    preferred_bible: Optional[str]
    preferred_language: str = "eng"
    include_apocrypha: bool = False
    use_esv_api: bool = False
    esv_api_token: Optional[str]
    created_at: str
    verses_memorized: int = 0
    streak_days: int = 0
    books_started: int = 0

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    denomination: Optional[str] = None
    preferred_bible: Optional[str] = None
    preferred_language: Optional[str] = None
    include_apocrypha: Optional[bool] = None
    use_esv_api: Optional[bool] = None
    esv_api_token: Optional[str] = None

def get_db():
    """Dependency to get database connection"""
    return DatabaseConnection(db_pool.db_pool)

@router.get("/{user_id}")
async def get_user(user_id: int, db: DatabaseConnection = Depends(get_db)):
    """Get user by ID"""
    logger.info(f"Getting user {user_id}")
    
    # Get user info
    query = """
        SELECT
            user_id as id,
            email,
            name,
            first_name,
            last_name,
            denomination,
            preferred_bible,
            preferred_language,
            include_apocrypha,
            use_esv_api,
            esv_api_token,
            created_at::text
        FROM users
        WHERE user_id = %s
    """
    
    try:
        user = db.fetch_one(query, (user_id,))
    except errors.UndefinedColumn:
        # Older database without new columns
        logger.warning("Database missing new columns, falling back")
        legacy_query = """
            SELECT
                user_id as id,
                email,
                name,
                first_name,
                last_name,
                denomination,
                preferred_bible,
                include_apocrypha,
                created_at::text
            FROM users
            WHERE user_id = %s
        """
        user = db.fetch_one(legacy_query, (user_id,)) or {}
        user["use_esv_api"] = False
        user["esv_api_token"] = None
        user["preferred_language"] = "eng"

    if not user:
        logger.warning(f"User {user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get memorization stats
    stats_query = """
        SELECT 
            COUNT(DISTINCT uv.verse_id) as verses_memorized,
            COUNT(DISTINCT bv.book_id) as books_started
        FROM user_verses uv
        JOIN bible_verses bv ON uv.verse_id = bv.id
        WHERE uv.user_id = %s
    """
    
    stats = db.fetch_one(stats_query, (user_id,))
    user.update(stats or {})
    
    logger.info(f"Retrieved user {user_id}: {user['name']}")
    return UserResponse(**user)

@router.put("/{user_id}")
async def update_user(
    user_id: int, 
    user_update: UserUpdate,
    db: DatabaseConnection = Depends(get_db)
):
    """Update user profile"""
    logger.info(f"Updating user {user_id}: {user_update.dict(exclude_unset=True)}")
    
    # Check if Bible translation is changing
    bible_changed = False
    if user_update.preferred_bible is not None:
        current_user = db.fetch_one("SELECT preferred_bible FROM users WHERE user_id = %s", (user_id,))
        if current_user and current_user.get('preferred_bible') != user_update.preferred_bible:
            bible_changed = True
            logger.info(f"Bible translation changing from {current_user.get('preferred_bible')} to {user_update.preferred_bible}")
    
    # Build update query dynamically
    update_fields = []
    params = []
    
    if user_update.first_name is not None:
        update_fields.append("first_name = %s")
        params.append(user_update.first_name)
    
    if user_update.last_name is not None:
        update_fields.append("last_name = %s")
        params.append(user_update.last_name)
    
    if user_update.denomination is not None:
        update_fields.append("denomination = %s")
        params.append(user_update.denomination)
    
    if user_update.preferred_bible is not None:
        update_fields.append("preferred_bible = %s")
        params.append(user_update.preferred_bible)
        
    if user_update.preferred_language is not None:
        update_fields.append("preferred_language = %s")
        params.append(user_update.preferred_language)

    if user_update.include_apocrypha is not None:
        update_fields.append("include_apocrypha = %s")
        params.append(user_update.include_apocrypha)

    if user_update.use_esv_api is not None:
        update_fields.append("use_esv_api = %s")
        params.append(user_update.use_esv_api)

    if user_update.esv_api_token is not None:
        update_fields.append("esv_api_token = %s")
        params.append(user_update.esv_api_token)
    
    # Update name field (combine first and last)
    if user_update.first_name is not None or user_update.last_name is not None:
        # Get current values
        current = db.fetch_one("SELECT first_name, last_name FROM users WHERE user_id = %s", (user_id,))
        if current:
            first = user_update.first_name if user_update.first_name is not None else current['first_name'] or ''
            last = user_update.last_name if user_update.last_name is not None else current['last_name'] or ''
            full_name = f"{first} {last}".strip()
            update_fields.append("name = %s")
            params.append(full_name)
    
    if not update_fields:
        logger.warning("No fields to update")
        raise HTTPException(status_code=400, detail="No fields to update")
    
    params.append(user_id)
    
    query = f"""
        UPDATE users 
        SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = %s
    """
    
    try:
        db.execute(query, tuple(params))
    except errors.UndefinedColumn:
        # Column doesn't exist in older schema; retry without new fields
        logger.warning("Database missing new columns on update, retrying")
        filtered_fields = []
        filtered_params = []
        for field, value in zip(update_fields, params[:-1]):
            if field.startswith("use_esv_api") or field.startswith("esv_api_token") or field.startswith("preferred_language"):
                continue
            filtered_fields.append(field)
            filtered_params.append(value)
        if not filtered_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        filtered_params.append(user_id)
        fallback_query = f"""
            UPDATE users
            SET {', '.join(filtered_fields)}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
        """
        db.execute(fallback_query, tuple(filtered_params))
    except Exception as e:
        logger.error(f"Failed to update user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user")

    logger.info(f"User {user_id} updated successfully")
    
    # Clear all caches if Bible translation changed
    if bible_changed:
        logger.info("Bible translation changed - clearing all caches")
        
        # Clear database cache
        with db.get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM api_cache")
                deleted_count = cur.rowcount
                conn.commit()
        logger.info(f"Cleared {deleted_count} database cache entries")
        
        # Clear in-memory caches
        from services.api_bible import APIBibleService
        from services.esv_api import ESVService
        
        # Reset APIBibleService cache
        APIBibleService._cache = {}
        APIBibleService.get_verse_text.cache_clear()
        APIBibleService.get_available_bibles.cache_clear()
        
        # Reset ESVService cache 
        ESVService._cache = ESVService._cache.__class__()  # Create new cache instance
        
        logger.info("Cleared all in-memory caches")
    
    return await get_user(user_id, db)