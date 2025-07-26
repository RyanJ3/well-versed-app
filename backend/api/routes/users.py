"""Users API routes - thin HTTP layer"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from domain.users import (
    UserService,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    UserStats,
    UserNotFoundError,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
)
from domain.core.exceptions import ValidationError
from core.dependencies import get_user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, service: UserService = Depends(get_user_service)):
    """Create a new user"""
    try:
        return service.create_user(user_data)
    except EmailAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)


@router.post("/login", response_model=UserResponse)
def login(credentials: UserLogin, service: UserService = Depends(get_user_service)):
    """Authenticate user"""
    try:
        return service.authenticate_user(credentials)
    except InvalidCredentialsError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")


@router.get("/me", response_model=UserResponse)
def get_current_user(
    user_id: int = 1,  # Placeholder - implement auth later
    service: UserService = Depends(get_user_service),
):
    """Get current user"""
    try:
        return service.get_user(user_id)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


@router.get("/me/stats", response_model=UserStats)
def get_current_user_stats(
    user_id: int = 1,  # Placeholder - implement auth later
    service: UserService = Depends(get_user_service),
):
    """Get current user statistics"""
    try:
        return service.get_user_stats(user_id)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, service: UserService = Depends(get_user_service)):
    """Get user by ID"""
    try:
        return service.get_user(user_id)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {user_id} not found")


@router.get("/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, service: UserService = Depends(get_user_service)):
    """Get list of users"""
    return service.get_users(skip=skip, limit=limit)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, update_data: UserUpdate, service: UserService = Depends(get_user_service)):
    """Update user"""
    try:
        return service.update_user(user_id, update_data)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {user_id} not found")
    except EmailAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/{user_id}")
def delete_user(user_id: int, service: UserService = Depends(get_user_service)):
    """Delete user"""
    try:
        return service.delete_user(user_id)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {user_id} not found")
