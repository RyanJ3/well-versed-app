# backend/api/auth_routes.py
from fastapi import APIRouter, HTTPException, status, Depends, Response, Cookie, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import logging
import os
from datetime import datetime, timedelta

from infrastructure.auth.cognito_service import get_cognito_service
from infrastructure.audit_logger import get_audit_logger, AuditEventType
from infrastructure.token_blacklist import get_token_blacklist
from middleware.auth_middleware import require_auth, UserInfo
from middleware.rate_limit import get_rate_limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

class LoginRequest(BaseModel):
    username: str  # Can be email or username
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    id_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "Bearer"

class UserResponse(BaseModel):
    user_id: str
    email: str
    email_verified: bool
    username: str
    groups: Optional[list] = []

@router.post("/login", response_model=AuthResponse)
async def login(
    login_request: LoginRequest, 
    response: Response,
    request: Request
) -> AuthResponse:
    """
    Authenticate user and return tokens with rate limiting
    
    Args:
        login_request: Login credentials
        response: FastAPI response object for setting cookies
        request: FastAPI request object for rate limiting
        
    Returns:
        Authentication tokens
    """
    rate_limiter = get_rate_limiter()
    cognito_service = get_cognito_service()
    audit_logger = get_audit_logger()
    
    # Get request metadata for audit logging
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent", "unknown")
    
    # Check rate limits before attempting login
    rate_limit_info = await rate_limiter.check_login_attempt(request, login_request.username)
    
    try:
        auth_response = cognito_service.initiate_auth(
            username=login_request.username,
            password=login_request.password
        )
        
        auth_result = auth_response.get('AuthenticationResult', {})
        
        refresh_token = auth_result.get('RefreshToken', '')
        expires_in = auth_result.get('ExpiresIn', 3600)
        
        # Set tokens as httpOnly cookies for maximum security
        access_token = auth_result.get('AccessToken', '')
        id_token = auth_result.get('IdToken', '')
        
        # Set access token as httpOnly cookie
        if access_token:
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,  # Prevent JavaScript access
                secure=os.getenv("ENVIRONMENT") != "local",  # HTTPS only in non-local
                samesite="strict",  # CSRF protection
                max_age=expires_in,  # Match token expiration
                path="/",  # Available for all API calls
            )
        
        # Set ID token as httpOnly cookie (for user info)
        if id_token:
            response.set_cookie(
                key="id_token",
                value=id_token,
                httponly=True,
                secure=os.getenv("ENVIRONMENT") != "local",
                samesite="strict",
                max_age=expires_in,
                path="/",
            )
        
        # Set refresh token as httpOnly cookie
        if refresh_token:
            # Calculate cookie expiration (30 days for refresh token)
            cookie_max_age = 30 * 24 * 60 * 60  # 30 days in seconds
            
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,  # Prevent JavaScript access
                secure=os.getenv("ENVIRONMENT") != "local",  # HTTPS only in non-local
                samesite="strict",  # CSRF protection
                max_age=cookie_max_age,
                path="/api/auth",  # Limit cookie to auth endpoints
            )
        
        # Record successful login
        await rate_limiter.record_successful_login(request, login_request.username)
        
        # Audit successful login
        audit_logger.log_event(
            event_type=AuditEventType.LOGIN_SUCCESS,
            username=login_request.username,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )
        
        # Return minimal response (tokens are in secure cookies)
        # Still return some info for backward compatibility, but encourage cookie usage
        return AuthResponse(
            access_token="",  # Empty - use cookie instead
            id_token="",  # Empty - use cookie instead
            refresh_token="",  # Empty - use cookie instead
            expires_in=expires_in,
            token_type="Bearer"
        )
        
    except Exception as e:
        logger.error(f"Login failed for {login_request.username}: {e}")
        
        # Record failed login attempt
        await rate_limiter.record_failed_login(request, login_request.username)
        
        # Get updated attempts remaining
        try:
            updated_info = await rate_limiter.check_login_attempt(request, login_request.username)
            attempts_remaining = updated_info.get("attempts_remaining", 0)
        except HTTPException:
            # Account is now locked
            attempts_remaining = 0
        
        # Audit failed login
        audit_logger.log_event(
            event_type=AuditEventType.LOGIN_FAILED,
            username=login_request.username,
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
            error_message=str(e),
            details={"attempts_remaining": attempts_remaining}
        )
        
        # Include attempts remaining in error message
        error_detail = "Invalid credentials"
        if attempts_remaining > 0:
            error_detail = f"Invalid credentials. {attempts_remaining} attempt{'s' if attempts_remaining != 1 else ''} remaining."
        elif attempts_remaining == 0:
            error_detail = "Invalid credentials. Account locked due to too many failed attempts."
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_detail,
            headers={"X-RateLimit-Remaining": str(attempts_remaining)}
        )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    response: Response,
    req: Request,
    request: Optional[RefreshRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token")
) -> AuthResponse:
    """
    Refresh access token using refresh token from cookie or request body
    Implements token rotation for enhanced security
    
    Args:
        response: FastAPI response object for setting cookies
        req: FastAPI request object for blacklisting old tokens
        request: Optional refresh token in request body (for backward compatibility)
        refresh_token_cookie: Refresh token from httpOnly cookie
        
    Returns:
        New authentication tokens
    """
    cognito_service = get_cognito_service()
    token_blacklist = get_token_blacklist()
    
    # Prefer cookie over request body
    refresh_token = refresh_token_cookie or (request.refresh_token if request else None)
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )
    
    try:
        # Blacklist the old access token if present (token rotation)
        old_access_token = req.cookies.get("access_token")
        if old_access_token:
            token_blacklist.blacklist_token(old_access_token, "access")
        
        auth_response = cognito_service.refresh_token(refresh_token)
        
        auth_result = auth_response.get('AuthenticationResult', {})
        
        # Get new tokens
        new_access_token = auth_result.get('AccessToken', '')
        new_id_token = auth_result.get('IdToken', '')
        new_refresh_token = auth_result.get('RefreshToken')
        expires_in = auth_result.get('ExpiresIn', 3600)
        
        # Update access token cookie
        if new_access_token:
            response.set_cookie(
                key="access_token",
                value=new_access_token,
                httponly=True,
                secure=os.getenv("ENVIRONMENT") != "local",
                samesite="strict",
                max_age=expires_in,
                path="/",
            )
        
        # Update ID token cookie
        if new_id_token:
            response.set_cookie(
                key="id_token",
                value=new_id_token,
                httponly=True,
                secure=os.getenv("ENVIRONMENT") != "local",
                samesite="strict",
                max_age=expires_in,
                path="/",
            )
        
        # If a new refresh token is provided, update the cookie (token rotation)
        if new_refresh_token:
            # Blacklist the old refresh token
            token_blacklist.blacklist_token(refresh_token, "refresh")
            
            cookie_max_age = 30 * 24 * 60 * 60  # 30 days
            response.set_cookie(
                key="refresh_token",
                value=new_refresh_token,
                httponly=True,
                secure=os.getenv("ENVIRONMENT") != "local",
                samesite="strict",
                max_age=cookie_max_age,
                path="/api/auth",
            )
        
        return AuthResponse(
            access_token="",  # Empty - use cookie instead
            id_token="",  # Empty - use cookie instead
            refresh_token="",  # Empty - use cookie instead
            expires_in=expires_in,
            token_type="Bearer"
        )
        
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user(user: UserInfo = Depends(require_auth())) -> UserResponse:
    """
    Get current authenticated user information
    
    Args:
        user: Authenticated user from middleware
        
    Returns:
        User information
    """
    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        email_verified=user.email_verified,
        username=user.username,
        groups=user.groups or []
    )

