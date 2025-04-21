# filename: app/api.py
# API routes and handlers

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import update, func, text

from app.database import get_db
from app import models, schemas

router = APIRouter()

# User endpoints
@router.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # In a real app, you would hash the password here
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=user.password,  # In production: use proper password hashing
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user.dict(exclude_unset=True)
    if "password" in update_data:
        # In production: use proper password hashing
        update_data["password_hash"] = update_data["password"]
        del update_data["password"]
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

# User Settings endpoints
@router.get("/settings/{user_id}", response_model=schemas.UserSettings)
def read_user_settings(user_id: int, db: Session = Depends(get_db)):
    db_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    if db_settings is None:
        # Create default settings if none exist
        db_settings = models.UserSettings(user_id=user_id)
        db.add(db_settings)
        db.commit()
        db.refresh(db_settings)
    return db_settings

@router.put("/settings/{user_id}", response_model=schemas.UserSettings)
def update_user_settings(user_id: int, settings: schemas.UserSettingsUpdate, db: Session = Depends(get_db)):
    db_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    if db_settings is None:
        # Create settings if they don't exist
        db_settings = models.UserSettings(user_id=user_id, **settings.dict())
        db.add(db_settings)
    else:
        # Update existing settings
        for key, value in settings.dict().items():
            setattr(db_settings, key, value)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings

# Verse endpoints
@router.get("/verses/", response_model=List[schemas.Verse])
def read_verses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    verses = db.query(models.Verse).offset(skip).limit(limit).all()
    return verses

@router.get("/verses/{verse_id}", response_model=schemas.Verse)
def read_verse(verse_id: str, db: Session = Depends(get_db)):
    db_verse = db.query(models.Verse).filter(models.Verse.verse_id == verse_id).first()
    if db_verse is None:
        raise HTTPException(status_code=404, detail="Verse not found")
    return db_verse

# User Verses endpoints
@router.get("/user-verses/{user_id}", response_model=List[schemas.UserVerseDetail])
def read_user_verses(user_id: int, db: Session = Depends(get_db)):
    user_verses = db.query(
        models.UserVerse, models.Verse
    ).join(
        models.Verse, models.UserVerse.verse_id == models.Verse.verse_id
    ).filter(
        models.UserVerse.user_id == user_id
    ).all()
    
    result = []
    for user_verse, verse in user_verses:
        result.append({
            "verse": verse,
            "confidence": user_verse.confidence,
            "created_at": user_verse.created_at,
            "updated_at": user_verse.updated_at
        })
    
    return result

@router.post("/user-verses/", response_model=schemas.UserVerse)
def create_user_verse(user_verse: schemas.UserVerseCreate, db: Session = Depends(get_db)):
    # Check if verse exists
    db_verse = db.query(models.Verse).filter(models.Verse.verse_id == user_verse.verse_id).first()
    if db_verse is None:
        raise HTTPException(status_code=404, detail="Verse not found")
    
    # Check if user already has this verse
    existing = db.query(models.UserVerse).filter(
        models.UserVerse.user_id == user_verse.user_id,
        models.UserVerse.verse_id == user_verse.verse_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User already has this verse")
    
    # Create new user verse
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
    db_user_verse.updated_at = func.now()
    
    db.commit()
    db.refresh(db_user_verse)
    return db_user_verse

# Add to your existing FastAPI routes
# Replace the health check endpoints with these router-based versions

@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Simple health check endpoint that doesn't require database access"""
    return {"status": "ok", "message": "Service is running"}

@router.get("/health/database")
def database_health_check(db: Session = Depends(get_db)):
    """Health check that verifies database connectivity"""
    try:
        # Use the text() function to properly create a SQL text expression
        db.execute(text("SELECT 1"))
        return {"status": "ok", "message": "Service and database connection are healthy"}
    except Exception as e:
        # Fix the error response format
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"status": "error", "message": f"Database connection failed: {str(e)}"}
        )
