"""
Base Authentication Interface
==============================
Abstract base class defining the authentication contract that all
auth implementations (local, Cognito, etc.) must follow.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import timedelta


class AuthInterface(ABC):
    """
    Abstract base class for authentication implementations.
    
    All authentication providers (Local, Cognito, Auth0, etc.) 
    must implement these methods.
    """
    
    @abstractmethod
    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user with username/password.
        
        Args:
            username: User's email or username
            password: User's password
            
        Returns:
            User data dict if successful, None if authentication fails
            Expected dict structure:
            {
                "user_id": str,
                "email": str,
                "name": str (optional),
                "groups": List[str] (optional)
            }
        """
        pass
    
    @abstractmethod
    def register(self, username: str, password: str, **kwargs) -> Dict[str, Any]:
        """
        Register a new user.
        
        Args:
            username: User's email or username
            password: User's password
            **kwargs: Additional registration data (name, phone, etc.)
            
        Returns:
            Registration result with user data or error information
        """
        pass
    
    @abstractmethod
    def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Refresh an access token using a refresh token.
        
        Args:
            refresh_token: The refresh token
            
        Returns:
            New token data if successful, None if refresh fails
        """
        pass
    
    @abstractmethod
    def logout(self, access_token: str) -> bool:
        """
        Logout a user (invalidate tokens if applicable).
        
        Args:
            access_token: The user's current access token
            
        Returns:
            True if logout successful, False otherwise
        """
        pass
    
    @abstractmethod
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode an access token.
        
        Args:
            token: The access token to verify
            
        Returns:
            Decoded token data if valid, None if invalid
        """
        pass
    
    @abstractmethod
    def create_tokens(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create access and refresh tokens for a user.
        
        Args:
            user_data: User information to encode in tokens
            
        Returns:
            Dict containing:
            {
                "access_token": str,
                "refresh_token": str,
                "token_type": "Bearer",
                "expires_in": int (seconds)
            }
        """
        pass
    
    @abstractmethod
    def get_token_expiry(self) -> timedelta:
        """
        Get the access token expiration time.
        
        Returns:
            timedelta for token expiration
        """
        pass
    
    @abstractmethod
    def forgot_password(self, email: str) -> Dict[str, Any]:
        """
        Initiate password reset process.
        
        Args:
            email: User's email address
            
        Returns:
            Result of password reset initiation
        """
        pass
    
    @abstractmethod
    def reset_password(self, token: str, new_password: str) -> Dict[str, Any]:
        """
        Reset password using a reset token.
        
        Args:
            token: Password reset token
            new_password: New password to set
            
        Returns:
            Result of password reset
        """
        pass