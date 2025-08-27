import pytest
from datetime import datetime
import logging
from unittest.mock import patch, MagicMock
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from database import DatabaseConnection
from domain.feature_requests.repository import FeatureRequestRepository
from domain.courses.repository import CourseRepository
from domain.verses.repository import VerseRepository
from utils.performance import get_performance_report, reset_performance_tracking
import warnings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestQueryOptimization:
    """Test suite to validate query count limits"""

    @pytest.fixture
    def mock_db(self):
        db = MagicMock(spec=DatabaseConnection)
        db.query_count = 0
        db.query_log = []
        def track_query(query, params=()):
            db.query_count += 1
            db.query_log.append(query)
            return []
        db.fetch_all.side_effect = lambda q, p: track_query(q, p)
        db.fetch_one.side_effect = lambda q, p: track_query(q, p) or None
        db.execute.side_effect = lambda q, p: track_query(q, p)
        return db

    def test_feature_requests_query_limit(self, mock_db):
        repo = FeatureRequestRepository(mock_db)
        def fo(q, p):
            mock_db.query_count += 1
            mock_db.query_log.append(q)
            return {"total": 10}
        mock_db.fetch_one.side_effect = fo
        responses = [
            [{"id": 1, "title": "Test", "tags": []}],
            [{"request_id": 1, "tag_name": "test-tag"}]
        ]
        def fa(query, params):
            return_track = responses.pop(0)
            mock_db.query_count += 1
            mock_db.query_log.append(query)
            return return_track
        mock_db.fetch_all.side_effect = fa
        reset_performance_tracking()
        with warnings.catch_warnings(record=True) as w:
            requests, total = repo.get_requests(limit=10, offset=0)
            assert len(w) == 0
            assert mock_db.query_count <= 3

    def test_course_repository_query_limit(self, mock_db):
        repo = CourseRepository(mock_db)
        now = datetime.now()
        responses = [
            [{"course_id": 1, "user_id": 1, "creator_name": "Creator", "name": "Test Course", "description": "Desc", "thumbnail_url": None, "is_public": True, "created_at": now, "updated_at": now, "enrolled_at": now, "lesson_count": 5, "enrolled_count": 1}],
            [{"course_id": 1, "tag_name": "test"}],
            [{"course_id": 1, "lessons_completed": 2}]
        ]
        def fa(query, params):
            ret = responses.pop(0)
            mock_db.query_count += 1
            mock_db.query_log.append(query)
            return ret
        mock_db.fetch_all.side_effect = fa
        reset_performance_tracking()
        with warnings.catch_warnings(record=True) as w:
            courses = repo.get_enrolled_courses(user_id=1)
            assert len(w) == 0
            assert mock_db.query_count <= 3

    def test_verse_repository_batch_operations(self, mock_db):
        repo = VerseRepository(mock_db)
        verses = [{"id": i} for i in range(1, 21)]
        def fa(query, params):
            mock_db.query_count += 1
            mock_db.query_log.append(query)
            return verses
        mock_db.fetch_all.side_effect = fa
        reset_performance_tracking()
        with warnings.catch_warnings(record=True) as w:
            result = repo.save_chapter(user_id=1, book_id=1, chapter_num=1)
            assert len(w) == 0
            assert mock_db.query_count == 2
            assert result["verses_count"] == 20

    def test_performance_report_generation(self, mock_db):
        repo = FeatureRequestRepository(mock_db)
        def fo(q, p):
            mock_db.query_count += 1
            mock_db.query_log.append(q)
            return {"total": 5}
        mock_db.fetch_one.side_effect = fo
        responses = [[{"id": 1}], [{"request_id": 1, "tag_name": "t"}]] * 5
        def fa(q, p):
            mock_db.query_count += 1
            mock_db.query_log.append(q)
            return responses.pop(0)
        mock_db.fetch_all.side_effect = fa
        reset_performance_tracking()
        for _ in range(5):
            repo.get_trending_requests(limit=5)
        report = get_performance_report()
        assert "FeatureRequestRepository.get_trending_requests" in report
        stats = report["FeatureRequestRepository.get_trending_requests"]
        assert stats["total_calls"] == 5
        assert stats["avg_queries_per_call"] == 2.0

def test_batch_loader_utilities():
    from utils.batch_loader import BatchLoader
    items = list(range(2500))
    chunks = BatchLoader.chunk_list(items, chunk_size=1000)
    assert len(chunks) == 3
    assert len(chunks[0]) == 1000
    assert len(chunks[1]) == 1000
    assert len(chunks[2]) == 500
