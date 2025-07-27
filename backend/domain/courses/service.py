import logging
from typing import List, Optional
from .repository import CourseRepository
from .schemas import CourseCreate, CourseUpdate, CourseResponse, CourseEnrollment
from .exceptions import CourseNotFoundError, AlreadyEnrolledError

logger = logging.getLogger(__name__)


class CourseService:
    def __init__(self, repository: CourseRepository):
        self.repo = repository

    def create_course(self, data: CourseCreate, user_id: int) -> CourseResponse:
        """Create a new course"""
        logger.info(f"Creating course '{data.name}' for user {user_id}")

        course_data = {
            'user_id': user_id,
            'name': data.name,
            'description': data.description,
            'thumbnail_url': data.thumbnail_url,
            'is_public': data.is_public,
            'tags': data.tags
        }

        result = self.repo.create_course_with_tags(course_data)
        return self._to_response(result)

    def get_course(self, course_id: int) -> CourseResponse:
        """Get course details"""
        course = self.repo.get_course_with_lessons(course_id)
        if not course:
            raise CourseNotFoundError(course_id)
        return self._to_response(course)

    def list_public_courses(self, skip: int = 0, limit: int = 20) -> List[CourseResponse]:
        """List public courses"""
        courses = self.repo.get_public_courses(skip, limit)
        return [self._to_response(c) for c in courses]

    def enroll_user(self, course_id: int, user_id: int) -> CourseEnrollment:
        """Enroll user in course"""
        # Check if course exists
        course = self.repo.get_course_with_lessons(course_id)
        if not course:
            raise CourseNotFoundError(course_id)

        # Check if already enrolled
        enrollment = self.repo.get_user_enrollment(course_id, user_id)
        if enrollment:
            raise AlreadyEnrolledError(user_id, course_id)

        result = self.repo.enroll_user(course_id, user_id)
        return CourseEnrollment(**result)

    def _to_response(self, course_dict: dict) -> CourseResponse:
        """Convert repository dict to response model"""
        return CourseResponse(
            id=course_dict.get('id') or course_dict.get('course_id'),
            creator_id=course_dict.get('creator_id') or course_dict.get('user_id'),
            creator_name=course_dict['creator_name'],
            name=course_dict.get('name') or course_dict.get('title'),  # Handle both field names
            description=course_dict['description'],
            thumbnail_url=course_dict['thumbnail_url'],
            is_public=course_dict['is_public'],
            created_at=course_dict['created_at'],
            updated_at=course_dict['updated_at'],
            lesson_count=course_dict.get('lesson_count', 0),
            enrolled_count=course_dict.get('enrolled_count', 0),
            tags=course_dict.get('tags', [])
        )
