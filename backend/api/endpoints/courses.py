# backend/api/endpoints/courses.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from core.dependencies import get_course_service
from domain.courses import (
    CourseService,
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
    CourseDetailResponse,
    CourseEnrollment,
    UserCourseProgress,
    LessonCreate,
    LessonUpdate,
    LessonResponse,
    LessonListResponse,
    UserLessonProgress,
    LessonFlashcard,
    CourseNotFoundError,
    AlreadyEnrolledError,
    LessonNotFoundError
)

router = APIRouter(tags=["courses"])

# Temporary - will implement proper auth later
def get_current_user_id() -> int:
    return 1


# ========== Course Management ==========

@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    data: CourseCreate,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Create a new course"""
    return service.create_course(data, user_id)


@router.get("/public", response_model=CourseListResponse)
def list_public_courses(
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    service: CourseService = Depends(get_course_service)
):
    """List all public courses"""
    tag_list = [t.strip() for t in tags.split(',')] if tags else None
    return service.list_public_courses(page, per_page, search, tag_list)


@router.get("/user/{user_id}", response_model=CourseListResponse)
def list_user_courses(
    user_id: int,
    service: CourseService = Depends(get_course_service)
):
    """List courses created by a user"""
    return service.list_user_courses(user_id)


@router.get("/enrolled/{user_id}", response_model=List[CourseResponse])
def list_enrolled_courses(
    user_id: int,
    service: CourseService = Depends(get_course_service)
):
    """List all courses a user is enrolled in"""
    return service.list_enrolled_courses(user_id)


@router.get("/{course_id}", response_model=CourseDetailResponse)
def get_course(
    course_id: int,
    user_id: Optional[int] = None,
    service: CourseService = Depends(get_course_service)
):
    """Get course details with lessons"""
    try:
        return service.get_course_detail(course_id, user_id)
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    updates: CourseUpdate,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Update a course"""
    try:
        return service.update_course(course_id, updates, user_id)
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Delete a course"""
    try:
        service.delete_course(course_id, user_id)
        return {"message": "Course deleted"}
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")


# ========== Enrollment & Progress ==========

@router.post("/{course_id}/enroll", response_model=UserCourseProgress)
def enroll_in_course(
    course_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Enroll in a course"""
    try:
        return service.enroll_user(course_id, user_id)
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")
    except AlreadyEnrolledError:
        raise HTTPException(status_code=409, detail="Already enrolled in this course")


@router.delete("/{course_id}/enroll/{user_id}")
def unenroll_from_course(
    course_id: int,
    user_id: int,
    service: CourseService = Depends(get_course_service)
):
    """Unenroll from a course"""
    try:
        service.unenroll_user(course_id, user_id)
        return {"message": "Unenrolled"}
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")


@router.get("/{course_id}/progress/{user_id}", response_model=UserCourseProgress)
def get_user_course_progress(
    course_id: int,
    user_id: int,
    service: CourseService = Depends(get_course_service)
):
    """Get user's progress in a course"""
    try:
        return service.get_user_course_progress(course_id, user_id)
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")


# ========== Lesson Management ==========

@router.post("/{course_id}/lessons", response_model=LessonResponse)
def create_lesson(
    course_id: int,
    lesson: LessonCreate,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Create a new lesson"""
    try:
        return service.create_lesson(course_id, lesson, user_id)
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")


@router.get("/{course_id}/lessons", response_model=LessonListResponse)
def list_lessons(
    course_id: int,
    service: CourseService = Depends(get_course_service)
):
    """List lessons for a course"""
    try:
        return service.list_lessons(course_id)
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    lesson_id: int,
    user_id: Optional[int] = None,
    service: CourseService = Depends(get_course_service)
):
    """Get lesson details"""
    try:
        return service.get_lesson(lesson_id, user_id)
    except LessonNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    lesson_id: int,
    updates: LessonUpdate,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Update a lesson"""
    try:
        return service.update_lesson(lesson_id, updates, user_id)
    except LessonNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Delete a lesson"""
    try:
        service.delete_lesson(lesson_id, user_id)
        return {"message": "Lesson deleted"}
    except LessonNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


@router.post("/{course_id}/lessons/reorder")
def reorder_lessons(
    course_id: int,
    lesson_ids: List[int],
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Reorder lessons in a course"""
    try:
        service.reorder_lessons(course_id, lesson_ids, user_id)
        return {"message": "Lessons reordered"}
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")


# ========== Lesson Progress ==========

@router.post("/lessons/{lesson_id}/start", response_model=UserLessonProgress)
def start_lesson(
    lesson_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Mark lesson as started"""
    try:
        return service.start_lesson(lesson_id, user_id)
    except LessonNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


@router.post("/lessons/{lesson_id}/complete", response_model=UserLessonProgress)
def complete_lesson(
    lesson_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Mark lesson as completed"""
    try:
        return service.complete_lesson(lesson_id, user_id)
    except LessonNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


@router.get("/lessons/{lesson_id}/progress/{user_id}", response_model=UserLessonProgress)
def get_user_lesson_progress(
    lesson_id: int,
    user_id: int,
    service: CourseService = Depends(get_course_service)
):
    """Get user's progress for a lesson"""
    try:
        return service.get_user_lesson_progress(lesson_id, user_id)
    except LessonNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


# ========== Flashcards ==========

@router.get("/lessons/{lesson_id}/flashcards", response_model=List[LessonFlashcard])
def get_lesson_flashcards(
    lesson_id: int,
    service: CourseService = Depends(get_course_service)
):
    """Get flashcards for a lesson"""
    try:
        return service.get_lesson_flashcards(lesson_id)
    except LessonNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


@router.post("/lessons/{lesson_id}/flashcards", response_model=List[LessonFlashcard])
def create_lesson_flashcards(
    lesson_id: int,
    flashcards: List[dict],
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Create custom flashcards for a lesson"""
    try:
        return service.create_lesson_flashcards(lesson_id, flashcards, user_id)
    except LessonNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


@router.post("/lessons/{lesson_id}/flashcards/queue")
def add_flashcards_to_queue(
    lesson_id: int,
    request: dict,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Add flashcards to user's queue"""
    try:
        service.add_flashcards_to_queue(lesson_id, user_id, request)
        return {"message": "Flashcards added to queue"}
    except LessonNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


@router.patch("/lessons/{lesson_id}/flashcard-requirement")
def update_flashcard_requirement(
    lesson_id: int,
    required_count: int,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service)
):
    """Update lesson flashcard requirement count"""
    try:
        service.update_flashcard_requirement(lesson_id, required_count, user_id)
        return {"message": "Flashcard requirement updated"}
    except LessonNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


# ========== Tags ==========

@router.get("/tags", response_model=List[str])
def list_course_tags(
    service: CourseService = Depends(get_course_service)
):
    """List all available course tags"""
    return service.list_tags()