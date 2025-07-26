# backend/test_api.py
import pytest
import requests
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pytestmark = pytest.mark.skip("Integration tests require running API server")

BASE_URL = "http://localhost:8000/api"
USER_ID = 1

def test_health():
    """Test health endpoint"""
    r = requests.get(f"{BASE_URL}/health")
    logger.info(f"Health check: {r.status_code} - {r.json()}")
    assert r.status_code == 200

def test_get_user():
    """Test get user endpoint"""
    r = requests.get(f"{BASE_URL}/users/{USER_ID}")
    logger.info(f"Get user: {r.status_code}")
    if r.status_code == 200:
        user = r.json()
        logger.info(f"User: {user['name']} - {user['email']}")
        logger.info(f"Include Apocrypha: {user.get('include_apocrypha', False)}")
    return r.json()

def test_get_verses():
    """Test get user verses"""
    r = requests.get(f"{BASE_URL}/user-verses/{USER_ID}")
    logger.info(f"Get verses: {r.status_code}")
    verses = r.json()
    logger.info(f"Found {len(verses)} memorized verses")
    for v in verses[:3]:
        logger.info(f"  - Book {v['verse']['book_id']}, Chapter {v['verse']['chapter_number']}, Verse {v['verse']['verse_number']}")
    return verses

def test_save_verse():
    """Test saving a verse using numerical IDs"""
    # Save Psalm 1:1 (Book ID 19)
    book_id = 19
    chapter = 1
    verse = 1
    data = {"practice_count": 1}
    r = requests.put(f"{BASE_URL}/user-verses/{USER_ID}/{book_id}/{chapter}/{verse}", json=data)
    logger.info(f"Save verse Psalm 1:1: {r.status_code} - {r.json()}")

def test_save_chapter():
    """Test saving entire chapter"""
    book_id = 19  # Psalms
    chapter = 23
    r = requests.post(f"{BASE_URL}/user-verses/{USER_ID}/chapters/{book_id}/{chapter}")
    logger.info(f"Save Psalm 23: {r.status_code} - {r.json()}")

def test_clear_chapter():
    """Test clearing a chapter"""
    book_id = 19  # Psalms
    chapter = 23
    r = requests.delete(f"{BASE_URL}/user-verses/{USER_ID}/chapters/{book_id}/{chapter}")
    logger.info(f"Clear Psalm 23: {r.status_code} - {r.json()}")

def test_update_user_preferences():
    """Test updating user preferences including apocrypha"""
    data = {
        "first_name": "Test",
        "last_name": "User",
        "denomination": "Non-denominational",
        "preferred_bible": "ESV",
        "include_apocrypha": True
    }
    r = requests.put(f"{BASE_URL}/users/{USER_ID}", json=data)
    logger.info(f"Update user preferences: {r.status_code}")
    if r.status_code == 200:
        user = r.json()
        logger.info(f"Updated include_apocrypha: {user.get('include_apocrypha')}")

if __name__ == "__main__":
    logger.info("Testing Well Versed API with numerical book IDs...")
    try:
        test_health()
        test_get_user()
        test_get_verses()
        test_save_verse()
        test_save_chapter()
        test_clear_chapter()
        test_update_user_preferences()
        logger.info("All tests passed!")
    except Exception as e:
        logger.error(f"Test failed: {e}")