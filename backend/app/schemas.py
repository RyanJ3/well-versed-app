from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Memorization Progress Schema - simplified for profile
class MemorizationProgress(BaseModel):
    reference: str
    progress: float
    last_practiced: Optional[datetime] = None

# User Profile Schema
class UserProfile(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime
    denomination: Optional[str] = None
    preferred_bible: Optional[str] = None
    include_apocrypha: Optional[bool] = False
    verses_memorized: Optional[int] = 0
    streak_days: Optional[int] = 0
    books_started: Optional[int] = 0
    currently_memorizing: Optional[List[MemorizationProgress]] = []
    
    class Config:
        orm_mode = True

# Profile Update Schema
class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    denomination: Optional[str] = None
    preferred_bible: Optional[str] = None
    include_apocrypha: Optional[bool] = None

class VerseBase(BaseModel):
    verse_id: str
    book_id: str
    chapter_number: int
    verse_number: int
    is_apocryphal: bool = False  # Added is_apocryphal field with default value

class Verse(VerseBase):
    class Config:
        orm_mode = True

class UserVerseBase(BaseModel):
    user_id: int
    verse_id: str
    practice_count: int = 0
    last_practiced: Optional[datetime] = None

class UserVerseCreate(BaseModel):
    user_id: int
    verse_id: str
    practice_count: int = 0
    last_practiced: Optional[datetime] = None

class UserVerseUpdate(BaseModel):
    practice_count: Optional[int] = None
    last_practiced: Optional[datetime] = None

class UserVerseDetail(BaseModel):
    verse: Verse
    practice_count: int
    last_practiced: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# New schema for bulk operations
class UserVerseBulkCreate(BaseModel):
    user_id: int
    book_id: str
    chapter_number: int
    verse_numbers: List[int]
    practice_count: int = 0
    last_practiced: Optional[datetime] = None