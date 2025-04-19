from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
import logging
import os
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Set up FastAPI app
app = FastAPI(title="Well Versed API", description="API for the Well Versed Bible Memorization App")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup for Amazon Aurora PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db/wellversed")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define database models
class Verse(Base):
    __tablename__ = "verses"

    verse_id = Column(String(12), primary_key=True, index=True)
    verse_number = Column(Integer, nullable=False)

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    created_at = Column(String(50))  # ISO format timestamp
    last_login = Column(String(50))
    active = Column(Boolean, default=True)

class UserSettings(Base):
    __tablename__ = "user_settings"

    setting_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    denomination = Column(String(50))
    include_apocrypha = Column(Boolean, default=False)

# Pydantic models for data validation
class UserSettingsBase(BaseModel):
    denomination: Optional[str] = None
    include_apocrypha: bool = False

    class Config:
        orm_mode = True

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Routes
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/verses/count")
async def count_verses(db: Session = Depends(get_db)):
    """Count the total number of verses in the database"""
    total_verses = db.query(Verse).count()
    return {"total_verses": total_verses}

@app.get("/api/verses/{verse_id}")
async def get_verse(verse_id: str, db: Session = Depends(get_db)):
    """Get a specific verse by ID"""
    verse = db.query(Verse).filter(Verse.verse_id == verse_id).first()
    if not verse:
        raise HTTPException(status_code=404, detail="Verse not found")
    return verse

@app.get("/api/user/{user_id}/settings")
async def get_user_settings(user_id: int, db: Session = Depends(get_db)):
    """Get user settings"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings

@app.put("/api/user/{user_id}/settings")
async def update_user_settings(user_id: int, settings: UserSettingsBase, db: Session = Depends(get_db)):
    """Update user settings"""
    db_settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    
    if not db_settings:
        # Create new settings if they don't exist
        db_settings = UserSettings(
            user_id=user_id,
            denomination=settings.denomination,
            include_apocrypha=settings.include_apocrypha
        )
        db.add(db_settings)
    else:
        # Update existing settings
        db_settings.denomination = settings.denomination
        db_settings.include_apocrypha = settings.include_apocrypha
    
    db.commit()
    db.refresh(db_settings)
    return db_settings

# Database initialization
@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")