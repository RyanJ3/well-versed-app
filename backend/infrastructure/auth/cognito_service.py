# backend/infrastructure/auth/cognito_service.py
import json
import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import logging
import httpx
from jose import jwt, jwk, JWTError
from jose.utils import base64url_decode
import boto3
from botocore.exceptions import ClientError

from .cognito_config import get_cognito_config, CognitoConfig

logger = logging.getLogger(__name__)

@dataclass
class UserInfo:
    """User information from Cognito"""
    sub: str  # User ID
    email: str
    email_verified: bool
    username: str
    groups: List[str] = None
    custom_attributes: Dict[str, Any] = None
    
    @property
    def user_id(self) -> str:
        return self.sub

class CognitoService:
    """Service for interacting with AWS Cognito"""
    
    def __init__(self, config: Optional[CognitoConfig] = None):
        self.config = config or get_cognito_config()
        self._jwks_cache = None
        self._jwks_cache_time = 0
        self._jwks_cache_ttl = 3600  # 1 hour cache
        
        # Check if we're in local mode
        import os
        self.is_local = os.getenv("ENVIRONMENT") == "local"
        
        # Initialize boto3 client only for non-local environments
        if not self.is_local and self.config.region != "local":
            self.cognito_client = boto3.client(
                'cognito-idp',
                region_name=self.config.region
            )
        else:
            self.cognito_client = None
    
    async def verify_token(self, token: str) -> Optional[UserInfo]:
        """
        Verify and decode a Cognito JWT token
        
        Args:
            token: JWT token from Authorization header
            
        Returns:
            UserInfo if token is valid, None otherwise
        """
        # In local mode, verify with local secret
        if self.is_local:
            try:
                import os
                # Get the local JWT secret from environment
                local_secret = os.getenv('LOCAL_JWT_SECRET')
                if not local_secret:
                    logger.error("LOCAL_JWT_SECRET not configured for local environment")
                    return None
                
                # Verify the token with the local secret
                payload = jwt.decode(
                    token,
                    local_secret,
                    algorithms=['HS256'],
                    options={
                        'verify_exp': True,
                        'verify_iat': True,
                        'require_exp': True,
                        'require_iat': True
                    }
                )
                
                return UserInfo(
                    sub=payload.get('sub', 'local-user'),
                    email=payload.get('email', 'test@example.com'),
                    email_verified=payload.get('email_verified', True),
                    username=payload.get('cognito:username', payload.get('username', 'testuser')),
                    groups=payload.get('cognito:groups', ['users']),
                    custom_attributes={}
                )
            except JWTError as e:
                logger.error(f"Local token verification failed: {e}")
                return None
            except Exception as e:
                logger.error(f"Local token decode failed: {e}")
                return None
        
        try:
            # Get JWKS for token verification
            jwks = await self._get_jwks()
            
            # Get the kid from the token header
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')
            
            if not kid:
                logger.error("Token missing 'kid' in header")
                return None
            
            # Find the matching key
            key = None
            for k in jwks.get('keys', []):
                if k['kid'] == kid:
                    key = k
                    break
            
            if not key:
                logger.error(f"Unable to find matching key for kid: {kid}")
                return None
            
            # Construct the public key
            public_key = jwk.construct(key)
            
            # Decode and verify the token
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                issuer=self.config.issuer_url,
                audience=self.config.client_id,  # Verify audience claim
                options={
                    'verify_aud': True,  # Enable audience verification
                    'verify_exp': True,
                    'verify_iat': True,
                    'require_exp': True,
                    'require_iat': True,
                    'require_sub': True  # Require subject claim
                }
            )
            
            # Extract user information
            return UserInfo(
                sub=payload['sub'],
                email=payload.get('email', ''),
                email_verified=payload.get('email_verified', False),
                username=payload.get('cognito:username', payload.get('username', '')),
                groups=payload.get('cognito:groups', []),
                custom_attributes={
                    k: v for k, v in payload.items() 
                    if k.startswith('custom:')
                }
            )
            
        except JWTError as e:
            logger.error(f"JWT verification failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None
    
    async def _get_jwks(self) -> Dict[str, Any]:
        """Get JWKS with caching"""
        current_time = time.time()
        
        # Return cached JWKS if still valid
        if self._jwks_cache and (current_time - self._jwks_cache_time) < self._jwks_cache_ttl:
            return self._jwks_cache
        
        # Fetch new JWKS
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.config.jwks_url)
                response.raise_for_status()
                self._jwks_cache = response.json()
                self._jwks_cache_time = current_time
                return self._jwks_cache
        except Exception as e:
            logger.error(f"Failed to fetch JWKS: {e}")
            # Return cached version if available, even if expired
            if self._jwks_cache:
                logger.warning("Using expired JWKS cache due to fetch failure")
                return self._jwks_cache
            raise
    
    def create_user(self, email: str, temporary_password: str) -> Dict[str, Any]:
        """
        Create a new user in Cognito (admin only)
        
        Args:
            email: User's email address
            temporary_password: Temporary password for first login
            
        Returns:
            User creation response
        """
        if not self.cognito_client:
            raise RuntimeError("Cognito client not available in local environment")
        
        try:
            response = self.cognito_client.admin_create_user(
                UserPoolId=self.config.user_pool_id,
                Username=email,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    {'Name': 'email_verified', 'Value': 'true'}
                ],
                TemporaryPassword=temporary_password,
                MessageAction='SUPPRESS'  # Don't send welcome email in dev
            )
            return response
        except ClientError as e:
            logger.error(f"Failed to create user: {e}")
            raise
    
    def initiate_auth(self, username: str, password: str) -> Dict[str, Any]:
        """
        Initiate authentication flow
        
        Args:
            username: Username or email
            password: User's password
            
        Returns:
            Authentication response with tokens
        """
        if self.is_local or not self.cognito_client:
            # For local testing, validate password and return mock tokens
            import os
            valid_test_password = os.getenv('LOCAL_TEST_PASSWORD')
            if not valid_test_password:
                raise ValueError("LOCAL_TEST_PASSWORD environment variable not set")
            if password != valid_test_password:
                raise ValueError("Invalid test credentials for local environment")
            return self._mock_auth_response(username)
        
        try:
            response = self.cognito_client.initiate_auth(
                ClientId=self.config.client_id,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': username,
                    'PASSWORD': password
                }
            )
            return response
        except ClientError as e:
            logger.error(f"Authentication failed: {e}")
            raise
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token
        
        Args:
            refresh_token: Cognito refresh token
            
        Returns:
            New authentication tokens
        """
        if self.is_local or not self.cognito_client:
            return self._mock_auth_response("refreshed_user")
        
        try:
            response = self.cognito_client.initiate_auth(
                ClientId=self.config.client_id,
                AuthFlow='REFRESH_TOKEN_AUTH',
                AuthParameters={
                    'REFRESH_TOKEN': refresh_token
                }
            )
            return response
        except ClientError as e:
            logger.error(f"Token refresh failed: {e}")
            raise
    
    def _mock_auth_response(self, username: str) -> Dict[str, Any]:
        """Generate mock authentication response for local testing"""
        import uuid
        import os
        import secrets
        
        # Get the local JWT secret from environment
        local_secret = os.getenv('LOCAL_JWT_SECRET')
        if not local_secret or len(local_secret) < 32:
            # Generate a secure random secret if not configured properly
            generated_secret = secrets.token_urlsafe(32)
            raise RuntimeError(
                f"LOCAL_JWT_SECRET not configured or too short. "
                f"Add this to your .env file:\nLOCAL_JWT_SECRET={generated_secret}"
            )
        
        # Require environment variables to be explicitly set (no defaults)
        valid_test_users_str = os.getenv('LOCAL_TEST_USERS')
        if not valid_test_users_str:
            raise RuntimeError(
                "LOCAL_TEST_USERS not configured. "
                "Add to .env file: LOCAL_TEST_USERS=test@example.com"
            )
        valid_test_users = valid_test_users_str.split(',')
        
        # No default password - must be explicitly set
        valid_test_password = os.getenv('LOCAL_TEST_PASSWORD')
        if not valid_test_password or len(valid_test_password) < 8:
            raise RuntimeError(
                "LOCAL_TEST_PASSWORD not configured or too short (min 8 chars). "
                "Add a secure password to your .env file"
            )
        
        # Check if this is a valid test user
        if username not in valid_test_users:
            raise ValueError("Invalid test credentials for local environment")
        
        mock_token = jwt.encode(
            {
                'sub': str(uuid.uuid4()),
                'email': f"{username}@test.com" if '@' not in username else username,
                'email_verified': True,
                'cognito:username': username,
                'cognito:groups': ['users'],
                'iat': int(time.time()),
                'exp': int(time.time()) + 3600,
                'jti': str(uuid.uuid4())  # Add JWT ID for blacklisting
            },
            local_secret,
            algorithm='HS256'
        )
        
        return {
            'AuthenticationResult': {
                'AccessToken': mock_token,
                'IdToken': mock_token,
                'RefreshToken': f"mock_refresh_{username}",
                'ExpiresIn': 3600
            }
        }

# Singleton instance
_cognito_service: Optional[CognitoService] = None

def get_cognito_service() -> CognitoService:
    """Get or create Cognito service singleton"""
    global _cognito_service
    if _cognito_service is None:
        _cognito_service = CognitoService()
    return _cognito_service