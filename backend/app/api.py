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
            "confidence": user_verse.confidence,
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
    
    db_user_verse.confidence = user_verse.confidence
    db_user_verse.practice_count += 1
    db_user_verse.last_practiced = func.now()
    db_user_verse.updated_at = func.now()
    
    db.commit()
    db.refresh(db_user_verse)
    return db_user_verse