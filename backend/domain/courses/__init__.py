# backend/domain/courses/__init__.py

from .models import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
    CourseDetailResponse,
    EnrolledCourseResponse,
    CourseEnrollment,
    UserCourseProgress,
    LessonCreate,
    LessonUpdate,
    LessonResponse,
    LessonListResponse,
    UserLessonProgress,
    LessonFlashcard,
    AddFlashcardsToQueueRequest,
    CourseNotFoundError,
    LessonNotFoundError,
    AlreadyEnrolledError,
    UnauthorizedError,
    CourseValidationError
)
from .repository import CourseRepository
from .service import CourseService

__all__ = [
    # Models
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "CourseListResponse",
    "CourseDetailResponse",
    "EnrolledCourseResponse",
    "CourseEnrollment",
    "UserCourseProgress",
    "LessonCreate",
    "LessonUpdate",
    "LessonResponse",
    "LessonListResponse",
    "UserLessonProgress",
    "LessonFlashcard",
    "AddFlashcardsToQueueRequest",
    # Exceptions
    "CourseNotFoundError",
    "LessonNotFoundError",
    "AlreadyEnrolledError",
    "UnauthorizedError",
    "CourseValidationError",
    # Core classes
    "CourseRepository",
    "CourseService",
]