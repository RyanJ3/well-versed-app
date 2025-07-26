"""Test configuration with authentication"""

import os
import pytest
from typing import Dict
from fastapi.testclient import TestClient
import sys
import asyncio
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from domain.auth import AuthProvider
from infrastructure.auth import LocalJWTProvider

# Set minimal env vars required for Config during tests
os.environ.setdefault("DATABASE_HOST", "localhost")
os.environ.setdefault("DATABASE_NAME", "test")
os.environ.setdefault("DATABASE_USER", "test")
os.environ.setdefault("DATABASE_PASSWORD", "test")
os.environ.setdefault("FRONTEND_URL", "http://testserver")
os.environ.setdefault("API_BIBLE_KEY", "dummy")
os.environ.setdefault("API_BIBLE_HOST", "http://example.com")
os.environ.setdefault("JWT_SECRET", "test-secret-key")

from main import app
from core.dependencies import get_verse_service

@pytest.fixture
def auth_provider() -> AuthProvider:
    """Test auth provider"""
    return LocalJWTProvider(secret_key="test-secret-key")

@pytest.fixture
def client() -> TestClient:
    return TestClient(app)

@pytest.fixture
def test_user():
    return {"user_id": 1, "email": "test@example.com"}

@pytest.fixture
def auth_headers(auth_provider: AuthProvider, test_user: Dict) -> Dict[str, str]:
    token = asyncio.run(
        auth_provider.create_token(
            user_id=test_user["user_id"],
            email=test_user["email"],
            roles=["user"]
        )
    )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_headers(auth_provider: AuthProvider) -> Dict[str, str]:
    token = asyncio.run(
        auth_provider.create_token(
            user_id=999,
            email="admin@example.com",
            roles=["admin", "user"]
        )
    )
    return {"Authorization": f"Bearer {token}"}


class MockVerseService:
    async def get_user_verses(self, user_id: int, include_apocrypha: bool = False):
        return []

    async def save_or_update_verse(self, user_id: int, book_id: int, chapter: int, verse: int, update):
        return {"message": "ok"}


@pytest.fixture(autouse=True)
def override_dependencies():
    """Override dependencies to avoid real database access"""
    app.dependency_overrides[get_verse_service] = lambda: MockVerseService()
    yield
    app.dependency_overrides.clear()
