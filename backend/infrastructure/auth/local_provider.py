"""Local JWT authentication provider"""

import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import logging
from domain.auth import AuthProvider, TokenData
from domain.auth.exceptions import TokenExpiredError, InvalidTokenError

logger = logging.getLogger(__name__)

class LocalJWTProvider(AuthProvider):
    """Local JWT implementation that mimics Cognito's token structure"""

    def __init__(self, secret_key: str, algorithm: str = "HS256", 
                 access_token_expire_minutes: int = 60,
                 refresh_token_expire_days: int = 30):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = access_token_expire_minutes
        self.refresh_token_expire_days = refresh_token_expire_days

    async def verify_token(self, token: str) -> Optional[TokenData]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm]
            )

            # Check expiration
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(tz=timezone.utc):
                raise TokenExpiredError()

            # Extract data mimicking Cognito structure
            return TokenData(
                user_id=payload.get("custom:user_id"),
                email=payload.get("email"),
                roles=payload.get("cognito:groups", []),
                exp=datetime.fromtimestamp(exp, tz=timezone.utc) if exp else None
            )
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError()
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            raise InvalidTokenError()
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None

    async def create_token(self, user_id: int, email: str, roles: List[str] | None = None) -> str:
        """Create a new JWT token"""
        if roles is None:
            roles = ["user"]

        now = datetime.now(tz=timezone.utc)
        expire = now + timedelta(minutes=self.access_token_expire_minutes)

        payload = {
            "custom:user_id": user_id,
            "email": email,
            "cognito:groups": roles,
            "iat": now,
            "exp": expire,
            "token_type": "access"
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    async def refresh_token(self, refresh_token: str) -> Optional[str]:
        """Create a new access token from a refresh token"""
        try:
            payload = jwt.decode(
                refresh_token,
                self.secret_key,
                algorithms=[self.algorithm]
            )

            # Verify it's a refresh token
            if payload.get("token_type") != "refresh":
                return None

            # Create new access token
            return await self.create_token(
                user_id=payload.get("custom:user_id"),
                email=payload.get("email"),
                roles=payload.get("cognito:groups", [])
            )
        except Exception as e:
            logger.error(f"Refresh token error: {e}")
            return None

    async def create_refresh_token(self, user_id: int, email: str, roles: List[str] | None = None) -> str:
        """Create a refresh token (local testing only)"""
        if roles is None:
            roles = ["user"]

        now = datetime.now(tz=timezone.utc)
        expire = now + timedelta(days=self.refresh_token_expire_days)

        payload = {
            "custom:user_id": user_id,
            "email": email,
            "cognito:groups": roles,
            "iat": now,
            "exp": expire,
            "token_type": "refresh"
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
