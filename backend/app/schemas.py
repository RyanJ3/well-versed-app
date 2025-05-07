# app/schemas.py
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum

class DenominationType(str, Enum):
    NON_DENOMINATIONAL = "Non-denominational"
    CATHOLIC = "Catholic"
    PROTESTANT = "Protestant"
    ORTHODOX = "Orthodox"
    OTHER = "Other"

class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserCreate(UserBase):
    cognito_id: str

class User(UserBase):
    user_id: int
    cognito_id: str
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    active: bool = True
    
    class Config:
        orm_mode = True

class UserSettingsBase(BaseModel):
    denomination: Optional[DenominationType] = DenominationType.NON_DENOMINATIONAL
    preferred_translation: Optional[str] = "NIV"
    include_apocrypha: Optional[bool] = False

class UserSettingsCreate(UserSettingsBase):
    user_id: int

class UserSettings(UserSettingsBase):
    setting_id: int
    user_id: int
    
    class Config:
        orm_mode = True

class BibleVerseBase(BaseModel):
    verse_id: str
    book_id: str
    chapter_number: int
    verse_number: int

class BibleVerse(BibleVerseBase):
    class Config:
        orm_mode = True

class UserVerseBase(BaseModel):
    practice_count: int = 0

class UserVerseCreate(UserVerseBase):
    user_id: int
    verse_id: str

class UserVerseUpdate(BaseModel):
    practice_count: int = 1

class UserVerse(UserVerseBase):
    user_id: int
    verse_id: str
    last_practiced: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class UserVerseDetail(BaseModel):
    verse: BibleVerse
    practice_count: int
    last_practiced: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True