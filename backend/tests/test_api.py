from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_bible_tracker():
    response = client.get("/api/bible_tracker/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_bible_tracker():
    response = client.post("/api/bible_tracker/", json={"name": "Test Tracker"})
    assert response.status_code == 201
    assert response.json()["name"] == "Test Tracker"

def test_update_bible_tracker():
    response = client.put("/api/bible_tracker/1", json={"name": "Updated Tracker"})
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Tracker"

def test_delete_bible_tracker():
    response = client.delete("/api/bible_tracker/1")
    assert response.status_code == 204

def test_invalid_endpoint():
    response = client.get("/api/invalid_endpoint/")
    assert response.status_code == 404