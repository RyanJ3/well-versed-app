from typing import List, Dict, Optional
from database import DatabaseConnection
from utils.performance import track_queries
from utils.batch_loader import BatchLoader
import logging

logger = logging.getLogger(__name__)

class CourseRepository:
    """Optimized repository for course data access"""

    def __init__(self, db: DatabaseConnection):
        self.db = db

    @track_queries(max_queries=3)
    def get_enrolled_courses(self, user_id: int) -> List[Dict]:
        """Get all enrolled courses with tags and lesson counts in exactly 3 queries"""
        courses_query = """
            SELECT
                w.course_id,
                w.user_id as creator_id,
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
        tags_by_course = BatchLoader.load_one_to_many(
            db=self.db,
            parent_ids=course_ids,
            query="""
                SELECT m.course_id, t.tag_name
                FROM course_tag_map m
                JOIN course_tags t ON m.tag_id = t.tag_id
                WHERE m.course_id = ANY(%s)
                ORDER BY m.course_id, t.tag_name
            """,
            parent_key='course_id',
            child_key='tag_name'
        )

        progress_query = """
            SELECT 
                course_id,
                current_lesson_position,
                lessons_completed,
                completed_at
            FROM course_enrollments
            WHERE user_id = %s AND course_id = ANY(%s)
        """
        progress_data = self.db.fetch_all(progress_query, (user_id, course_ids))
        progress_by_course = {p['course_id']: p for p in progress_data}

        results = []
        for course in courses:
            course_id = course["course_id"]
            progress = progress_by_course.get(course_id, {})
            results.append({
                "id": course_id,
                "creator_id": course.get("creator_id") or course["user_id"],
                "creator_name": course["creator_name"],
                "title": course["name"],
                "description": course["description"],
                "thumbnail_url": course.get("thumbnail_url"),
                "is_public": course["is_public"],
                "created_at": course["created_at"].isoformat(),
                "updated_at": course["updated_at"].isoformat(),
                "lesson_count": course["lesson_count"],
                "enrolled_count": course.get("enrolled_count", 0),
                "tags": tags_by_course.get(course_id, []),
                "enrolled_at": course["enrolled_at"].isoformat(),
                "progress": {
                    "current_lesson_position": progress.get("current_lesson_position", 0),
                    "lessons_completed": progress.get("lessons_completed", 0),
                    "completed_at": progress.get("completed_at"),
                    "completion_percentage": round(
                        (progress.get("lessons_completed", 0) / course["lesson_count"] * 100)
                        if course["lesson_count"] > 0 else 0,
                        1
                    )
                }
            })
        return results

    @track_queries(max_queries=3)
    def get_course_with_lessons(self, course_id: int, user_id: Optional[int] = None) -> Optional[Dict]:
        """Get course details with lessons and user progress in 3 queries"""
        course_query = """
            SELECT
                c.course_id,
                c.user_id,
                u.name as creator_name,
                c.name,
                c.description,
                c.thumbnail_url,
                c.is_public,
                c.created_at,
                c.updated_at,
                COUNT(DISTINCT e.user_id) as enrolled_count
            FROM courses c
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN course_enrollments e ON c.course_id = e.course_id
            WHERE c.course_id = %s
            GROUP BY c.course_id, u.name
        """
        course = self.db.fetch_one(course_query, (course_id,))
        if not course:
            return None

        combined_query = """
            WITH course_lessons_data AS (
                SELECT 
                    'lesson' as data_type,
                    l.lesson_id::text as id,
                    l.position::text as sort_key,
                    l.title,
                    l.description,
                    l.content_type,
                    l.content_data::text,
                    l.flashcards_required::text,
                    l.created_at::text
                FROM course_lessons l
                WHERE l.course_id = %s
            ),
            course_tags_data AS (
                SELECT 
                    'tag' as data_type,
                    t.tag_name as id,
                    '0' as sort_key,
                    t.tag_name as title,
                    NULL as description,
                    NULL as content_type,
                    NULL as content_data,
                    NULL as flashcards_required,
                    NULL as created_at
                FROM course_tag_map m
                JOIN course_tags t ON m.tag_id = t.tag_id
                WHERE m.course_id = %s
            )
            SELECT * FROM course_lessons_data
            UNION ALL
            SELECT * FROM course_tags_data
            ORDER BY data_type, sort_key
        """
        combined_data = self.db.fetch_all(combined_query, (course_id, course_id))
        lessons = []
        tags = []
        for row in combined_data:
            if row['data_type'] == 'lesson':
                lessons.append({
                    'id': int(row['id']),
                    'position': int(row['sort_key']),
                    'title': row['title'],
                    'description': row['description'],
                    'content_type': row['content_type'],
                    'content_data': row['content_data'],
                    'flashcards_required': int(row['flashcards_required'] or 0),
                    'created_at': row['created_at']
                })
            else:
                tags.append(row['title'])

        user_progress = None
        if user_id:
            progress_query = """
                SELECT 
                    enrolled_at,
                    current_lesson_id,
                    current_lesson_position,
                    lessons_completed,
                    last_accessed,
                    completed_at
                FROM course_enrollments
                WHERE course_id = %s AND user_id = %s
            """
            progress = self.db.fetch_one(progress_query, (course_id, user_id))
            if progress:
                user_progress = {
                    'enrolled_at': progress['enrolled_at'].isoformat(),
                    'current_lesson_id': progress['current_lesson_id'],
                    'current_lesson_position': progress['current_lesson_position'],
                    'lessons_completed': progress['lessons_completed'],
                    'last_accessed': progress['last_accessed'].isoformat() if progress['last_accessed'] else None,
                    'completed_at': progress['completed_at'].isoformat() if progress['completed_at'] else None,
                    'completion_percentage': round(
                        (progress['lessons_completed'] / len(lessons) * 100) if lessons else 0,
                        1
                    )
                }

        return {
            'id': course['course_id'],
            'creator_id': course['user_id'],
            'creator_name': course['creator_name'],
            'title': course['name'],
            'description': course['description'],
            'thumbnail_url': course['thumbnail_url'],
            'is_public': course['is_public'],
            'created_at': course['created_at'].isoformat(),
            'updated_at': course['updated_at'].isoformat(),
            'enrolled_count': course['enrolled_count'],
            'tags': tags,
            'lessons': lessons,
            'lesson_count': len(lessons),
            'is_enrolled': user_progress is not None,
            'user_progress': user_progress
        }

    @track_queries(max_queries=1)
    def create_course_with_tags(self, course_data: Dict) -> Dict:
        """Create a course with tags in a single transaction"""
        with self.db.get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO courses (user_id, name, description, thumbnail_url, is_public)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING course_id, created_at, updated_at
                """, (
                    course_data['user_id'],
                    course_data['name'],
                    course_data.get('description'),
                    course_data.get('thumbnail_url'),
                    course_data.get('is_public', False)
                ))
                result = cur.fetchone()
                course_id = result[0]
                tags = course_data.get('tags', [])
                if tags:
                    cur.execute("""
                        INSERT INTO course_tags (tag_name)
                        SELECT DISTINCT unnest(%s::text[])
                        ON CONFLICT (tag_name) DO NOTHING
                    """, (tags,))
                    cur.execute("""
                        INSERT INTO course_tag_map (course_id, tag_id)
                        SELECT %s, t.tag_id
                        FROM course_tags t
                        WHERE t.tag_name = ANY(%s)
                    """, (course_id, tags))
                cur.execute("SELECT name FROM users WHERE user_id = %s", (course_data['user_id'],))
                creator_name = cur.fetchone()[0]
                conn.commit()
                return {
                    'id': course_id,
                    'creator_id': course_data['user_id'],
                    'creator_name': creator_name,
                    'title': course_data['name'],
                    'description': course_data.get('description'),
                    'thumbnail_url': course_data.get('thumbnail_url'),
                    'is_public': course_data.get('is_public', False),
                    'created_at': result[1].isoformat(),
                    'updated_at': result[2].isoformat(),
                    'lesson_count': 0,
                    'enrolled_count': 0,
                    'tags': tags
                }

    def get_public_courses(self, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Get public courses with minimal queries"""
        query = """
            SELECT 
                c.course_id,
                c.user_id as creator_id,
                u.name as creator_name,
                c.name,
                c.description,
                c.thumbnail_url,
                c.is_public,
                c.created_at,
                c.updated_at,
                COUNT(DISTINCT l.lesson_id) as lesson_count,
                COUNT(DISTINCT e.user_id) as enrolled_count,
                ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
            FROM courses c
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN course_lessons l ON c.course_id = l.course_id
            LEFT JOIN course_enrollments e ON c.course_id = e.course_id
            LEFT JOIN course_tag_map m ON c.course_id = m.course_id
            LEFT JOIN course_tags t ON m.tag_id = t.tag_id
            WHERE c.is_public = TRUE
            GROUP BY c.course_id, u.user_id, u.name
            ORDER BY c.created_at DESC
            OFFSET %s LIMIT %s
        """
        return self.db.fetch_all(query, (skip, limit))

    def get_user_enrollment(self, course_id: int, user_id: int) -> Optional[Dict]:
        """Check if user is enrolled in course"""
        query = """
            SELECT * FROM course_enrollments 
            WHERE course_id = %s AND user_id = %s
        """
        return self.db.fetch_one(query, (course_id, user_id))

    def enroll_user(self, course_id: int, user_id: int) -> Dict:
        """Enroll user in course"""
        query = """
            INSERT INTO course_enrollments (user_id, course_id)
            VALUES (%s, %s)
            RETURNING *
        """
        result = self.db.fetch_one(query, (user_id, course_id), commit=True)
        return {
            'user_id': result['user_id'],
            'course_id': result['course_id'],
            'enrolled_at': result['enrolled_at'].isoformat(),
            'current_lesson_position': result['current_lesson_position'],
            'lessons_completed': result['lessons_completed'],
            'last_accessed': result['last_accessed'].isoformat() if result['last_accessed'] else None,
            'completed_at': result['completed_at'].isoformat() if result['completed_at'] else None
        }

