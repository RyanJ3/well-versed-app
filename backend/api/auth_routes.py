"""
Authentication Routes
=====================
Handles all authentication endpoints including login, logout, token refresh,
and user information retrieval.

Uses AuthFactory to automatically select the appropriate auth provider:
- LocalAuth: For development/testing (accepts any credentials)
- CognitoAuth: For production (validates against AWS Cognito)
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import logging

from infrastructure.auth.core import AuthInterface
from infrastructure.auth.core.factory import AuthFactory

logger = logging.getLogger(__name__)

# Create the router
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Security scheme for JWT bearer tokens
security = HTTPBearer(auto_error=False)


# Request/Response Models
class LoginRequest(BaseModel):
    """Login request with username (email) and password"""
    username: EmailStr  # Using 'username' for compatibility, but it's an email
    password: str


class RegisterRequest(BaseModel):
    """Registration request with username (email), password, first and last name"""
    username: EmailStr
    password: str
    firstName: str  # Required field
    lastName: str  # Required field


class LoginResponse(BaseModel):
    """Response after successful login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours in seconds


class UserInfo(BaseModel):
    """User information returned from /me endpoint"""
    user_id: str
    email: str
    name: Optional[str] = None


# Helper Functions
def get_auth_provider() -> AuthInterface:
    """Get the configured authentication provider."""
    return AuthFactory.get_auth_provider()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth: AuthInterface = Depends(get_auth_provider)
) -> Optional[Dict[str, Any]]:
    """
    Validate the JWT token and return user information.
    
    This is used as a dependency for protected routes.
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    user_data = auth.verify_token(token)
    return user_data


# Routes
@router.get("/health")
async def auth_health_check(auth: AuthInterface = Depends(get_auth_provider)):
    """
    Health check endpoint for authentication service.
    
    Returns the current auth configuration status.
    """
    import os
    auth_type = type(auth).__name__
    
    return {
        "status": "healthy",
        "auth_provider": auth_type,
        "environment": os.environ.get("ENVIRONMENT", "local"),
        "auth_mode": "local" if "Local" in auth_type else "cognito"
    }


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest, 
    response: Response,
    auth: AuthInterface = Depends(get_auth_provider)
):
    """
    Authenticate user and return JWT tokens.
    
    Automatically uses the appropriate auth provider based on environment.
    """
    logger.info(f"Login attempt for user: {request.username}")
    
    # Authenticate user
    user_data = auth.authenticate(request.username, request.password)
    
    if not user_data:
        logger.warning(f"Failed login attempt for user: {request.username}")
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    
    # Handle errors and challenges
    if "error" in user_data:
        # Handle specific auth errors (unconfirmed, password reset required, etc.)
        raise HTTPException(
            status_code=403,
            detail={
                "error": user_data["error"],
                "code": user_data.get("code"),
                "message": user_data.get("message", user_data["error"])
            }
        )
    
    # Handle MFA or other challenges (Cognito specific)
    if "challenge" in user_data:
        raise HTTPException(
            status_code=403,
            detail={
                "challenge": user_data["challenge"],
                "session": user_data.get("session"),
                "message": "Additional authentication required"
            }
        )
    
    # Create tokens
    tokens = auth.create_tokens(user_data)
    
    logger.info(f"Successful login for user: {request.username}")
    
    return LoginResponse(**tokens)


@router.post("/logout")
async def logout(
    user: Dict[str, Any] = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    auth: AuthInterface = Depends(get_auth_provider)
):
    """
    Logout the current user.
    
    Invalidates tokens based on the auth provider's implementation.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Logout user (provider-specific implementation)
    if credentials:
        auth.logout(credentials.credentials)
    
    logger.info(f"User logged out: {user.get('email', 'unknown')}")
    
    return {"message": "Successfully logged out"}


@router.post("/refresh")
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth: AuthInterface = Depends(get_auth_provider)
):
    """
    Refresh an access token using a refresh token.
    
    This endpoint allows clients to get a new access token without
    re-authenticating with username/password.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Refresh token required")
    
    token = credentials.credentials
    
    # Refresh the token
    result = auth.refresh_token(token)
    
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    return result


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get information about the currently authenticated user.
    
    This is a protected endpoint that requires a valid JWT token.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return UserInfo(
        user_id=user.get("sub", user.get("user_id", "")),
        email=user.get("email", ""),
        name=user.get("name", "")
    )


@router.post("/register")
async def register(
    request: RegisterRequest,
    auth: AuthInterface = Depends(get_auth_provider)
):
    """
    Register a new user.
    
    Uses the appropriate auth provider to create a new user account.
    For local development, creates user in memory (lost on restart).
    """
    # Combine first and last name for the auth provider
    full_name = f"{request.firstName} {request.lastName}"
    
    # Pass name as a keyword argument (required)
    result = auth.register(
        request.username, 
        request.password, 
        name=full_name,
        firstName=request.firstName,
        lastName=request.lastName
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Registration failed")
        )
    
    logger.info(f"User registered: {request.username}")
    
    # Return user info and success message
    return {
        "success": True,
        "user": result.get("user"),
        "message": result.get("message", "Registration successful")
    }