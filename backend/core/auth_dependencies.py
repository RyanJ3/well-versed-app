"""Authentication dependencies for FastAPI"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Annotated
from functools import lru_cache
import logging

from domain.auth import AuthProvider, UserContext
from domain.auth.exceptions import AuthenticationError, TokenExpiredError
from infrastructure.auth import LocalJWTProvider
from config import Config

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)

@lru_cache()
def get_auth_provider() -> AuthProvider:
    """Get the configured authentication provider"""
    if Config.AUTH_PROVIDER == "cognito":
        raise NotImplementedError("Cognito provider not yet implemented")
    else:
        return LocalJWTProvider(
            secret_key=Config.JWT_SECRET,
            access_token_expire_minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES
        )

async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    auth_provider: Annotated[AuthProvider, Depends(get_auth_provider)]
) -> UserContext:
    """Extract and verify user from bearer token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        token_data = await auth_provider.verify_token(credentials.credentials)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return UserContext(
            user_id=token_data.user_id,
            email=token_data.email,
            roles=token_data.roles,
            is_authenticated=True
        )
    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_id(
    current_user: Annotated[UserContext, Depends(get_current_user)]
) -> int:
    """Get just the user ID for backward compatibility"""
    return current_user.user_id

async def get_optional_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    auth_provider: Annotated[AuthProvider, Depends(get_auth_provider)]
) -> Optional[UserContext]:
    """Get user if authenticated, None otherwise"""
    if not credentials:
        return None

    try:
        token_data = await auth_provider.verify_token(credentials.credentials)
        if token_data:
            return UserContext(
                user_id=token_data.user_id,
                email=token_data.email,
                roles=token_data.roles,
                is_authenticated=True
            )
    except Exception as e:
        logger.debug(f"Optional auth failed: {e}")

    return None

# Role-based auth

def require_roles(*required_roles: str):
    """Dependency to require specific roles"""
    async def role_checker(
        current_user: Annotated[UserContext, Depends(get_current_user)]
    ) -> UserContext:
        if not current_user.has_any_role(list(required_roles)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(required_roles)}"
            )
        return current_user
    return role_checker
