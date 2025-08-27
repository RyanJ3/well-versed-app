# backend/domain/courses/models.py

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime


# ========== Course Models ==========

class CourseCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    title: str = Field(alias="name")
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_public: bool = False
    tags: List[str] = []


class CourseUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
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
    thumbnail_url: Optional[str] = None
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


class EnrolledCourseResponse(BaseModel):
    """Course response with enrollment and progress data"""
    id: int
    creator_id: int
    creator_name: str
    title: str
    description: Optional[str]
    thumbnail_url: Optional[str] = None
    is_public: bool
    created_at: str
    updated_at: str
    lesson_count: int = 0
    enrolled_count: int = 0
    tags: List[str] = []
    
    # Progress data
    progress_percentage: int = 0
    lessons_completed: int = 0
    current_lesson_position: int = 1
    last_accessed: Optional[str] = None
    enrolled_at: Optional[str] = None


# ========== Lesson Models ==========

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


class LessonResponse(BaseModel):
    id: int
    course_id: int
    position: int
    title: str
    description: Optional[str]
    content_type: str
    content_data: Optional[Dict] = None
    flashcards_required: int
    created_at: str


class LessonListResponse(BaseModel):
    total: int
    lessons: List[LessonResponse]


# ========== Progress Models ==========

class UserCourseProgress(BaseModel):
    user_id: int
    course_id: int
    current_lesson_id: Optional[int] = None
    current_lesson_position: int
    lessons_completed: int
    enrolled_at: str
    last_accessed: str
    completed_at: Optional[str] = None


class UserLessonProgress(BaseModel):
    user_id: int
    lesson_id: int
    course_id: int
    started_at: str
    completed_at: Optional[str] = None
    flashcards_required: int
    flashcards_completed: int
    is_unlocked: bool
    quiz_attempts: Optional[int] = None
    best_score: Optional[int] = None
    last_attempt: Optional[str] = None


# ========== Flashcard Models ==========

class LessonFlashcard(BaseModel):
    id: int
    lesson_id: int
    front: str
    back: str
    created_at: str


class AddFlashcardsToQueueRequest(BaseModel):
    lesson_id: int
    flashcard_ids: Optional[List[int]] = None
    all_flashcards: bool = False


# ========== Extended Response Models ==========

class CourseDetailResponse(CourseResponse):
    lessons: List[LessonResponse]
    is_enrolled: bool
    user_progress: Optional[UserCourseProgress] = None


class CourseEnrollment(BaseModel):
    user_id: int
    course_id: int
    enrolled_at: str
    last_accessed: str


# ========== Exception Classes ==========

class CourseNotFoundError(Exception):
    """Raised when a course is not found"""
    pass


class LessonNotFoundError(Exception):
    """Raised when a lesson is not found"""
    pass


class AlreadyEnrolledError(Exception):
    """Raised when trying to enroll in a course already enrolled in"""
    pass


class UnauthorizedError(Exception):
    """Raised when user is not authorized to perform an action"""
    pass


class CourseValidationError(Exception):
    """Raised when course data validation fails"""
    pass