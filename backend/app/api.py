# app/api.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import update, func, text

from app.database import get_db
from app import models, schemas

# Create the router instance BEFORE using it
router = APIRouter()

# Health check endpoint
@router.get("/")
def health_check():
    return {"status": "online", "service": "Bible Tracker API"}

# User endpoints
@router.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/user-verses/{user_id}", response_model=List[schemas.UserVerseDetail])
def read_user_verses(user_id: int, db: Session = Depends(get_db)):
    user_verses = db.query(
        models.UserVerse, models.BibleVerse
    ).join(
        models.BibleVerse, models.UserVerse.verse_id == models.BibleVerse.verse_id
    ).filter(
        models.UserVerse.user_id == user_id
    ).all()
    
    result = []
    for user_verse, verse in user_verses:
        result.append({
            "verse": verse,
            "practice_count": user_verse.practice_count,
            "last_practiced": user_verse.last_practiced,
            "created_at": user_verse.created_at,
            "updated_at": user_verse.updated_at
        })
    
    print(result)
    
    return result

@router.post("/user-verses/", response_model=schemas.UserVerse)
def create_user_verse(user_verse: schemas.UserVerseCreate, db: Session = Depends(get_db)):
    db_verse = db.query(models.BibleVerse).filter(models.BibleVerse.verse_id == user_verse.verse_id).first()
    if db_verse is None:
        raise HTTPException(status_code=404, detail="Verse not found")
    
    db_user_verse = models.UserVerse(**user_verse.dict())
    db.add(db_user_verse)
    db.commit()
    db.refresh(db_user_verse)
    return db_user_verse

@router.put("/user-verses/{user_id}/{verse_id}", response_model=schemas.UserVerse)
def update_user_verse(user_id: int, verse_id: str, user_verse: schemas.UserVerseUpdate, db: Session = Depends(get_db)):
    db_user_verse = db.query(models.UserVerse).filter(
        models.UserVerse.user_id == user_id,
        models.UserVerse.verse_id == verse_id
    ).first()
    
    if db_user_verse is None:
        raise HTTPException(status_code=404, detail="User verse not found")
    
    db_user_verse.practice_count = user_verse.practice_count
    db_user_verse.last_practiced = func.now()
    db_user_verse.updated_at = func.now()
    
    db.commit()
    db.refresh(db_user_verse)
    return db_user_verse

# Optimize the bulk endpoint in api.py
@router.post("/user-verses/bulk", response_model=dict)
def create_user_verses_bulk(data: dict, db: Session = Depends(get_db)):
    user_id = data.get("user_id")
    book_id = data.get("book_id")
    chapter_number = data.get("chapter_number")
    verse_numbers = data.get("verse_numbers", [])
    practice_count = data.get("practice_count", 0)
    
    if not all([user_id, book_id, chapter_number, verse_numbers]):
        raise HTTPException(status_code=400, detail="Missing required parameters")
    
    # Process in batches for better performance
    updated_count = 0
    
    # Create verse IDs
    verse_ids = [f"{book_id}-{chapter_number}-{verse_num}" for verse_num in verse_numbers]
    
    if practice_count > 0:
        # For "Select All" - use raw SQL but avoid passing func.now() as parameter
        stmt = text("""
            INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced, created_at, updated_at)
            VALUES (:user_id, :verse_id, :practice_count, NOW(), NOW(), NOW())
            ON CONFLICT (user_id, verse_id) 
            DO UPDATE SET 
                practice_count = :practice_count,
                last_practiced = NOW(),
                updated_at = NOW()
        """)
        
        # Execute in batches
        for verse_id in verse_ids:
            params = {
                "user_id": user_id,
                "verse_id": verse_id,
                "practice_count": practice_count
            }
            db.execute(stmt, params)
            updated_count += 1
    else:
        # For "Clear All" - delete records
        result = db.query(models.UserVerse).filter(
            models.UserVerse.user_id == user_id,
            models.UserVerse.verse_id.in_(verse_ids)
        ).delete(synchronize_session=False)
        updated_count = result
    
    db.commit()
    return {"success": True, "updated_count": updated_count}