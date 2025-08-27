"""
Tests for Simple Local Authentication
======================================
Tests the simplified auth implementation used for development.
"""

import os
import sys
import pytest
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../backend')))

from infrastructure.auth.local.auth_simple import SimpleLocalAuth
from infrastructure.auth.core.config import Environment, EnvVars


class TestSimpleAuth:
    """Test simple authentication implementation."""
    
    def setup_method(self):
        """Set up test environment."""
        os.environ[EnvVars.ENVIRONMENT.value] = "test"
        self.auth = SimpleLocalAuth()
    
    def test_authenticate_test_user(self):
        """Test authentication with hardcoded test user."""
        result = self.auth.authenticate("test@example.com", "password123")
        assert result is not None
        assert result["email"] == "test@example.com"
        assert result["name"] == "Test User"
    
    def test_authenticate_admin_user(self):
        """Test authentication with admin user."""
        result = self.auth.authenticate("admin@example.com", "admin123")
        assert result is not None
        assert result["email"] == "admin@example.com"
        assert "admins" in result["groups"]
    
    def test_authenticate_invalid_password(self):
        """Test authentication with wrong password."""
        result = self.auth.authenticate("test@example.com", "wrongpassword")
        assert result is None
    
    def test_authenticate_unknown_user(self):
        """Test authentication with unknown user."""
        result = self.auth.authenticate("unknown@example.com", "password123")
        assert result is None
    
    def test_create_tokens(self):
        """Test JWT token creation."""
        user_data = {
            "user_id": "test-123",
            "email": "token@example.com",
            "name": "Token Test",
            "groups": ["users"]
        }
        
        tokens = self.auth.create_tokens(user_data)
        
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["token_type"] == "Bearer"
        assert tokens["expires_in"] > 0
    
    def test_verify_token(self):
        """Test token verification."""
        user_data = {
            "user_id": "verify-123",
            "email": "verify@example.com",
            "name": "Verify Test"
        }
        
        tokens = self.auth.create_tokens(user_data)
        payload = self.auth.verify_token(tokens["access_token"])
        
        assert payload is not None
        assert payload["user_id"] == "verify-123"
        assert payload["email"] == "verify@example.com"
        assert payload["type"] == "access"
    
    def test_refresh_token(self):
        """Test token refresh."""
        # Authenticate to get initial tokens
        auth_result = self.auth.authenticate("test@example.com", "password123")
        initial_tokens = self.auth.create_tokens(auth_result)
        
        # Refresh the token
        new_tokens = self.auth.refresh_token(initial_tokens["refresh_token"])
        
        assert new_tokens is not None
        assert "access_token" in new_tokens
        assert new_tokens["token_type"] == "Bearer"
    
    def test_register_new_user(self):
        """Test that registration creates a new user."""
        # Register a new user
        result = self.auth.register("newuser@example.com", "password123", name="New User")
        assert result["success"] == True
        assert result["user"]["email"] == "newuser@example.com"
        assert result["user"]["name"] == "New User"
        
        # Verify we can authenticate with the new user
        auth_result = self.auth.authenticate("newuser@example.com", "password123")
        assert auth_result is not None
        assert auth_result["email"] == "newuser@example.com"
    
    def test_register_duplicate_user(self):
        """Test that duplicate registration fails."""
        # Try to register existing test user
        result = self.auth.register("test@example.com", "somepassword")
        assert result["success"] == False
        assert "already exists" in result["error"].lower()
    
    def test_register_invalid_email(self):
        """Test that invalid email format fails."""
        result = self.auth.register("notanemail", "password123")
        assert result["success"] == False
        assert "invalid email" in result["error"].lower()
    
    def test_register_short_password(self):
        """Test that short password fails."""
        result = self.auth.register("short@example.com", "123")
        assert result["success"] == False
        assert "at least 6 characters" in result["error"].lower()
    
    def test_register_with_special_characters_name(self):
        """Test registration with special characters in name."""
        result = self.auth.register(
            "special@example.com", 
            "password123", 
            name="José O'Brien-Smith 3rd"
        )
        assert result["success"] == True
        assert result["user"]["name"] == "José O'Brien-Smith 3rd"
        
        # Verify authentication works
        auth_result = self.auth.authenticate("special@example.com", "password123")
        assert auth_result is not None
        assert auth_result["name"] == "José O'Brien-Smith 3rd"
    
    def test_register_empty_name_fails(self):
        """Test that empty name returns an error."""
        result = self.auth.register("emptyname@example.com", "password123", name=None)
        assert result["success"] == False
        assert "name is required" in result["error"].lower()
    
    def test_register_whitespace_only_name_fails(self):
        """Test that whitespace-only name returns an error."""
        result = self.auth.register("whitespace@example.com", "password123", name="   ")
        assert result["success"] == False
        assert "name is required" in result["error"].lower()
    
    def test_register_very_long_inputs(self):
        """Test registration with very long email and name."""
        long_email = "a" * 50 + "@example.com"
        long_name = "Very " * 100 + "Long Name"
        
        result = self.auth.register(long_email, "password123", name=long_name)
        assert result["success"] == True
        assert result["user"]["email"] == long_email.lower()
        assert result["user"]["name"] == long_name
    
    def test_register_mixed_case_email(self):
        """Test that email is case-insensitive."""
        # Register with mixed case
        result = self.auth.register("MiXeD@ExAmPlE.CoM", "password123", name="Mixed Case")
        assert result["success"] == True
        assert result["user"]["email"] == "mixed@example.com"  # Should be lowercase
        
        # Try to register same email with different case
        result2 = self.auth.register("mixed@example.com", "password123")
        assert result2["success"] == False
        assert "already exists" in result2["error"].lower()
    
    def test_forgot_password_not_implemented(self):
        """Test that forgot password returns not implemented."""
        result = self.auth.forgot_password("test@example.com")
        assert result["success"] == False
        assert "not available" in result["error"].lower()
    
    def test_logout_blacklists_token(self):
        """Test that logout blacklists the token."""
        # Authenticate and get tokens
        auth_result = self.auth.authenticate("test@example.com", "password123")
        tokens = self.auth.create_tokens(auth_result)
        access_token = tokens["access_token"]
        
        # Verify token works before logout
        payload = self.auth.verify_token(access_token)
        assert payload is not None
        assert payload["email"] == "test@example.com"
        
        # Logout
        success = self.auth.logout(access_token)
        assert success == True
        
        # Verify token is now blacklisted
        payload = self.auth.verify_token(access_token)
        assert payload is None
    
    def test_refresh_token_blacklisted_after_logout(self):
        """Test that refresh doesn't work with blacklisted token."""
        # Authenticate and get tokens
        auth_result = self.auth.authenticate("test@example.com", "password123")
        tokens = self.auth.create_tokens(auth_result)
        refresh_tok = tokens["refresh_token"]
        
        # Refresh works before blacklisting
        new_tokens = self.auth.refresh_token(refresh_tok)
        assert new_tokens is not None
        
        # Blacklist the refresh token (simulating logout)
        self.auth.blacklisted_tokens.add(refresh_tok)
        
        # Refresh should fail now
        new_tokens = self.auth.refresh_token(refresh_tok)
        assert new_tokens is None