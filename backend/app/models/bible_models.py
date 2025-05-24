# backend/app/models/bible_models.py
from sqlalchemy import Column, Integer, String, SmallInteger, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import TestamentType, CanonicalType, BookGroupType


class Book(Base):
    __tablename__ = "books"
    
    book_id = Column(SmallInteger, primary_key=True)
    book_code = Column(String(3), nullable=False, unique=True)
    book_name = Column(String(50), nullable=False)
    testament = Column(Enum(TestamentType), nullable=False)
    book_group = Column(Enum(BookGroupType), nullable=False)
    total_chapters = Column(SmallInteger, nullable=False)
    total_verses = Column(Integer, nullable=False)
    canonical_affiliation = Column(Enum(CanonicalType), nullable=False)
    is_apocryphal_book = Column(Boolean, default=False)
    display_order = Column(SmallInteger, nullable=False)
    
    # Relationships
    chapter_counts = relationship("ChapterVerseCount", back_populates="book")
    apocryphal_content = relationship("ApocryphalContent", back_populates="book")
    user_verses = relationship("UserVerse", back_populates="book")
    deck_verses = relationship("DeckVerse", back_populates="book")


class ChapterVerseCount(Base):
    __tablename__ = "chapter_verse_counts"
    
    book_id = Column(SmallInteger, ForeignKey("books.book_id"), primary_key=True)
    chapter_number = Column(SmallInteger, primary_key=True)
    verse_count = Column(SmallInteger, nullable=False)
    
    # Relationships
    book = relationship("Book", back_populates="chapter_counts")


class ApocryphalContent(Base):
    __tablename__ = "apocryphal_content"
    
    apocryphal_id = Column(Integer, primary_key=True, index=True)
    book_id = Column(SmallInteger, ForeignKey("books.book_id"), nullable=False)
    chapter_number = Column(SmallInteger, nullable=False)
    verse_start = Column(SmallInteger)
    verse_end = Column(SmallInteger)
    description = Column(String(100))
    
    # Relationships
    book = relationship("Book", back_populates="apocryphal_content")