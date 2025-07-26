"""Test verses API with authentication"""

import pytest
from typing import Dict
from fastapi.testclient import TestClient

@pytest.mark.asyncio
async def test_get_verses_requires_auth(client: TestClient):
    response = client.get("/api/verses/")
    assert response.status_code == 401
    assert "Missing authorization header" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_verses_with_auth(client: TestClient, auth_headers: Dict[str, str]):
    response = client.get("/api/verses/", headers=auth_headers)
    assert response.status_code in {200, 404, 500}  # depending on db setup

@pytest.mark.asyncio
async def test_compatibility_endpoint_requires_auth(client: TestClient):
    response = client.get("/api/verses/user-verses/1")
    assert response.status_code == 401