@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
    user: UserInfo = Depends(require_auth())
) -> Dict[str, str]:
    """
    Logout user - clears all httpOnly cookies and blacklists tokens
    
    Args:
        response: FastAPI response object for clearing cookies
        user: Authenticated user
        
    Returns:
        Logout confirmation
    """
    token_blacklist = get_token_blacklist()
    
    # Clear all authentication cookies
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=os.getenv("ENVIRONMENT") != "local",
        samesite="strict"
    )
    
    response.delete_cookie(
        key="id_token",
        path="/",
        secure=os.getenv("ENVIRONMENT") != "local",
        samesite="strict"
    )
    
    response.delete_cookie(
        key="refresh_token",
        path="/api/auth",
        secure=os.getenv("ENVIRONMENT") != "local",
        samesite="strict"
    )
    
    # Blacklist tokens from both header and cookies
    # Try header first (backward compatibility)
    authorization = request.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        access_token = authorization.replace("Bearer ", "")
        token_blacklist.blacklist_token(access_token, "access")
    
    # Also blacklist tokens from cookies
    access_token_cookie = request.cookies.get("access_token")
    if access_token_cookie:
        token_blacklist.blacklist_token(access_token_cookie, "access")
    
    id_token_cookie = request.cookies.get("id_token")
    if id_token_cookie:
        token_blacklist.blacklist_token(id_token_cookie, "id")
    
    refresh_token_cookie = request.cookies.get("refresh_token")
    if refresh_token_cookie:
        token_blacklist.blacklist_token(refresh_token_cookie, "refresh")
    
    # Audit logout event
    audit_logger = get_audit_logger()
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent", "unknown")
    
    audit_logger.log_event(
        event_type=AuditEventType.LOGOUT,
        user_id=user.user_id,
        username=user.username,
        ip_address=ip_address,
        user_agent=user_agent,
        success=True
    )
    
    logger.info(f"User {user.username} logged out")
    
    return {"message": "Successfully logged out"}

@router.get("/health")
async def auth_health_check() -> Dict[str, Any]:
    """
    Check authentication service health
    
    Returns:
        Health status of auth service
    """
    cognito_service = get_cognito_service()
    config = cognito_service.config
    
    return {
        "status": "healthy",
        "environment": config.region,
        "user_pool_configured": bool(config.user_pool_id),
        "client_configured": bool(config.client_id)
    }