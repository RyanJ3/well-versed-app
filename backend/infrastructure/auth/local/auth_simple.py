"""
Simple Local Authentication
============================
Simplified authentication for local development.
Only implements what's currently used by frontend:
- Login
- Logout  
- Token management
- Get current user
"""

import os
import jwt
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from ..core.interface import AuthInterface
from ..core.config import Environment, EnvVars, TokenConfig


class SimpleLocalAuth(AuthInterface):
    """
    Simplified local authentication provider.
    
    Features:
    - Basic login/logout with token blacklist
    - JWT token generation
    - Hardcoded test users for development
    
    SECURITY WARNING: For development only!
    """
    
    def __init__(self):
        """Initialize with simple test users."""
        # Get environment and config
        env_str = os.environ.get(EnvVars.ENVIRONMENT.value, "local")
        environment = Environment.from_string(env_str)
        
        # Get token config
        self.token_config = TokenConfig.for_environment(environment)
        
        # Get secret key
        self.secret_key = os.environ.get(
            EnvVars.LOCAL_JWT_SECRET.value, 
            "local-dev-secret-key-not-for-production"
        )
        
        # Token blacklist for logout simulation
        # In production, this would be Redis or a database
        self.blacklisted_tokens = set()
        
        # User counter for generating IDs
        self.user_counter = 1000
        
        # Start with default test users (mutable now for registration)
        self.test_users = {
            "test@example.com": {
                "user_id": "local_test_user_001",
                "email": "test@example.com",
                "name": "Test User",
                "password": "password123",  # In plain text for simplicity
                "groups": ["users"],
                "enabled": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            "admin@example.com": {
                "user_id": "local_admin_user_001", 
                "email": "admin@example.com",
                "name": "Admin User",
                "password": "admin123",
                "groups": ["users", "admins"],
                "enabled": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        }
        
        print(f"SimpleLocalAuth initialized for {environment.value}")
    
    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user against hardcoded test users.
        """
        if not username or not password:
            return None
        
        user = self.test_users.get(username)
        if not user:
            return None
        
        # Check password (plain text comparison for dev)
        if user["password"] != password:
            return None
        
        # Check if enabled
        if not user.get("enabled", True):
            return None
        
        # Return user data for token creation
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "groups": user.get("groups", [])
        }
    
    def register(self, username: str, password: str, **kwargs) -> Dict[str, Any]:
        """
        Register a new user in memory (lost on restart).
        Perfect for local development and testing.
        """
        # Check if user already exists
        if username.lower() in self.test_users:
            return {
                "success": False,
                "error": "User already exists",
                "code": "UserAlreadyExists"
            }
        
        # Validate email format (basic check)
        if "@" not in username or "." not in username.split("@")[1]:
            return {
                "success": False,
                "error": "Invalid email format",
                "code": "InvalidEmail"
            }
        
        # Validate password (minimum 6 characters)
        if len(password) < 6:
            return {
                "success": False,
                "error": "Password must be at least 6 characters",
                "code": "PasswordTooShort"
            }
        
        # Generate new user ID
        self.user_counter += 1
        user_id = f"local_user_{self.user_counter}"
        
        # Extract name from kwargs - required field
        name = kwargs.get("name")
        if not name or (isinstance(name, str) and name.strip() == ""):
            return {
                "success": False,
                "error": "Name is required",
                "code": "NameRequired"
            }
        
        if isinstance(name, str):
            name = name.strip()  # Remove leading/trailing whitespace
        
        # Create new user
        new_user = {
            "user_id": user_id,
            "email": username.lower(),
            "name": name,
            "password": password,  # Plain text for local dev
            "groups": ["users"],
            "enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Add to users dictionary
        self.test_users[username.lower()] = new_user
        
        print(f"New user registered: {username}")
        
        # Return success with user info
        return {
            "success": True,
            "user": {
                "user_id": user_id,
                "email": username.lower(),
                "name": name
            },
            "message": "Registration successful"
        }
    
    def create_tokens(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create JWT tokens for local development.
        """
        now = datetime.now(timezone.utc)
        
        # Access token payload
        access_payload = {
            "user_id": user_data["user_id"],
            "email": user_data["email"],
            "name": user_data.get("name", ""),
            "groups": user_data.get("groups", []),
            "type": "access",
            "iat": now,
            "exp": now + self.token_config.access_token_expiry
        }
        
        # Refresh token payload
        refresh_payload = {
            "user_id": user_data["user_id"],
            "email": user_data["email"],
            "type": "refresh",
            "iat": now,
            "exp": now + self.token_config.refresh_token_expiry
        }
        
        access_token = jwt.encode(access_payload, self.secret_key, algorithm="HS256")
        refresh_token = jwt.encode(refresh_payload, self.secret_key, algorithm="HS256")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": int(self.token_config.access_token_expiry.total_seconds())
        }
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode a JWT token.
        Checks blacklist to ensure token hasn't been logged out.
        """
        # Check if token is blacklisted
        if token in self.blacklisted_tokens:
            print("Token is blacklisted (user logged out)")
            return None
        
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            print("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {e}")
            return None
    
    def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Refresh an access token using a refresh token.
        """
        # Check if refresh token is blacklisted
        if refresh_token in self.blacklisted_tokens:
            print("Refresh token is blacklisted (user logged out)")
            return None
        
        payload = self.verify_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        
        # Get user data
        email = payload.get("email")
        user = self.test_users.get(email)
        if not user or not user.get("enabled", True):
            return None
        
        # Create new access token only
        now = datetime.now(timezone.utc)
        access_payload = {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user.get("name", ""),
            "groups": user.get("groups", []),
            "type": "access",
            "iat": now,
            "exp": now + self.token_config.access_token_expiry
        }
        
        access_token = jwt.encode(access_payload, self.secret_key, algorithm="HS256")
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": int(self.token_config.access_token_expiry.total_seconds())
        }
    
    def logout(self, access_token: str) -> bool:
        """
        Logout by blacklisting the token.
        
        Adds the token to a blacklist to prevent further use.
        In production, this would be stored in Redis or a database.
        """
        if not access_token:
            return False
        
        # Add to blacklist
        self.blacklisted_tokens.add(access_token)
        
        # Also try to decode and blacklist the refresh token if we have it
        # (though we typically only get the access token in logout)
        try:
            payload = jwt.decode(access_token, self.secret_key, algorithms=["HS256"], options={"verify_exp": False})
            print(f"User {payload.get('email', 'unknown')} logged out successfully")
        except:
            print("Logged out (could not decode token)")
        
        return True
    
    def get_token_expiry(self) -> timedelta:
        """Get the access token expiration time."""
        return self.token_config.access_token_expiry
    
    def forgot_password(self, email: str) -> Dict[str, Any]:
        """Not implemented for this version."""
        return {
            "success": False,
            "error": "Password reset not available in development mode"
        }
    
    def reset_password(self, token: str, new_password: str) -> Dict[str, Any]:
        """Not implemented for this version."""
        return {
            "success": False,
            "error": "Password reset not available in development mode"
        }
    
    def clear_blacklist(self) -> None:
        """
        Clear the token blacklist.
        Useful for testing or periodic cleanup of expired tokens.
        """
        self.blacklisted_tokens.clear()
        print("Token blacklist cleared")