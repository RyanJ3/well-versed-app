# filename: app/schemas.py
# Pydantic schemas for API request/response validation

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    active: Optional[bool] = None

class User(UserBase):
    user_id: int
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    active: bool = True

    class Config:
        orm_mode = True

# UserSettings schemas
class UserSettingsBase(BaseModel):
    denomination: Optional[str] = None
    include_apocrypha: Optional[bool] = False

class UserSettingsCreate(UserSettingsBase):
    user_id: int

class UserSettingsUpdate(UserSettingsBase):
    pass

class UserSettings(UserSettingsBase):
    setting_id: int
    user_id: int

    class Config:
        orm_mode = True

# Verse schemas
class Verse(BaseModel):
    verse_id: str
    verse_number: int

    class Config:
        orm_mode = True

# UserVerse schemas
class UserVerseBase(BaseModel):
    confidence: int = 1

class UserVerseCreate(UserVerseBase):
    user_id: int
    verse_id: str

class UserVerseUpdate(UserVerseBase):
    pass

class UserVerse(UserVerseBase):
    user_id: int
    verse_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        
# Combined schema for frontend
class UserVerseDetail(BaseModel):
    verse: Verse
    confidence: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True