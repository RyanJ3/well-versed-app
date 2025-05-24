# backend/routers/users.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from database import DatabaseConnection
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
    created_at: str
    verses_memorized: int = 0
    streak_days: int = 0
    books_started: int = 0

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    denomination: Optional[str] = None
    preferred_bible: Optional[str] = None

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
            created_at::text
        FROM users
        WHERE user_id = %s
    """
    
    user = db.fetch_one(query, (user_id,))
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
    
    # Update name field (combine first and last)
    if user_update.first_name is not None or user_update.last_name is not None:
        # Get current values
        current = db.fetch_one("SELECT first_name, last_name FROM users WHERE user_id = %s", (user_id,))
        if current:
            first = user_update.first_name or current['first_name'] or ''
            last = user_update.last_name or current['last_name'] or ''
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
        logger.info(f"User {user_id} updated successfully")
        return await get_user(user_id, db)
    except Exception as e:
        logger.error(f"Failed to update user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user")