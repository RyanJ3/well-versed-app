# backend/infrastructure/auth/cognito_config.py
import os
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

class Environment(Enum):
    LOCAL = "local"
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

@dataclass
class CognitoConfig:
    """Cognito configuration for different environments"""
    region: str
    user_pool_id: str
    client_id: str
    client_secret: Optional[str] = None
    domain: Optional[str] = None
    redirect_uri: Optional[str] = None
    jwks_uri: Optional[str] = None
    issuer: Optional[str] = None
    
    @property
    def jwks_url(self) -> str:
        """Get JWKS URL for token verification"""
        if self.jwks_uri:
            return self.jwks_uri
        return f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}/.well-known/jwks.json"
    
    @property
    def issuer_url(self) -> str:
        """Get issuer URL for token validation"""
        if self.issuer:
            return self.issuer
        return f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}"

class CognitoConfigFactory:
    """Factory for creating environment-specific Cognito configurations"""
    
    @staticmethod
    def create(env: Optional[str] = None) -> CognitoConfig:
        """Create Cognito config based on environment"""
        environment = env or os.getenv("ENVIRONMENT", "local")
        
        if environment == Environment.LOCAL.value:
            return CognitoConfigFactory._create_local_config()
        elif environment == Environment.DEVELOPMENT.value:
            return CognitoConfigFactory._create_dev_config()
        elif environment == Environment.STAGING.value:
            return CognitoConfigFactory._create_staging_config()
        elif environment == Environment.PRODUCTION.value:
            return CognitoConfigFactory._create_prod_config()
        else:
            raise ValueError(f"Unknown environment: {environment}")
    
    @staticmethod
    def _create_local_config() -> CognitoConfig:
        """Local development configuration (using Cognito Local or LocalStack)"""
        return CognitoConfig(
            region="us-east-1",
            user_pool_id=os.getenv("COGNITO_USER_POOL_ID", "local_pool_id"),
            client_id=os.getenv("COGNITO_CLIENT_ID", "local_client_id"),
            client_secret=os.getenv("COGNITO_CLIENT_SECRET"),
            domain=os.getenv("COGNITO_DOMAIN", "http://localhost:9229"),
            redirect_uri=os.getenv("COGNITO_REDIRECT_URI", "http://localhost:4200/auth/callback"),
            jwks_uri=os.getenv("COGNITO_JWKS_URI", "http://localhost:9229/.well-known/jwks.json"),
            issuer=os.getenv("COGNITO_ISSUER", "http://localhost:9229")
        )
    
    @staticmethod
    def _create_dev_config() -> CognitoConfig:
        """Development environment configuration"""
        return CognitoConfig(
            region=os.getenv("AWS_REGION", "us-east-1"),
            user_pool_id=os.getenv("COGNITO_USER_POOL_ID", ""),
            client_id=os.getenv("COGNITO_CLIENT_ID", ""),
            client_secret=os.getenv("COGNITO_CLIENT_SECRET"),
            domain=os.getenv("COGNITO_DOMAIN"),
            redirect_uri=os.getenv("COGNITO_REDIRECT_URI", "http://localhost:4200/auth/callback")
        )
    
    @staticmethod
    def _create_staging_config() -> CognitoConfig:
        """Staging environment configuration"""
        return CognitoConfig(
            region=os.getenv("AWS_REGION", "us-east-1"),
            user_pool_id=os.getenv("COGNITO_USER_POOL_ID", ""),
            client_id=os.getenv("COGNITO_CLIENT_ID", ""),
            client_secret=os.getenv("COGNITO_CLIENT_SECRET"),
            domain=os.getenv("COGNITO_DOMAIN"),
            redirect_uri=os.getenv("COGNITO_REDIRECT_URI")
        )
    
    @staticmethod
    def _create_prod_config() -> CognitoConfig:
        """Production environment configuration"""
        return CognitoConfig(
            region=os.getenv("AWS_REGION", "us-east-1"),
            user_pool_id=os.getenv("COGNITO_USER_POOL_ID", ""),
            client_id=os.getenv("COGNITO_CLIENT_ID", ""),
            client_secret=os.getenv("COGNITO_CLIENT_SECRET"),
            domain=os.getenv("COGNITO_DOMAIN"),
            redirect_uri=os.getenv("COGNITO_REDIRECT_URI")
        )

# Singleton instance
_cognito_config: Optional[CognitoConfig] = None

def get_cognito_config() -> CognitoConfig:
    """Get or create Cognito configuration singleton"""
    global _cognito_config
    if _cognito_config is None:
        _cognito_config = CognitoConfigFactory.create()
    return _cognito_config