# backend/test_api.py
import requests
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    return r.json()

def test_get_verses():
    """Test get user verses"""
    r = requests.get(f"{BASE_URL}/user-verses/{USER_ID}")
    logger.info(f"Get verses: {r.status_code}")
    verses = r.json()
    logger.info(f"Found {len(verses)} memorized verses")
    for v in verses[:3]:
        logger.info(f"  - {v['verse']['verse_id']}")
    return verses

def test_save_verse():
    """Test saving a verse"""
    verse_code = "PSAL-001-001"
    data = {"practice_count": 1}
    r = requests.put(f"{BASE_URL}/user-verses/{USER_ID}/{verse_code}", json=data)
    logger.info(f"Save verse {verse_code}: {r.status_code} - {r.json()}")

def test_save_chapter():
    """Test saving entire chapter"""
    book_id = "PSAL"
    chapter = 23
    r = requests.post(f"{BASE_URL}/user-verses/{USER_ID}/chapters/{book_id}/{chapter}")
    logger.info(f"Save chapter {book_id} {chapter}: {r.status_code} - {r.json()}")

def test_clear_chapter():
    """Test clearing a chapter"""
    book_id = "PSAL"
    chapter = 23
    r = requests.delete(f"{BASE_URL}/user-verses/{USER_ID}/chapters/{book_id}/{chapter}")
    logger.info(f"Clear chapter {book_id} {chapter}: {r.status_code} - {r.json()}")

if __name__ == "__main__":
    logger.info("Testing Well Versed API...")
    try:
        test_health()
        test_get_user()
        test_get_verses()
        test_save_verse()
        test_save_chapter()
        test_clear_chapter()
        logger.info("All tests passed!")
    except Exception as e:
        logger.error(f"Test failed: {e}")