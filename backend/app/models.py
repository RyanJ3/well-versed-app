from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime)
    active = Column(Boolean, default=True)
    
    # Relationship with user settings
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    
    # Relationship with memorized verses
    verses = relationship("UserVerse", back_populates="user")

class UserSettings(Base):
    __tablename__ = "user_settings"
    
    setting_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    denomination = Column(String(50))
    include_apocrypha = Column(Boolean, default=False)
    preferred_bible = Column(String(50), default="ESV")
    
    user = relationship("User", back_populates="settings")

class Verse(Base):
    __tablename__ = "verses"
    
    verse_id = Column(String(12), primary_key=True, index=True)
    verse_number = Column(Integer, nullable=False)
    is_apocryphal = Column(Boolean, default=False)  # Added field to track apocryphal verses
    
    # Relationship with users who memorized this verse
    users = relationship("UserVerse", back_populates="verse")

class UserVerse(Base):
    __tablename__ = "user_verses"
    
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    verse_id = Column(String(12), ForeignKey("verses.verse_id", ondelete="CASCADE"), primary_key=True)
    practice_count = Column(Integer, default=0)
    last_practiced = Column(DateTime)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, onupdate=func.now())
    
    user = relationship("User", back_populates="verses")
    verse = relationship("Verse", back_populates="users")