# backend/app/models/user_models.py
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, SmallInteger, UniqueConstraint
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
    
    # Relationships
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    verses = relationship("UserVerse", back_populates="user", cascade="all, delete-orphan")
    created_decks = relationship("Deck", back_populates="creator", cascade="all, delete-orphan")
    saved_decks = relationship("SavedDeck", back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    __tablename__ = "user_settings"
    
    setting_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    denomination = Column(String(50))
    preferred_bible = Column(String(50), default="ESV")
    include_apocrypha = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="settings")


class UserVerse(Base):
    __tablename__ = "user_verses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    verse_id = Column(String(20), nullable=False, index=True)  # Format: BOOK-CHAPTER-VERSE
    book_id = Column(SmallInteger, ForeignKey("books.book_id"), nullable=False)
    chapter_number = Column(SmallInteger, nullable=False)
    verse_number = Column(SmallInteger, nullable=False)
    
    # Confidence levels: 0-5 (0=not memorized, 1=just started, 5=perfectly memorized)
    confidence_level = Column(SmallInteger, default=1, nullable=False)
    
    # Spaced repetition tracking
    last_reviewed = Column(DateTime, default=func.now())
    next_review = Column(DateTime, default=func.now())
    review_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="verses")
    book = relationship("Book")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'verse_id', name='uq_user_verse'),
    )