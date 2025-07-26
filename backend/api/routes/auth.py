"""Authentication routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from pydantic import BaseModel, EmailStr

from domain.users import UserService, UserLogin, UserCreate
from domain.auth import AuthProvider
from infrastructure.auth import LocalJWTProvider
from core.dependencies import get_user_service
from core.auth_dependencies import get_auth_provider
from config import Config

router = APIRouter(prefix="/auth", tags=["authentication"])

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    user_service: Annotated[UserService, Depends(get_user_service)],
    auth_provider: Annotated[AuthProvider, Depends(get_auth_provider)]
):
    """Authenticate user and return tokens"""
    try:
        user = user_service.authenticate_user(credentials)
        access_token = await auth_provider.create_token(
            user_id=user.user_id,
            email=user.email,
            roles=["user"]
        )
        refresh_token = ""
        if isinstance(auth_provider, LocalJWTProvider):
            refresh_token = await auth_provider.create_refresh_token(
                user_id=user.user_id,
                email=user.email,
                roles=["user"]
            )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=Config.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserCreate,
    user_service: Annotated[UserService, Depends(get_user_service)],
    auth_provider: Annotated[AuthProvider, Depends(get_auth_provider)]
):
    """Register new user and return tokens"""
    try:
        user = user_service.create_user(user_data)
        access_token = await auth_provider.create_token(
            user_id=user.user_id,
            email=user.email,
            roles=["user"]
        )
        refresh_token = ""
        if isinstance(auth_provider, LocalJWTProvider):
            refresh_token = await auth_provider.create_refresh_token(
                user_id=user.user_id,
                email=user.email,
                roles=["user"]
            )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=Config.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    auth_provider: Annotated[AuthProvider, Depends(get_auth_provider)]
):
    """Refresh access token"""
    new_token = await auth_provider.refresh_token(request.refresh_token)
    if not new_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    return TokenResponse(
        access_token=new_token,
        refresh_token=request.refresh_token,
        expires_in=Config.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
