from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CourseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_public: bool = False
    tags: List[str] = Field(default_factory=list)


class CourseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class CourseResponse(BaseModel):
    id: int
    creator_id: int
    creator_name: str
    name: str  # Not 'title' - keeping consistent with DB
    description: Optional[str]
    thumbnail_url: Optional[str]
    is_public: bool
    created_at: str
    updated_at: str
    lesson_count: int
    enrolled_count: int
    tags: List[str]


class CourseEnrollment(BaseModel):
    user_id: int
    course_id: int
    enrolled_at: str
    current_lesson_position: int
    lessons_completed: int
    last_accessed: Optional[str]
    completed_at: Optional[str]
