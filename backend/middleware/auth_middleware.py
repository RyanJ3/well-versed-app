# backend/middleware/auth_middleware.py
from typing import Optional, Callable, List
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from infrastructure.auth.cognito_service import get_cognito_service, UserInfo
from infrastructure.token_blacklist import get_token_blacklist

logger = logging.getLogger(__name__)

class CognitoAuthMiddleware(HTTPBearer):
    """FastAPI authentication middleware using AWS Cognito"""
    
    def __init__(self, auto_error: bool = True, required_groups: Optional[List[str]] = None):
        super().__init__(auto_error=auto_error)
        self.cognito_service = get_cognito_service()
        self.token_blacklist = get_token_blacklist()
        self.required_groups = required_groups or []
    
    async def __call__(self, request: Request) -> Optional[UserInfo]:
        """
        Validate JWT token from Authorization header or cookie
        
        Args:
            request: FastAPI request object
            
        Returns:
            UserInfo if authentication successful
            
        Raises:
            HTTPException: If authentication fails
        """
        token = None
        
        # First try to get token from Authorization header (for backward compatibility)
        try:
            credentials: HTTPAuthorizationCredentials = await super().__call__(request)
            if credentials:
                token = credentials.credentials
        except HTTPException:
            # Header auth failed, try cookies
            pass
        
        # If no token in header, try to get from cookie
        if not token:
            token = request.cookies.get("access_token")
        
        if not token:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No authentication token provided",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return None
        
        # Check if token is blacklisted
        if self.token_blacklist.is_blacklisted(token, "access"):
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return None
        
        # Verify token with Cognito
        user_info = await self.cognito_service.verify_token(token)
        
        if not user_info:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return None
        
        # Check required groups if specified
        if self.required_groups:
            user_groups = user_info.groups or []
            if not any(group in user_groups for group in self.required_groups):
                if self.auto_error:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Insufficient permissions",
                    )
                return None
        
        # Attach user info to request state for use in route handlers
        request.state.user = user_info
        
        return user_info


class OptionalAuthMiddleware(CognitoAuthMiddleware):
    """Optional authentication - doesn't fail if token is missing"""
    
    def __init__(self):
        super().__init__(auto_error=False)
    
    async def __call__(self, request: Request) -> Optional[UserInfo]:
        """
        Try to authenticate but don't fail if no token
        
        Args:
            request: FastAPI request object
            
        Returns:
            UserInfo if authenticated, None otherwise
        """
        try:
            # Try to get authorization header
            authorization = request.headers.get("Authorization")
            if not authorization or not authorization.startswith("Bearer "):
                request.state.user = None
                return None
            
            # Verify token
            token = authorization.replace("Bearer ", "")
            user_info = await self.cognito_service.verify_token(token)
            
            # Attach user info to request state
            request.state.user = user_info
            return user_info
            
        except Exception as e:
            logger.debug(f"Optional auth failed: {e}")
            request.state.user = None
            return None


# Dependency injection functions for FastAPI routes
def require_auth() -> CognitoAuthMiddleware:
    """Require authentication for a route"""
    return CognitoAuthMiddleware()

def optional_auth() -> OptionalAuthMiddleware:
    """Optional authentication for a route"""
    return OptionalAuthMiddleware()

def require_groups(*groups: str) -> CognitoAuthMiddleware:
    """Require specific groups for a route"""
    return CognitoAuthMiddleware(required_groups=list(groups))

def require_admin() -> CognitoAuthMiddleware:
    """Require admin group for a route"""
    return CognitoAuthMiddleware(required_groups=["admin"])


# Utility function to get current user from request
def get_current_user(request: Request) -> Optional[UserInfo]:
    """
    Get current authenticated user from request
    
    Args:
        request: FastAPI request object
        
    Returns:
        UserInfo if user is authenticated, None otherwise
    """
    return getattr(request.state, 'user', None)