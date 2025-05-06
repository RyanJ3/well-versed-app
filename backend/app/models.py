# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class DenominationType(enum.Enum):
    NON_DENOMINATIONAL = "Non-denominational"
    CATHOLIC = "Catholic"
    PROTESTANT = "Protestant"
    ORTHODOX = "Orthodox"
    OTHER = "Other"

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    cognito_id = Column(String(100), unique=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime)
    active = Column(Boolean, default=True)
    
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    verses = relationship("UserVerse", back_populates="user")

class UserSettings(Base):
    __tablename__ = "user_settings"
    setting_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True)
    denomination = Column(Enum(DenominationType), default=DenominationType.NON_DENOMINATIONAL)
    preferred_translation = Column(String(10), default="NIV")
    include_apocrypha = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="settings")

class BibleBook(Base):
    __tablename__ = "bible_books"
    book_id = Column(String(3), primary_key=True)
    name = Column(String(50), nullable=False)
    testament = Column(String(3), nullable=False)
    book_group = Column(String(50), nullable=False)
    
    verses = relationship("BibleVerse", back_populates="book")

class BibleVerse(Base):
    __tablename__ = "bible_verses"
    verse_id = Column(String(12), primary_key=True)
    book_id = Column(String(3), ForeignKey("bible_books.book_id"))
    chapter_number = Column(Integer, nullable=False)
    verse_number = Column(Integer, nullable=False)
    
    book = relationship("BibleBook", back_populates="verses")
    users = relationship("UserVerse", back_populates="verse")

class UserVerse(Base):
    __tablename__ = "user_verses"
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    verse_id = Column(String(12), ForeignKey("bible_verses.verse_id"), primary_key=True)
    confidence = Column(Integer, default=1)
    practice_count = Column(Integer, default=0)
    last_practiced = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime)
    
    __table_args__ = (
        CheckConstraint('confidence >= 1 AND confidence <= 1000', name='check_confidence_range'),
    )
    
    user = relationship("User", back_populates="verses")
    verse = relationship("BibleVerse", back_populates="users")