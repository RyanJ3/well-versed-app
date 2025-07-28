# backend/domain/courses/models.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


class CourseCreate(BaseModel):
    title: str = Field(alias="name")
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_public: bool = False
    tags: List[str] = []


class CourseUpdate(BaseModel):
    title: Optional[str] = Field(default=None, alias="name")
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class CourseResponse(BaseModel):
    id: int
    creator_id: int
    creator_name: str
    title: str
    description: Optional[str]
    thumbnail_url: Optional[str]
    is_public: bool
    created_at: str
    updated_at: str
    lesson_count: int = 0
    enrolled_count: int = 0
    tags: List[str] = []


class CourseListResponse(BaseModel):
    total: int
    courses: List[CourseResponse]
    page: int
    per_page: int


class LessonResponse(BaseModel):
    id: int
    course_id: int
    position: int
    title: str
    description: Optional[str]
    content_type: str
    content_data: Optional[Dict]
    flashcards_required: int
    created_at: str


class CourseDetailResponse(CourseResponse):
    lessons: List[LessonResponse]
    is_enrolled: bool
    user_progress: Optional['UserCourseProgress']


class UserCourseProgress(BaseModel):
    user_id: int
    course_id: int
    current_lesson_id: Optional[int]
    current_lesson_position: int
    lessons_completed: int
    enrolled_at: str
    last_accessed: str
    completed_at: Optional[str]


class UserLessonProgress(BaseModel):
    user_id: int
    lesson_id: int
    course_id: int
    started_at: str
    completed_at: Optional[str]
    flashcards_required: int
    flashcards_completed: int
    is_unlocked: bool
    quiz_attempts: Optional[int]
    best_score: Optional[int]
    last_attempt: Optional[str]


class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: str
    content_data: Optional[Dict] = None
    flashcards_required: int = 0
    position: Optional[int] = None


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[str] = None
    content_data: Optional[Dict] = None
    flashcards_required: Optional[int] = None
    position: Optional[int] = None


class LessonListResponse(BaseModel):
    total: int
    lessons: List[LessonResponse]


class LessonFlashcard(BaseModel):
    id: int
    lesson_id: int
    front: str
    back: str
    created_at: str


class CourseEnrollment(BaseModel):
    user_id: int
    course_id: int
    enrolled_at: str
    last_accessed: str


# Exceptions
class CourseNotFoundError(Exception):
    pass


class LessonNotFoundError(Exception):
    pass


class AlreadyEnrolledError(Exception):
    pass


class UnauthorizedError(Exception):
    pass