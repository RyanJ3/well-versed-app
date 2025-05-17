from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db

router = APIRouter()

@router.get("/{user_id}", response_model=schemas.UserProfile)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get a user's profile"""
    # Get the user
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user settings
    user_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    
    # For now, just return basic profile without memorization stats
    # In the future, you'll add verse-related functionality
    return schemas.UserProfile(
        id=db_user.user_id,
        name=f"{db_user.first_name or ''} {db_user.last_name or ''}".strip() or db_user.username,
        email=db_user.email,
        created_at=db_user.created_at,
        denomination=user_settings.denomination if user_settings else None,
        preferred_bible=user_settings.preferred_bible if user_settings else None,
        include_apocrypha=user_settings.include_apocrypha if user_settings else False,
        verses_memorized=0,  # Placeholder for future functionality
        streak_days=0,       # Placeholder for future functionality 
        books_started=0,     # Placeholder for future functionality
        currently_memorizing=[]  # Placeholder for future functionality
    )

@router.put("/{user_id}", response_model=schemas.UserProfile)
def update_user_profile(user_id: int, profile_update: schemas.UserProfileUpdate, db: Session = Depends(get_db)):
    """Update a user's profile"""
    # Get the user
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    if profile_update.first_name is not None:
        db_user.first_name = profile_update.first_name
    if profile_update.last_name is not None:
        db_user.last_name = profile_update.last_name
    
    # Get or create user settings
    user_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    if not user_settings:
        user_settings = models.UserSettings(user_id=user_id)
        db.add(user_settings)
    
    # Update user settings
    if profile_update.denomination is not None:
        user_settings.denomination = profile_update.denomination
    if profile_update.preferred_bible is not None:
        user_settings.preferred_bible = profile_update.preferred_bible
    if profile_update.include_apocrypha is not None:
        user_settings.include_apocrypha = profile_update.include_apocrypha
    
    db.commit()
    db.refresh(db_user)
    if user_settings in db.identity_map:
        db.refresh(user_settings)
    
    # Return updated profile
    return get_user_profile(user_id, db)

@router.post("/test", response_model=schemas.UserProfile)
def create_test_user(db: Session = Depends(get_db)):
    # Check if test user exists
    user = db.query(models.User).filter(models.User.user_id == 1).first()
    if not user:
        # Create test user
        user = models.User(
            user_id=1,
            username="testuser",
            email="test@example.com",
            password_hash="test_hash",
            first_name="Test",
            last_name="User"
        )
        db.add(user)
        
        # Create test settings
        settings = models.UserSettings(
            user_id=1,
            denomination="Non-denominational",
            preferred_bible="ESV", 
            include_apocrypha=False
        )
        db.add(settings)
        db.commit()
    
    return get_user_profile(1, db)

# In app/api/users.py, add this new endpoint
@router.post("/create-test", response_model=schemas.UserProfile)
def create_test_user(db: Session = Depends(get_db)):
    # Check if test user exists
    user = db.query(models.User).filter(models.User.user_id == 1).first()
    if not user:
        # Create test user
        user = models.User(
            user_id=1,
            username="testuser",
            email="test@example.com",
            password_hash="test_hash",
            first_name="Test",
            last_name="User"
        )
        db.add(user)
        
        # Create test settings
        settings = models.UserSettings(
            user_id=1,
            denomination="Non-denominational",
            preferred_bible="ESV", 
            include_apocrypha=False
        )
        db.add(settings)
        db.commit()
    
    return get_user_profile(1, db)

@router.put("/{user_id}", response_model=schemas.UserProfile)
def update_user_profile(user_id: int, profile_update: schemas.UserProfileUpdate, db: Session = Depends(get_db)):
    """Update a user's profile"""
    # Print received data for debugging
    print(f"Received profile update: {profile_update.dict()}")
    
    # Get the user
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    if profile_update.first_name is not None:
        db_user.first_name = profile_update.first_name
    if profile_update.last_name is not None:
        db_user.last_name = profile_update.last_name
    
    # Get or create user settings
    user_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    if not user_settings:
        user_settings = models.UserSettings(user_id=user_id)
        db.add(user_settings)
    
    # Update user settings
    if profile_update.denomination is not None:
        user_settings.denomination = profile_update.denomination
    if profile_update.preferred_bible is not None:
        user_settings.preferred_bible = profile_update.preferred_bible
    if profile_update.include_apocrypha is not None:
        user_settings.include_apocrypha = profile_update.include_apocrypha
        print(f"Updated include_apocrypha to: {profile_update.include_apocrypha}")
    
    db.commit()
    db.refresh(db_user)
    if user_settings in db.identity_map:
        db.refresh(user_settings)
    
    # Return updated profile
    return get_user_profile(user_id, db)