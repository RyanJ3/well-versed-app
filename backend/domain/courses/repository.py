from typing import List, Dict
from database import DatabaseConnection
from utils.performance import track_queries


class CourseRepository:
    """Optimized repository for course data access"""

    def __init__(self, db: DatabaseConnection):
        self.db = db

    @track_queries
    def get_enrolled_courses(self, user_id: int) -> List[Dict]:
        """Get all enrolled courses with tags and lesson counts in 2 queries"""

        courses_query = """
            SELECT 
                w.course_id,
                w.user_id,
                u.name AS creator_name,
                w.name,
                w.description,
                w.thumbnail_url,
                w.is_public,
                w.created_at,
                w.updated_at,
                e.enrolled_at,
                COUNT(DISTINCT l.lesson_id) AS lesson_count,
                COUNT(DISTINCT e2.user_id) AS enrolled_count
            FROM course_enrollments e
            JOIN courses w ON e.course_id = w.course_id
            JOIN users u ON w.user_id = u.user_id
            LEFT JOIN course_lessons l ON w.course_id = l.course_id
            LEFT JOIN course_enrollments e2 ON w.course_id = e2.course_id
            WHERE e.user_id = %s
            GROUP BY w.course_id, w.user_id, u.name, w.name, w.description,
                     w.thumbnail_url, w.is_public, w.created_at, w.updated_at, e.enrolled_at
            ORDER BY e.enrolled_at DESC
        """

        courses = self.db.fetch_all(courses_query, (user_id,))
        if not courses:
            return []

        course_ids = [c["course_id"] for c in courses]
        tags_query = """
            SELECT m.course_id, t.tag_name
            FROM course_tag_map m
            JOIN course_tags t ON m.tag_id = t.tag_id
            WHERE m.course_id = ANY(%s)
            ORDER BY m.course_id, t.tag_name
        """

        tags_data = self.db.fetch_all(tags_query, (course_ids,))

        tags_by_course: Dict[int, List[str]] = {}
        for row in tags_data:
            tags_by_course.setdefault(row["course_id"], []).append(row["tag_name"])

        results = []
        for course in courses:
            results.append(
                {
                    "id": course["course_id"],
                    "creator_id": course["user_id"],
                    "creator_name": course["creator_name"],
                    "title": course["name"],
                    "description": course["description"],
                    "thumbnail_url": course.get("thumbnail_url"),
                    "is_public": course["is_public"],
                    "created_at": course["created_at"].isoformat(),
                    "updated_at": course["updated_at"].isoformat(),
                    "lesson_count": course["lesson_count"],
                    "enrolled_count": course.get("enrolled_count", 0),
                    "tags": tags_by_course.get(course["course_id"], []),
                }
            )

        return results
