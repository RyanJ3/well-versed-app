"""Test configuration with authentication"""

import pytest
from typing import Dict
from fastapi.testclient import TestClient
from domain.auth import AuthProvider
from infrastructure.auth import LocalJWTProvider
from main import app

@pytest.fixture
def auth_provider() -> AuthProvider:
    """Test auth provider"""
    return LocalJWTProvider(secret_key="test-secret-key")

@pytest.fixture
def client() -> TestClient:
    return TestClient(app)

@pytest.fixture
async def test_user():
    return {"user_id": 1, "email": "test@example.com"}

@pytest.fixture
async def auth_headers(auth_provider: AuthProvider, test_user: Dict) -> Dict[str, str]:
    token = await auth_provider.create_token(
        user_id=test_user["user_id"],
        email=test_user["email"],
        roles=["user"]
    )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def admin_headers(auth_provider: AuthProvider) -> Dict[str, str]:
    token = await auth_provider.create_token(
        user_id=999,
        email="admin@example.com",
        roles=["admin", "user"]
    )
    return {"Authorization": f"Bearer {token}"}
