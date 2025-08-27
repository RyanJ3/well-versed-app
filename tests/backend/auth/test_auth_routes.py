"""
Tests for Authentication Routes
================================
Tests the auth API endpoints including registration.
"""

import sys
import os
from fastapi.testclient import TestClient
import pytest

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../backend')))

from main import app
from infrastructure.auth.core.config import EnvVars

# Set test environment
os.environ[EnvVars.ENVIRONMENT.value] = "test"

client = TestClient(app)


class TestAuthRoutes:
    """Test authentication API endpoints."""
    
    def setup_method(self):
        """Reset for each test."""
        # Clear any in-memory users between tests by restarting the auth provider
        from infrastructure.auth.core.factory import AuthFactory
        AuthFactory._auth_provider = None
    
    def test_register_endpoint_success(self):
        """Test successful registration via API."""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "api_test@example.com",
                "password": "secure123",
                "name": "API Test User"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"]["email"] == "api_test@example.com"
        assert data["user"]["name"] == "API Test User"
    
    def test_register_endpoint_missing_name(self):
        """Test registration without name (should use email prefix)."""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "noname@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"]["email"] == "noname@example.com"
        assert data["user"]["name"] == "Noname"  # Should default to email prefix
    
    def test_register_endpoint_duplicate(self):
        """Test duplicate registration via API."""
        # First registration
        response1 = client.post(
            "/api/auth/register",
            json={
                "username": "duplicate@example.com",
                "password": "password123",
                "name": "First User"
            }
        )
        assert response1.status_code == 200
        
        # Duplicate registration
        response2 = client.post(
            "/api/auth/register",
            json={
                "username": "duplicate@example.com",
                "password": "different123",
                "name": "Second User"
            }
        )
        assert response2.status_code == 400
        assert "already exists" in response2.json()["detail"].lower()
    
    def test_register_then_login(self):
        """Test registration followed by login."""
        # Register
        reg_response = client.post(
            "/api/auth/register",
            json={
                "username": "logintest@example.com",
                "password": "mypassword123",
                "name": "Login Test"
            }
        )
        assert reg_response.status_code == 200
        
        # Login
        login_response = client.post(
            "/api/auth/login",
            json={
                "username": "logintest@example.com",
                "password": "mypassword123"
            }
        )
        assert login_response.status_code == 200
        assert "access_token" in login_response.json()
        assert "refresh_token" in login_response.json()
    
    def test_register_then_me_endpoint(self):
        """Test that /me endpoint returns correct user after registration and login."""
        # Register
        client.post(
            "/api/auth/register",
            json={
                "username": "metest@example.com",
                "password": "password123",
                "name": "Me Test User"
            }
        )
        
        # Login to get token
        login_response = client.post(
            "/api/auth/login",
            json={
                "username": "metest@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Check /me endpoint
        me_response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        user_data = me_response.json()
        assert user_data["email"] == "metest@example.com"
        assert user_data["name"] == "Me Test User"
    
    def test_register_special_characters_in_name(self):
        """Test registration with special characters in name."""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "special@example.com",
                "password": "password123",
                "name": "José O'Brien-Smith"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["name"] == "José O'Brien-Smith"
    
    def test_register_empty_password(self):
        """Test registration with empty password."""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "empty@example.com",
                "password": "",
                "name": "Empty Pass"
            }
        )
        assert response.status_code == 400
    
    def test_register_invalid_email_format(self):
        """Test registration with badly formatted email."""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "not-an-email",
                "password": "password123",
                "name": "Invalid Email"
            }
        )
        assert response.status_code == 422  # Pydantic validation error