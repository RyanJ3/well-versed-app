# backend/app/models/user_models_normalized.py
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, SmallInteger, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.enums import BibleTranslation


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
    
    # Relationships
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    verses = relationship("UserVerse", back_populates="user", cascade="all, delete-orphan")
    created_decks = relationship("Deck", back_populates="creator", cascade="all, delete-orphan")
    saved_decks = relationship("SavedDeck", back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    __tablename__ = "user_settings"
    
    setting_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    denomination = Column(String(50))
    preferred_bible = Column(Enum(BibleTranslation), default=BibleTranslation.ESV)
    include_apocrypha = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="settings")


class UserVerse(Base):
    __tablename__ = "user_verses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    verse_id = Column(Integer, ForeignKey("bible_verses.verse_id"), nullable=False)
    
    # Confidence levels: 0-5 (0=not memorized, 1=just started, 5=perfectly memorized)
    confidence_level = Column(SmallInteger, default=0, nullable=False)
    
    # Track review count for statistics
    review_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="verses")
    verse = relationship("BibleVerse", back_populates="user_verses")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'verse_id', name='uq_user_verse'),
    )