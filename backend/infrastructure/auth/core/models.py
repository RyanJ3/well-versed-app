"""
Shared Models and Enums
=======================
Common data structures used by both local and Cognito auth implementations.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from datetime import datetime


class UserStatus(Enum):
    """Cognito-like user status values."""
    UNCONFIRMED = "UNCONFIRMED"
    CONFIRMED = "CONFIRMED"
    ARCHIVED = "ARCHIVED"
    COMPROMISED = "COMPROMISED"
    UNKNOWN = "UNKNOWN"
    RESET_REQUIRED = "RESET_REQUIRED"
    FORCE_CHANGE_PASSWORD = "FORCE_CHANGE_PASSWORD"


class TokenType(Enum):
    """JWT token types."""
    ACCESS = "access"
    REFRESH = "refresh"
    ID = "id"


@dataclass
class User:
    """User data structure."""
    user_id: str
    email: str
    username: str
    created_at: datetime  # Required
    updated_at: datetime  # Required
    name: Optional[str] = None
    status: str = UserStatus.CONFIRMED.value
    email_verified: bool = False
    attributes: Dict[str, Any] = None
    groups: List[str] = None
    enabled: bool = True
    
    def __post_init__(self):
        if self.attributes is None:
            self.attributes = {}
        if self.groups is None:
            self.groups = []
        # Ensure datetime fields are datetime objects
        if isinstance(self.created_at, str):
            self.created_at = datetime.fromisoformat(self.created_at)
        if isinstance(self.updated_at, str):
            self.updated_at = datetime.fromisoformat(self.updated_at)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "user_id": self.user_id,
            "email": self.email,
            "username": self.username,
            "name": self.name,
            "status": self.status,
            "email_verified": self.email_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "attributes": self.attributes,
            "groups": self.groups,
            "enabled": self.enabled
        }


@dataclass
class AuthChallenge:
    """Authentication challenge response."""
    challenge_name: str
    session: Optional[str] = None
    parameters: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.parameters is None:
            self.parameters = {}


@dataclass
class TokenResponse:
    """Token response structure."""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None