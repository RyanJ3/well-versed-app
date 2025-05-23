from sqlalchemy import Boolean, Column, ForeignKey, Integer, SmallInteger, String, DateTime, CheckConstraint
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
    
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    verse_ranges = relationship("UserVerseRange", back_populates="user")

class UserSettings(Base):
    __tablename__ = "user_settings"
    
    setting_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    denomination = Column(String(50))
    preferred_bible = Column(String(50), default="ESV")
    include_apocrypha = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="settings")

class Book(Base):
    __tablename__ = "books"
    
    book_id = Column(SmallInteger, primary_key=True)
    book_code = Column(String(3), unique=True, nullable=False)
    book_name = Column(String(50), nullable=False)
    testament = Column(String(20), nullable=False)
    book_group = Column(String(50), nullable=False)
    total_chapters = Column(SmallInteger, nullable=False)
    total_verses = Column(Integer, nullable=False)
    canonical_affiliation = Column(String(20), nullable=False)
    is_apocryphal_book = Column(Boolean, default=False)
    display_order = Column(SmallInteger, nullable=False)

class ChapterVerseCount(Base):
    __tablename__ = "chapter_verse_counts"
    
    book_id = Column(SmallInteger, ForeignKey("books.book_id"), primary_key=True)
    chapter_number = Column(SmallInteger, primary_key=True)
    verse_count = Column(SmallInteger, nullable=False)

class ApocryphalContent(Base):
    __tablename__ = "apocryphal_content"
    
    apocryphal_id = Column(Integer, primary_key=True)
    book_id = Column(SmallInteger, ForeignKey("books.book_id"), nullable=False)
    chapter_number = Column(SmallInteger, nullable=False)
    verse_start = Column(SmallInteger)
    verse_end = Column(SmallInteger)
    description = Column(String(100))

class UserVerseRange(Base):
    __tablename__ = "user_verse_ranges"
    
    range_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    book_id = Column(SmallInteger, ForeignKey("books.book_id"), nullable=False)
    chapter_start = Column(SmallInteger, nullable=False)
    verse_start = Column(SmallInteger, nullable=False)
    chapter_end = Column(SmallInteger, nullable=False)
    verse_end = Column(SmallInteger, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint('(chapter_start < chapter_end) OR (chapter_start = chapter_end AND verse_start <= verse_end)', 
                       name='valid_range'),
    )
    
    user = relationship("User", back_populates="verse_ranges")
    book = relationship("Book")