from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class VerseDetail(BaseModel):
    verse_id: str
    book_id: int
    chapter_number: int
    verse_number: int
    is_apocryphal: bool = False


class UserVerseResponse(BaseModel):
    verse: VerseDetail
    practice_count: int
    last_practiced: Optional[str]
    created_at: str
    updated_at: Optional[str]


class VerseUpdate(BaseModel):
    practice_count: int
    last_practiced: Optional[datetime] = None


class VerseTextsRequest(BaseModel):
    verse_codes: List[str]
    bible_id: Optional[str] = None

class ChapterSaveRequest(BaseModel):
    book_id: int
    chapter: int

class BookSaveRequest(BaseModel):
    book_id: int

class VerseTextResponse(BaseModel):
    verse_code: str
    text: str
    book_name: str
    chapter: int
    verse: int


class ConfidenceUpdate(BaseModel):
    confidence_score: int
    last_reviewed: Optional[datetime] = None


class VerseEntity(BaseModel):
    id: int
    verse_code: str
    book_id: int
    chapter_number: int
    verse_number: int
    is_apocryphal: bool


class UserVerseEntity(BaseModel):
    user_id: int
    verse_id: int
    practice_count: int
    last_practiced: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
