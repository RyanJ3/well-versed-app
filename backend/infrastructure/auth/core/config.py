"""
Authentication Configuration
=============================
Central configuration for authentication system.
"""

from enum import Enum
from datetime import timedelta
from dataclasses import dataclass


class Environment(Enum):
    """Application environments."""
    LOCAL = "local"
    DEVELOPMENT = "development"
    TEST = "test"
    STAGING = "staging"
    PRODUCTION = "production"
    
    @classmethod
    def from_string(cls, value: str) -> "Environment":
        """Convert string to Environment enum."""
        value = value.lower().strip()
        for env in cls:
            if env.value == value:
                return env
        # Default to local for unknown values
        return cls.LOCAL
    
    @property
    def is_production(self) -> bool:
        """Check if this is a production environment."""
        return self in [Environment.PRODUCTION, Environment.STAGING]
    
    @property
    def is_local(self) -> bool:
        """Check if this is a local/dev environment."""
        return self in [Environment.LOCAL, Environment.DEVELOPMENT, Environment.TEST]


class EnvVars(Enum):
    """Environment variable names."""
    # Core
    ENVIRONMENT = "ENVIRONMENT"
    AUTH_MODE = "AUTH_MODE"
    
    # Local Auth
    LOCAL_JWT_SECRET = "LOCAL_JWT_SECRET"
    LOCAL_USER_PERSIST = "LOCAL_USER_PERSIST"
    LOCAL_TEST_MODE = "LOCAL_TEST_MODE"
    LOCAL_AUTH_AUTO_CREATE = "LOCAL_AUTH_AUTO_CREATE"
    LOCAL_AUTH_ANY_PASSWORD = "LOCAL_AUTH_ANY_PASSWORD"
    LOCAL_TEST_USERS = "LOCAL_TEST_USERS"
    LOCAL_TEST_PASSWORD = "LOCAL_TEST_PASSWORD"
    LOCAL_PASSWORD_SALT = "LOCAL_PASSWORD_SALT"
    LOCAL_USER_STORE_PATH = "LOCAL_USER_STORE_PATH"
    
    # AWS Cognito
    AWS_REGION = "AWS_REGION"
    COGNITO_USER_POOL_ID = "COGNITO_USER_POOL_ID"
    COGNITO_CLIENT_ID = "COGNITO_CLIENT_ID"
    COGNITO_CLIENT_SECRET = "COGNITO_CLIENT_SECRET"


class AuthMode(Enum):
    """Authentication modes."""
    LOCAL = "local"
    COGNITO = "cognito"
    
    @classmethod
    def from_string(cls, value: str) -> "AuthMode":
        """Convert string to AuthMode enum."""
        value = value.lower().strip()
        for mode in cls:
            if mode.value == value:
                return mode
        return cls.LOCAL


@dataclass
class TokenConfig:
    """Token expiration configuration."""
    access_token_expiry: timedelta = timedelta(hours=1)
    refresh_token_expiry: timedelta = timedelta(days=7)
    
    @classmethod
    def for_environment(cls, env: Environment) -> "TokenConfig":
        """Get token config based on environment."""
        if env.is_local:
            # Longer expiry for development
            return cls(
                access_token_expiry=timedelta(hours=24),
                refresh_token_expiry=timedelta(days=30)
            )
        else:
            # Production settings
            return cls(
                access_token_expiry=timedelta(hours=1),
                refresh_token_expiry=timedelta(days=7)
            )