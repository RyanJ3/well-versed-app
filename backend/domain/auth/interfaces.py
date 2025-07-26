"""Authentication interfaces"""

from abc import ABC, abstractmethod
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class TokenData(BaseModel):
    """Decoded token data"""
    user_id: int
    email: str
    roles: List[str] = []
    exp: Optional[datetime] = None

class UserContext(BaseModel):
    """Extended user context for requests"""
    user_id: int
    email: str
    roles: List[str] = []
    is_authenticated: bool = True

    def has_role(self, role: str) -> bool:
        return role in self.roles

    def has_any_role(self, roles: List[str]) -> bool:
        return any(role in self.roles for role in roles)

class AuthProvider(ABC):
    """Abstract authentication provider"""

    @abstractmethod
    async def verify_token(self, token: str) -> Optional[TokenData]:
        """Verify and decode a token"""
        raise NotImplementedError

    @abstractmethod
    async def create_token(self, user_id: int, email: str, roles: List[str] | None = None) -> str:
        """Create a new token (for local provider only)"""
        raise NotImplementedError

    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> Optional[str]:
        """Refresh an access token"""
        raise NotImplementedError
