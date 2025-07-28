# backend/domain/courses/service.py

from typing import List, Optional, Dict
from .repository import CourseRepository
from .models import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
    CourseDetailResponse,
    UserCourseProgress,
    LessonCreate,
    LessonUpdate,
    LessonResponse,
    LessonListResponse,
    UserLessonProgress,
    LessonFlashcard,
    CourseNotFoundError,
    AlreadyEnrolledError,
    LessonNotFoundError,
    UnauthorizedError
)


class CourseService:
    def __init__(self, repository: CourseRepository):
        self.repository = repository

    # ========== Course Management ==========

    def create_course(self, data: CourseCreate, user_id: int) -> CourseResponse:
        """Create a new course"""
        return self.repository.create_course(data, user_id)

    def list_public_courses(
        self, 
        page: int = 1, 
        per_page: int = 20,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> CourseListResponse:
        """List all public courses with pagination and filtering"""
        courses = self.repository.list_public_courses(page, per_page, search, tags)
        total = self.repository.count_public_courses(search, tags)
        
        return CourseListResponse(
            courses=courses,
            total=total,
            page=page,
            per_page=per_page
        )

    def list_user_courses(self, user_id: int) -> CourseListResponse:
        """List courses created by a specific user"""
        courses = self.repository.list_user_courses(user_id)
        return CourseListResponse(
            courses=courses,
            total=len(courses),
            page=1,
            per_page=len(courses)
        )

    def list_enrolled_courses(self, user_id: int) -> List[CourseResponse]:
        """List all courses a user is enrolled in"""
        return self.repository.get_enrolled_courses(user_id)

    def get_course_detail(self, course_id: int, user_id: Optional[int] = None) -> CourseDetailResponse:
        """Get course details including lessons and enrollment status"""
        course = self.repository.get_course(course_id)
        if not course:
            raise CourseNotFoundError(f"Course {course_id} not found")
        
        lessons = self.repository.get_course_lessons(course_id)
        is_enrolled = False
        user_progress = None
        
        if user_id:
            is_enrolled = self.repository.is_user_enrolled(course_id, user_id)
            if is_enrolled:
                user_progress = self.repository.get_user_course_progress(course_id, user_id)
        
        return CourseDetailResponse(
            **course.dict(),
            lessons=lessons,
            is_enrolled=is_enrolled,
            user_progress=user_progress
        )

    def update_course(self, course_id: int, updates: CourseUpdate, user_id: int) -> CourseResponse:
        """Update a course (only by owner)"""
        course = self.repository.get_course(course_id)
        if not course:
            raise CourseNotFoundError(f"Course {course_id} not found")
        
        if course.creator_id != user_id:
            raise UnauthorizedError("Not authorized to update this course")
        
        return self.repository.update_course(course_id, updates)

    def delete_course(self, course_id: int, user_id: int) -> None:
        """Delete a course (only by owner)"""
        course = self.repository.get_course(course_id)
        if not course:
            raise CourseNotFoundError(f"Course {course_id} not found")
        
        if course.creator_id != user_id:
            raise UnauthorizedError("Not authorized to delete this course")
        
        self.repository.delete_course(course_id)

    # ========== Enrollment & Progress ==========

    def enroll_user(self, course_id: int, user_id: int) -> UserCourseProgress:
        """Enroll a user in a course"""
        course = self.repository.get_course(course_id)
        if not course:
            raise CourseNotFoundError(f"Course {course_id} not found")
        
        if self.repository.is_user_enrolled(course_id, user_id):
            raise AlreadyEnrolledError("Already enrolled in this course")
        
        return self.repository.enroll_user(course_id, user_id)

    def unenroll_user(self, course_id: int, user_id: int) -> None:
        """Unenroll a user from a course"""
        course = self.repository.get_course(course_id)
        if not course:
            raise CourseNotFoundError(f"Course {course_id} not found")
        
        self.repository.unenroll_user(course_id, user_id)

    def get_user_course_progress(self, course_id: int, user_id: int) -> UserCourseProgress:
        """Get user's progress in a course"""
        progress = self.repository.get_user_course_progress(course_id, user_id)
        if not progress:
            raise CourseNotFoundError(f"No enrollment found for course {course_id}")
        return progress

    # ========== Lesson Management ==========

    def create_lesson(self, course_id: int, lesson: LessonCreate, user_id: int) -> LessonResponse:
        """Create a new lesson (only by course owner)"""
        course = self.repository.get_course(course_id)
        if not course:
            raise CourseNotFoundError(f"Course {course_id} not found")
        
        if course.creator_id != user_id:
            raise UnauthorizedError("Not authorized to add lessons to this course")
        
        return self.repository.create_lesson(course_id, lesson)

    def list_lessons(self, course_id: int) -> LessonListResponse:
        """List all lessons for a course"""
        course = self.repository.get_course(course_id)
        if not course:
            raise CourseNotFoundError(f"Course {course_id} not found")
        
        lessons = self.repository.get_course_lessons(course_id)
        return LessonListResponse(
            total=len(lessons),
            lessons=lessons
        )

    def get_lesson(self, lesson_id: int, user_id: Optional[int] = None) -> Dict:
        """Get lesson details with flashcards and user progress"""
        lesson = self.repository.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError(f"Lesson {lesson_id} not found")
        
        flashcards = self.repository.get_lesson_flashcards(lesson_id)
        user_progress = None
        
        if user_id:
            user_progress = self.repository.get_user_lesson_progress(lesson_id, user_id)
        
        return {
            **lesson.dict(),
            "flashcards": flashcards,
            "user_progress": user_progress
        }

    def update_lesson(self, lesson_id: int, updates: LessonUpdate, user_id: int) -> LessonResponse:
        """Update a lesson (only by course owner)"""
        lesson = self.repository.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError(f"Lesson {lesson_id} not found")
        
        course = self.repository.get_course(lesson.course_id)
        if course.creator_id != user_id:
            raise UnauthorizedError("Not authorized to update this lesson")
        
        return self.repository.update_lesson(lesson_id, updates)

    def delete_lesson(self, lesson_id: int, user_id: int) -> None:
        """Delete a lesson (only by course owner)"""
        lesson = self.repository.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError(f"Lesson {lesson_id} not found")
        
        course = self.repository.get_course(lesson.course_id)
        if course.creator_id != user_id:
            raise UnauthorizedError("Not authorized to delete this lesson")
        
        self.repository.delete_lesson(lesson_id)

    def reorder_lessons(self, course_id: int, lesson_ids: List[int], user_id: int) -> None:
        """Reorder lessons in a course"""
        course = self.repository.get_course(course_id)
        if not course:
            raise CourseNotFoundError(f"Course {course_id} not found")
        
        if course.creator_id != user_id:
            raise UnauthorizedError("Not authorized to reorder lessons")
        
        self.repository.reorder_lessons(course_id, lesson_ids)

    # ========== Lesson Progress ==========

    def start_lesson(self, lesson_id: int, user_id: int) -> UserLessonProgress:
        """Mark a lesson as started"""
        lesson = self.repository.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError(f"Lesson {lesson_id} not found")
        
        # Ensure user is enrolled in the course
        if not self.repository.is_user_enrolled(lesson.course_id, user_id):
            raise UnauthorizedError("Must be enrolled in course to start lessons")
        
        return self.repository.start_lesson(lesson_id, user_id)

    def complete_lesson(self, lesson_id: int, user_id: int) -> UserLessonProgress:
        """Mark a lesson as completed"""
        lesson = self.repository.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError(f"Lesson {lesson_id} not found")
        
        # Ensure user is enrolled in the course
        if not self.repository.is_user_enrolled(lesson.course_id, user_id):
            raise UnauthorizedError("Must be enrolled in course to complete lessons")
        
        return self.repository.complete_lesson(lesson_id, user_id)

    def get_user_lesson_progress(self, lesson_id: int, user_id: int) -> UserLessonProgress:
        """Get user's progress for a specific lesson"""
        progress = self.repository.get_user_lesson_progress(lesson_id, user_id)
        if not progress:
            raise LessonNotFoundError(f"No progress found for lesson {lesson_id}")
        return progress

    # ========== Flashcards ==========

    def get_lesson_flashcards(self, lesson_id: int) -> List[LessonFlashcard]:
        """Get all flashcards for a lesson"""
        lesson = self.repository.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError(f"Lesson {lesson_id} not found")
        
        return self.repository.get_lesson_flashcards(lesson_id)

    def create_lesson_flashcards(
        self, 
        lesson_id: int, 
        flashcards: List[Dict], 
        user_id: int
    ) -> List[LessonFlashcard]:
        """Create custom flashcards for a lesson"""
        lesson = self.repository.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError(f"Lesson {lesson_id} not found")
        
        course = self.repository.get_course(lesson.course_id)
        if course.creator_id != user_id:
            raise UnauthorizedError("Not authorized to add flashcards to this lesson")
        
        return self.repository.create_lesson_flashcards(lesson_id, flashcards)

    def add_flashcards_to_queue(self, lesson_id: int, user_id: int, request: Dict) -> None:
        """Add flashcards from a lesson to user's study queue"""
        lesson = self.repository.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError(f"Lesson {lesson_id} not found")
        
        # Ensure user is enrolled
        if not self.repository.is_user_enrolled(lesson.course_id, user_id):
            raise UnauthorizedError("Must be enrolled in course to add flashcards")
        
        self.repository.add_flashcards_to_queue(lesson_id, user_id, request)

    def update_flashcard_requirement(self, lesson_id: int, required_count: int, user_id: int) -> None:
        """Update the number of flashcards required to complete a lesson"""
        lesson = self.repository.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError(f"Lesson {lesson_id} not found")
        
        course = self.repository.get_course(lesson.course_id)
        if course.creator_id != user_id:
            raise UnauthorizedError("Not authorized to update flashcard requirements")
        
        self.repository.update_flashcard_requirement(lesson_id, required_count)

    # ========== Tags ==========

    def list_tags(self) -> List[str]:
        """Get all available course tags"""
        return self.repository.list_tags()