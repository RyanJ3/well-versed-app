"""
Local Development Authentication
=================================
Simple authentication implementation for local development.
Accepts any email/password combination for easy testing.

WARNING: This should NEVER be used in production!
"""

import os
import jwt
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from .auth_interface import AuthInterface


class LocalAuth(AuthInterface):
    """
    Local development authentication provider.
    
    Features:
    - Accepts any email/password for login
    - Creates JWT tokens locally
    - No external dependencies
    - In-memory user storage
    
    SECURITY WARNING: For development only!
    """
    
    def __init__(self):
        """Initialize local auth with development settings."""
        self.secret_key = os.environ.get("LOCAL_JWT_SECRET")
        self.token_expiry = timedelta(hours=24)  # Longer expiry for dev
        self.refresh_expiry = timedelta(days=7)
        
        # In-memory storage for registered users (resets on restart)
        self.users: Dict[str, Dict[str, Any]] = {}
        
        # Pre-populate with test users from environment
        test_users = os.environ.get("LOCAL_TEST_USERS", "test@example.com,admin@example.com").split(",")
        for email in test_users:
            email = email.strip()
            if email:
                user_id = f"local_{email.split('@')[0]}"
                self.users[email] = {
                    "user_id": user_id,
                    "email": email,
                    "name": email.split('@')[0].title(),
                    "created_at": datetime.utcnow().isoformat()
                }
        
        print(f"LocalAuth initialized with {len(self.users)} test users")
    
    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate any user for local development.
        
        In local mode, any non-empty username/password is accepted.
        If the user doesn't exist, they're automatically created.
        """
        if not username or not password:
            return None
        
        # Auto-create user if doesn't exist
        if username not in self.users:
            self.users[username] = {
                "user_id": f"local_{username.split('@')[0]}_{len(self.users)}",
                "email": username,
                "name": username.split('@')[0].title(),
                "created_at": datetime.utcnow().isoformat()
            }
        
        return self.users[username].copy()
    
    def register(self, username: str, password: str, **kwargs) -> Dict[str, Any]:
        """
        Register a new user in local mode.
        
        Always succeeds in local development.
        """
        if username in self.users:
            return {
                "success": False,
                "error": "User already exists",
                "code": "USER_EXISTS"
            }
        
        user_data = {
            "user_id": f"local_{username.split('@')[0]}_{len(self.users)}",
            "email": username,
            "name": kwargs.get("name", username.split('@')[0].title()),
            "created_at": datetime.utcnow().isoformat()
        }
        
        self.users[username] = user_data
        
        return {
            "success": True,
            "user": user_data.copy()
        }
    
    def create_tokens(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create JWT tokens for local development.
        """
        now = datetime.utcnow()
        
        # Access token payload
        access_payload = {
            "user_id": user_data["user_id"],
            "email": user_data["email"],
            "name": user_data.get("name", ""),
            "type": "access",
            "iat": now,
            "exp": now + self.token_expiry
        }
        
        # Refresh token payload
        refresh_payload = {
            "user_id": user_data["user_id"],
            "email": user_data["email"],
            "type": "refresh",
            "iat": now,
            "exp": now + self.refresh_expiry
        }
        
        access_token = jwt.encode(access_payload, self.secret_key, algorithm="HS256")
        refresh_token = jwt.encode(refresh_payload, self.secret_key, algorithm="HS256")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": int(self.token_expiry.total_seconds())
        }
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode a JWT token.
        """
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
        payload = self.verify_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        
        # Get user data
        email = payload.get("email")
        if email not in self.users:
            return None
        
        user_data = self.users[email]
        
        # Create new access token only
        now = datetime.utcnow()
        access_payload = {
            "user_id": user_data["user_id"],
            "email": user_data["email"],
            "name": user_data.get("name", ""),
            "type": "access",
            "iat": now,
            "exp": now + self.token_expiry
        }
        
        access_token = jwt.encode(access_payload, self.secret_key, algorithm="HS256")
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": int(self.token_expiry.total_seconds())
        }
    
    def logout(self, access_token: str) -> bool:
        """
        Logout in local mode (no-op since we don't track sessions).
        """
        # In local mode, tokens are stateless, so logout just returns success
        # Client should remove tokens from storage
        return True
    
    def get_token_expiry(self) -> timedelta:
        """Get the access token expiration time."""
        return self.token_expiry
    
    def forgot_password(self, email: str) -> Dict[str, Any]:
        """
        Handle forgot password in local mode.
        
        In development, just return a mock reset token.
        """
        if email not in self.users:
            # Still return success to avoid user enumeration
            return {
                "success": True,
                "message": "If the email exists, a reset link has been sent"
            }
        
        # In local dev, return the token directly (never do this in production!)
        reset_token = jwt.encode(
            {
                "email": email,
                "type": "password_reset",
                "exp": datetime.utcnow() + timedelta(hours=1)
            },
            self.secret_key,
            algorithm="HS256"
        )
        
        return {
            "success": True,
            "message": "Password reset token generated",
            "dev_only_token": reset_token  # Only in dev!
        }
    
    def reset_password(self, token: str, new_password: str) -> Dict[str, Any]:
        """
        Reset password in local mode.
        
        Validates the reset token and updates the password (no-op in local).
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            if payload.get("type") != "password_reset":
                return {
                    "success": False,
                    "error": "Invalid reset token"
                }
            
            email = payload.get("email")
            if email in self.users:
                # In local mode, we don't actually store passwords
                return {
                    "success": True,
                    "message": "Password updated successfully"
                }
            else:
                return {
                    "success": False,
                    "error": "User not found"
                }
                
        except jwt.ExpiredSignatureError:
            return {
                "success": False,
                "error": "Reset token has expired"
            }
        except jwt.InvalidTokenError:
            return {
                "success": False,
                "error": "Invalid reset token"
            }