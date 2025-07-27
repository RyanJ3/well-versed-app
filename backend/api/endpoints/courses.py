from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from core.dependencies import get_course_service
from domain.courses import (
    CourseService,
    CourseCreate,
    CourseResponse,
    CourseEnrollment,
    CourseNotFoundError,
    AlreadyEnrolledError,
)

router = APIRouter(tags=["courses"])

# Temporary - will implement proper auth later
def get_current_user_id() -> int:
    return 1


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    data: CourseCreate,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service),
):
    """Create a new course"""
    return service.create_course(data, user_id)


@router.get("/public", response_model=List[CourseResponse])
def list_public_courses(
    skip: int = 0,
    limit: int = 20,
    service: CourseService = Depends(get_course_service),
):
    """List all public courses"""
    return service.list_public_courses(skip, limit)


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    service: CourseService = Depends(get_course_service),
):
    """Get course details"""
    try:
        return service.get_course(course_id)
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")


@router.post("/{course_id}/enroll", response_model=CourseEnrollment)
def enroll_in_course(
    course_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service),
):
    """Enroll in a course"""
    try:
        return service.enroll_user(course_id, user_id)
    except CourseNotFoundError:
        raise HTTPException(status_code=404, detail="Course not found")
    except AlreadyEnrolledError:
        raise HTTPException(status_code=409, detail="Already enrolled in this course")
