# app/models/user_verse_range.py

from sqlalchemy import Column, Integer, SmallInteger, Boolean, TIMESTAMP, Text, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class UserVerseRange(Base):
    __tablename__ = "user_verse_ranges"

    range_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    book_id = Column(SmallInteger, nullable=False)
    chapter_start = Column(SmallInteger, nullable=False)
    verse_start = Column(SmallInteger, nullable=False)
    chapter_end = Column(SmallInteger, nullable=False)
    verse_end = Column(SmallInteger, nullable=False)
    range_name = Column(String(100))
    notes = Column(Text)
    difficulty_level = Column(Integer, default=1)
    mastery_level = Column(Integer, default=0)
    last_reviewed = Column(TIMESTAMP)
    next_review = Column(TIMESTAMP)
    review_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    is_active = Column(Boolean, default=True)
