# backend/domain/courses/repository.py

from typing import List, Optional, Dict
import json
from datetime import datetime
from database import DatabaseConnection
from .models import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    EnrolledCourseResponse,
    LessonCreate,
    LessonUpdate,
    LessonResponse,
    UserCourseProgress,
    UserLessonProgress,
    LessonFlashcard,
    CourseEnrollment
)


class CourseRepository:
    def __init__(self, db: DatabaseConnection):
        self.db = db

    # ========== Course CRUD ==========

    def create_course(self, data: CourseCreate, user_id: int) -> CourseResponse:
        """Create a new course"""
        with self.db.get_db() as conn:
            with conn.cursor() as cur:
                # Insert course
                cur.execute(
                    """
                    INSERT INTO courses (user_id, name, description, thumbnail_url, is_public)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING course_id, created_at, updated_at
                    """,
                    (user_id, data.title, data.description, data.thumbnail_url, data.is_public)
                )
                row = cur.fetchone()
                course_id = row[0]
                created_at = row[1].isoformat()
                updated_at = row[2].isoformat()

                # Get creator name
                cur.execute("SELECT name FROM users WHERE user_id = %s", (user_id,))
                creator_name = cur.fetchone()[0]

                # Handle tags
                for tag in data.tags:
                    cur.execute(
                        """
                        INSERT INTO course_tags (tag_name) VALUES (%s) 
                        ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name 
                        RETURNING tag_id
                        """,
                        (tag,)
                    )
                    tag_id = cur.fetchone()[0]
                    cur.execute(
                        """
                        INSERT INTO course_tag_map (course_id, tag_id) VALUES (%s, %s) 
                        ON CONFLICT DO NOTHING
                        """,
                        (course_id, tag_id)
                    )
                conn.commit()

        return CourseResponse(
            id=course_id,
            creator_id=user_id,
            creator_name=creator_name,
            title=data.title,
            description=data.description,
            thumbnail_url=data.thumbnail_url,
            is_public=data.is_public,
            created_at=created_at,
            updated_at=updated_at,
            lesson_count=0,
            enrolled_count=0,
            tags=data.tags
        )

    def list_public_courses(
        self, 
        page: int = 1, 
        per_page: int = 20,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> List[CourseResponse]:
        """List public courses with pagination and filtering"""
        offset = (page - 1) * per_page
        
        where_clauses = ["w.is_public = TRUE"]
        params = []
        
        if search:
            where_clauses.append("(w.name ILIKE %s OR w.description ILIKE %s)")
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern])
        
        if tags:
            where_clauses.append("t.tag_name = ANY(%s)")
            params.append(tags)
        
        where_clause = "WHERE " + " AND ".join(where_clauses)
        
        query = f"""
            SELECT DISTINCT w.course_id, w.user_id, u.name AS creator_name, w.name, 
                   w.description, w.thumbnail_url, w.is_public, w.created_at, w.updated_at,
                   COUNT(DISTINCT l.lesson_id) as lesson_count,
                   COUNT(DISTINCT e.user_id) as enrolled_count,
                   ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
            FROM courses w
            JOIN users u ON w.user_id = u.user_id
            LEFT JOIN course_lessons l ON w.course_id = l.course_id
            LEFT JOIN course_enrollments e ON w.course_id = e.course_id
            LEFT JOIN course_tag_map m ON w.course_id = m.course_id
            LEFT JOIN course_tags t ON m.tag_id = t.tag_id
            {where_clause}
            GROUP BY w.course_id, w.user_id, u.name, w.name, w.description, 
                     w.thumbnail_url, w.is_public, w.created_at, w.updated_at
            ORDER BY w.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        rows = self.db.fetch_all(query, tuple(params))
        
        return [self._row_to_course_response(row) for row in rows]

    def count_public_courses(
        self,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> int:
        """Count total public courses matching filters"""
        where_clauses = ["w.is_public = TRUE"]
        params = []
        
        if search:
            where_clauses.append("(w.name ILIKE %s OR w.description ILIKE %s)")
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern])
        
        if tags:
            where_clauses.append("EXISTS (SELECT 1 FROM course_tag_map m JOIN course_tags t ON m.tag_id = t.tag_id WHERE m.course_id = w.course_id AND t.tag_name = ANY(%s))")
            params.append(tags)
        
        where_clause = "WHERE " + " AND ".join(where_clauses)
        
        query = f"""
            SELECT COUNT(DISTINCT w.course_id) as count
            FROM courses w
            {where_clause}
        """
        
        result = self.db.fetch_one(query, tuple(params))
        return result["count"] if result else 0

    def list_user_courses(self, user_id: int) -> List[CourseResponse]:
        """List courses created by a user"""
        query = """
            SELECT w.course_id, w.user_id, u.name AS creator_name, w.name, w.description,
                   w.thumbnail_url, w.is_public, w.created_at, w.updated_at,
                   COUNT(DISTINCT l.lesson_id) as lesson_count,
                   COUNT(DISTINCT e.user_id) as enrolled_count,
                   ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
            FROM courses w
            JOIN users u ON w.user_id = u.user_id
            LEFT JOIN course_lessons l ON w.course_id = l.course_id
            LEFT JOIN course_enrollments e ON w.course_id = e.course_id
            LEFT JOIN course_tag_map m ON w.course_id = m.course_id
            LEFT JOIN course_tags t ON m.tag_id = t.tag_id
            WHERE w.user_id = %s
            GROUP BY w.course_id, w.user_id, u.name, w.name, w.description, 
                     w.thumbnail_url, w.is_public, w.created_at, w.updated_at
            ORDER BY w.created_at DESC
        """
        rows = self.db.fetch_all(query, (user_id,))
        return [self._row_to_course_response(row) for row in rows]

    def get_enrolled_courses(self, user_id: int) -> List[CourseResponse]:
        """Get all courses a user is enrolled in"""
        query = """
            WITH enrolled_courses AS (
                SELECT w.course_id, w.user_id, u.name AS creator_name, w.name, w.description,
                       w.thumbnail_url, w.is_public, w.created_at, w.updated_at,
                       e.last_accessed
                FROM courses w
                JOIN users u ON w.user_id = u.user_id
                JOIN course_enrollments e ON w.course_id = e.course_id AND e.user_id = %s
            )
            SELECT ec.course_id, ec.user_id, ec.creator_name, ec.name, ec.description,
                   ec.thumbnail_url, ec.is_public, ec.created_at, ec.updated_at,
                   ec.last_accessed,
                   COUNT(DISTINCT l.lesson_id) as lesson_count,
                   COUNT(DISTINCT e2.user_id) as enrolled_count,
                   ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
            FROM enrolled_courses ec
            LEFT JOIN course_lessons l ON ec.course_id = l.course_id
            LEFT JOIN course_enrollments e2 ON ec.course_id = e2.course_id
            LEFT JOIN course_tag_map m ON ec.course_id = m.course_id
            LEFT JOIN course_tags t ON m.tag_id = t.tag_id
            GROUP BY ec.course_id, ec.user_id, ec.creator_name, ec.name, ec.description, 
                     ec.thumbnail_url, ec.is_public, ec.created_at, ec.updated_at, ec.last_accessed
            ORDER BY ec.last_accessed DESC
        """
        rows = self.db.fetch_all(query, (user_id,))
        return [self._row_to_course_response(row) for row in rows]
    
    def get_enrolled_courses_with_progress(self, user_id: int) -> List[EnrolledCourseResponse]:
        """Get all courses a user is enrolled in with progress data"""
        query = """
            WITH enrolled_courses AS (
                SELECT c.course_id, c.user_id as creator_id, u.name AS creator_name, 
                       c.name as title, c.description, c.thumbnail_url, c.is_public, 
                       c.created_at, c.updated_at,
                       e.current_lesson_position, e.lessons_completed, 
                       e.enrolled_at, e.last_accessed
                FROM courses c
                JOIN users u ON c.user_id = u.user_id
                JOIN course_enrollments e ON c.course_id = e.course_id AND e.user_id = %s
            )
            SELECT ec.course_id, ec.creator_id, ec.creator_name, ec.title, ec.description,
                   ec.thumbnail_url, ec.is_public, ec.created_at, ec.updated_at,
                   ec.current_lesson_position, ec.lessons_completed, ec.enrolled_at, ec.last_accessed,
                   COUNT(DISTINCT l.lesson_id) as lesson_count,
                   COUNT(DISTINCT e2.user_id) as enrolled_count,
                   ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags,
                   CASE 
                     WHEN COUNT(DISTINCT l.lesson_id) > 0 
                     THEN ROUND((ec.lessons_completed::FLOAT / COUNT(DISTINCT l.lesson_id)) * 100)::INT
                     ELSE 0
                   END as progress_percentage
            FROM enrolled_courses ec
            LEFT JOIN course_lessons l ON ec.course_id = l.course_id
            LEFT JOIN course_enrollments e2 ON ec.course_id = e2.course_id
            LEFT JOIN course_tag_map m ON ec.course_id = m.course_id
            LEFT JOIN course_tags t ON m.tag_id = t.tag_id
            GROUP BY ec.course_id, ec.creator_id, ec.creator_name, ec.title, ec.description, 
                     ec.thumbnail_url, ec.is_public, ec.created_at, ec.updated_at,
                     ec.current_lesson_position, ec.lessons_completed, ec.enrolled_at, ec.last_accessed
            ORDER BY ec.last_accessed DESC
        """
        rows = self.db.fetch_all(query, (user_id,))
        return [self._row_to_enrolled_course_response(row) for row in rows]

    def get_course(self, course_id: int) -> Optional[CourseResponse]:
        """Get a single course by ID"""
        query = """
            SELECT w.course_id, w.user_id, u.name as creator_name, w.name, w.description,
                   w.thumbnail_url, w.is_public, w.created_at, w.updated_at,
                   COUNT(DISTINCT l.lesson_id) as lesson_count,
                   COUNT(DISTINCT e.user_id) as enrolled_count,
                   ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
            FROM courses w
            JOIN users u ON w.user_id = u.user_id
            LEFT JOIN course_lessons l ON w.course_id = l.course_id
            LEFT JOIN course_enrollments e ON w.course_id = e.course_id
            LEFT JOIN course_tag_map m ON w.course_id = m.course_id
            LEFT JOIN course_tags t ON m.tag_id = t.tag_id
            WHERE w.course_id = %s
            GROUP BY w.course_id, w.user_id, u.name, w.name, w.description, 
                     w.thumbnail_url, w.is_public, w.created_at, w.updated_at
        """
        row = self.db.fetch_one(query, (course_id,))
        return self._row_to_course_response(row) if row else None

    def update_course(self, course_id: int, updates: CourseUpdate) -> CourseResponse:
        """Update a course"""
        update_fields = []
        params = []
        
        if updates.title is not None:
            update_fields.append("name = %s")
            params.append(updates.title)
        if updates.description is not None:
            update_fields.append("description = %s")
            params.append(updates.description)
        if updates.thumbnail_url is not None:
            update_fields.append("thumbnail_url = %s")
            params.append(updates.thumbnail_url)
        if updates.is_public is not None:
            update_fields.append("is_public = %s")
            params.append(updates.is_public)
        
        if update_fields:
            params.append(course_id)
            query = f"""
                UPDATE courses 
                SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP 
                WHERE course_id = %s
            """
            self.db.execute(query, tuple(params))
        
        # Update tags if provided
        if updates.tags is not None:
            with self.db.get_db() as conn:
                with conn.cursor() as cur:
                    # Remove existing tags
                    cur.execute("DELETE FROM course_tag_map WHERE course_id = %s", (course_id,))
                    
                    # Add new tags
                    for tag in updates.tags:
                        cur.execute(
                            """
                            INSERT INTO course_tags (tag_name) VALUES (%s) 
                            ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name 
                            RETURNING tag_id
                            """,
                            (tag,)
                        )
                        tag_id = cur.fetchone()[0]
                        cur.execute(
                            "INSERT INTO course_tag_map (course_id, tag_id) VALUES (%s, %s)",
                            (course_id, tag_id)
                        )
                    conn.commit()
        
        return self.get_course(course_id)

    def delete_course(self, course_id: int) -> None:
        """Delete a course"""
        self.db.execute("DELETE FROM courses WHERE course_id = %s", (course_id,))

    # ========== Enrollment Methods ==========

    def is_user_enrolled(self, course_id: int, user_id: int) -> bool:
        """Check if user is enrolled in a course"""
        result = self.db.fetch_one(
            "SELECT 1 as exists FROM course_enrollments WHERE course_id = %s AND user_id = %s",
            (course_id, user_id)
        )
        return result is not None

    def enroll_user(self, course_id: int, user_id: int) -> UserCourseProgress:
        """Enroll a user in a course"""
        with self.db.get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO course_enrollments (user_id, course_id)
                    VALUES (%s, %s)
                    RETURNING user_id, course_id, current_lesson_id, current_lesson_position,
                              lessons_completed, enrolled_at, last_accessed, completed_at
                    """,
                    (user_id, course_id)
                )
                row = cur.fetchone()
                conn.commit()
                
        return UserCourseProgress(
            user_id=row[0],
            course_id=row[1],
            current_lesson_id=row[2],
            current_lesson_position=row[3],
            lessons_completed=row[4],
            enrolled_at=row[5].isoformat(),
            last_accessed=row[6].isoformat(),
            completed_at=row[7].isoformat() if row[7] else None
        )

    def unenroll_user(self, course_id: int, user_id: int) -> None:
        """Unenroll a user from a course"""
        self.db.execute(
            "DELETE FROM course_enrollments WHERE course_id = %s AND user_id = %s",
            (course_id, user_id)
        )

    def get_user_course_progress(self, course_id: int, user_id: int) -> Optional[UserCourseProgress]:
        """Get user's progress in a course"""
        row = self.db.fetch_one(
            """
            SELECT user_id, course_id, current_lesson_id, current_lesson_position,
                   lessons_completed, enrolled_at, last_accessed, completed_at
            FROM course_enrollments
            WHERE course_id = %s AND user_id = %s
            """,
            (course_id, user_id)
        )
        
        if not row:
            return None
            
        return UserCourseProgress(
            user_id=row["user_id"],
            course_id=row["course_id"],
            current_lesson_id=row.get("current_lesson_id"),
            current_lesson_position=row["current_lesson_position"],
            lessons_completed=row["lessons_completed"],
            enrolled_at=row["enrolled_at"].isoformat(),
            last_accessed=row["last_accessed"].isoformat(),
            completed_at=row["completed_at"].isoformat() if row.get("completed_at") else None
        )

    # ========== Lesson Methods ==========

    def get_course_lessons(self, course_id: int) -> List[LessonResponse]:
        """Get all lessons for a course using new normalized structure"""
        query = """
            SELECT 
                cl.lesson_id, cl.course_id, cl.position, cl.title, cl.description, 
                cl.content_type, cl.created_at,
                
                -- Video lesson data
                vl.youtube_url, vl.duration_minutes,
                
                -- Article lesson data  
                al.article_text, al.reading_time_minutes,
                
                -- External lesson data
                el.external_url, el.external_title, el.external_description,
                
                -- Quiz lesson data
                ql.verse_count, ql.pass_threshold, ql.randomize_questions, ql.time_limit_minutes
                
            FROM course_lessons cl
            LEFT JOIN video_lessons vl ON cl.lesson_id = vl.lesson_id
            LEFT JOIN article_lessons al ON cl.lesson_id = al.lesson_id  
            LEFT JOIN external_lessons el ON cl.lesson_id = el.lesson_id
            LEFT JOIN quiz_lessons ql ON cl.lesson_id = ql.lesson_id
            WHERE cl.course_id = %s
            ORDER BY cl.position
        """
        rows = self.db.fetch_all(query, (course_id,))
        return [self._row_to_lesson_response_normalized(row) for row in rows]

    def get_lesson(self, lesson_id: int) -> Optional[LessonResponse]:
        """Get a single lesson using new normalized structure"""
        row = self.db.fetch_one(
            """
            SELECT 
                cl.lesson_id, cl.course_id, cl.position, cl.title, cl.description, 
                cl.content_type, cl.created_at,
                
                -- Video lesson data
                vl.youtube_url, vl.duration_minutes,
                
                -- Article lesson data  
                al.article_text, al.reading_time_minutes,
                
                -- External lesson data
                el.external_url, el.external_title, el.external_description,
                
                -- Quiz lesson data
                ql.verse_count, ql.pass_threshold, ql.randomize_questions, ql.time_limit_minutes
                
            FROM course_lessons cl
            LEFT JOIN video_lessons vl ON cl.lesson_id = vl.lesson_id
            LEFT JOIN article_lessons al ON cl.lesson_id = al.lesson_id  
            LEFT JOIN external_lessons el ON cl.lesson_id = el.lesson_id
            LEFT JOIN quiz_lessons ql ON cl.lesson_id = ql.lesson_id
            WHERE cl.lesson_id = %s
            """,
            (lesson_id,)
        )
        return self._row_to_lesson_response_normalized(row) if row else None

    def create_lesson(self, course_id: int, data: LessonCreate) -> LessonResponse:
        """Create a new lesson using normalized structure"""
        position = data.position
        if position is None:
            # Get next position
            result = self.db.fetch_one(
                "SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM course_lessons WHERE course_id = %s",
                (course_id,)
            )
            position = result["next_position"]
        
        with self.db.get_db() as conn:
            with conn.cursor() as cur:
                # Insert base lesson record
                cur.execute(
                    """
                    INSERT INTO course_lessons (course_id, position, title, description, content_type)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING lesson_id, created_at
                    """,
                    (course_id, position, data.title, data.description, data.content_type)
                )
                lesson_row = cur.fetchone()
                lesson_id = lesson_row[0]
                created_at = lesson_row[1]
                
                # Insert type-specific data
                content_data = data.content_data or {}
                
                if data.content_type == "video":
                    cur.execute(
                        """
                        INSERT INTO video_lessons (lesson_id, youtube_url, duration_minutes)
                        VALUES (%s, %s, %s)
                        """,
                        (
                            lesson_id,
                            content_data.get("youtube_url", ""),
                            content_data.get("duration_minutes")
                        )
                    )
                elif data.content_type == "article":
                    cur.execute(
                        """
                        INSERT INTO article_lessons (lesson_id, article_text, reading_time_minutes)
                        VALUES (%s, %s, %s)
                        """,
                        (
                            lesson_id,
                            content_data.get("article_text", ""),
                            content_data.get("reading_time_minutes")
                        )
                    )
                elif data.content_type == "external_link":
                    cur.execute(
                        """
                        INSERT INTO external_lessons (lesson_id, external_url, external_title, external_description)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (
                            lesson_id,
                            content_data.get("external_url", ""),
                            content_data.get("external_title", ""),
                            content_data.get("external_description")
                        )
                    )
                elif data.content_type == "quiz":
                    quiz_config = content_data.get("quiz_config", {})
                    cur.execute(
                        """
                        INSERT INTO quiz_lessons (lesson_id, verse_count, pass_threshold, randomize_questions, time_limit_minutes)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (
                            lesson_id,
                            quiz_config.get("verse_count", 5),
                            quiz_config.get("pass_threshold", 85),
                            quiz_config.get("randomize", True),
                            quiz_config.get("time_limit_minutes")
                        )
                    )
                    
                    # Insert quiz flashcards if provided
                    flashcards = quiz_config.get("flashcards", [])
                    for i, flashcard in enumerate(flashcards):
                        cur.execute(
                            """
                            INSERT INTO quiz_flashcards (lesson_id, reference, verse_codes, position)
                            VALUES (%s, %s, %s, %s)
                            """,
                            (
                                lesson_id,
                                flashcard.get("reference", ""),
                                flashcard.get("verseCodes", []),
                                i
                            )
                        )
                
                conn.commit()
                
        return LessonResponse(
            id=lesson_id,
            course_id=course_id,
            position=position,
            title=data.title,
            description=data.description,
            content_type=data.content_type,
            content_data=data.content_data,
            flashcards_required=data.flashcards_required or 0,
            created_at=created_at.isoformat()
        )

    def update_lesson(self, lesson_id: int, updates: LessonUpdate) -> LessonResponse:
        """Update a lesson"""
        update_fields = []
        params = []
        
        if updates.title is not None:
            update_fields.append("title = %s")
            params.append(updates.title)
        if updates.description is not None:
            update_fields.append("description = %s")
            params.append(updates.description)
        if updates.content_type is not None:
            update_fields.append("content_type = %s")
            params.append(updates.content_type)
        if updates.content_data is not None:
            update_fields.append("content_data = %s")
            params.append(json.dumps(updates.content_data))
        if updates.flashcards_required is not None:
            update_fields.append("flashcards_required = %s")
            params.append(updates.flashcards_required)
        if updates.position is not None:
            update_fields.append("position = %s")
            params.append(updates.position)
        
        if update_fields:
            params.append(lesson_id)
            query = f"UPDATE course_lessons SET {', '.join(update_fields)} WHERE lesson_id = %s"
            self.db.execute(query, tuple(params))
        
        return self.get_lesson(lesson_id)

    def delete_lesson(self, lesson_id: int) -> None:
        """Delete a lesson"""
        self.db.execute("DELETE FROM course_lessons WHERE lesson_id = %s", (lesson_id,))

    def reorder_lessons(self, course_id: int, lesson_ids: List[int]) -> None:
        """Reorder lessons in a course"""
        with self.db.get_db() as conn:
            with conn.cursor() as cur:
                for position, lesson_id in enumerate(lesson_ids, 1):
                    cur.execute(
                        "UPDATE course_lessons SET position = %s WHERE lesson_id = %s AND course_id = %s",
                        (position, lesson_id, course_id)
                    )
                conn.commit()

    # ========== Lesson Progress Methods ==========

    def start_lesson(self, lesson_id: int, user_id: int) -> UserLessonProgress:
        """Mark a lesson as started"""
        lesson = self.get_lesson(lesson_id)
        
        with self.db.get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO lesson_progress (user_id, lesson_id, course_id, flashcards_required)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (user_id, lesson_id) DO UPDATE SET started_at = CURRENT_TIMESTAMP
                    RETURNING user_id, lesson_id, course_id, started_at, completed_at,
                              flashcards_required, flashcards_completed
                    """,
                    (user_id, lesson_id, lesson.course_id, lesson.flashcards_required)
                )
                row = cur.fetchone()
                conn.commit()
                
        return self._row_to_lesson_progress(row)

    def complete_lesson(self, lesson_id: int, user_id: int) -> UserLessonProgress:
        """Mark a lesson as completed"""
        with self.db.get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE lesson_progress 
                    SET completed_at = CURRENT_TIMESTAMP, flashcards_completed = flashcards_required
                    WHERE user_id = %s AND lesson_id = %s
                    RETURNING user_id, lesson_id, course_id, started_at, completed_at,
                              flashcards_required, flashcards_completed
                    """,
                    (user_id, lesson_id)
                )
                row = cur.fetchone()
                
                # Update course progress
                cur.execute(
                    """
                    UPDATE course_enrollments 
                    SET lessons_completed = lessons_completed + 1,
                        last_accessed = CURRENT_TIMESTAMP
                    WHERE user_id = %s AND course_id = %s
                    """,
                    (user_id, row[2])  # row[2] is course_id
                )
                conn.commit()
                
        return self._row_to_lesson_progress(row)

    def get_user_lesson_progress(self, lesson_id: int, user_id: int) -> Optional[UserLessonProgress]:
        """Get user's progress for a lesson"""
        row = self.db.fetch_one(
            """
            SELECT user_id, lesson_id, course_id, started_at, completed_at,
                   flashcards_required, flashcards_completed
            FROM lesson_progress
            WHERE user_id = %s AND lesson_id = %s
            """,
            (user_id, lesson_id)
        )
        return self._row_to_lesson_progress(row) if row else None

    # ========== Flashcard Methods ==========

    def get_lesson_flashcards(self, lesson_id: int) -> List[LessonFlashcard]:
        """Get flashcards for a quiz lesson using new normalized structure"""
        rows = self.db.fetch_all(
            """
            SELECT flashcard_id, lesson_id, reference, verse_codes, position, created_at
            FROM quiz_flashcards
            WHERE lesson_id = %s
            ORDER BY position, flashcard_id
            """,
            (lesson_id,)
        )
        
        return [
            LessonFlashcard(
                id=row["flashcard_id"],
                lesson_id=row["lesson_id"],
                front=row["reference"],  # Use reference as front
                back=", ".join(row["verse_codes"]) if row["verse_codes"] else "",  # Use verse codes as back
                created_at=row["created_at"].isoformat()
            )
            for row in rows
        ]

    def create_lesson_flashcards(self, lesson_id: int, flashcards: List[Dict]) -> List[LessonFlashcard]:
        """Create flashcards for a lesson"""
        created_flashcards = []
        
        with self.db.get_db() as conn:
            with conn.cursor() as cur:
                for fc in flashcards:
                    cur.execute(
                        """
                        INSERT INTO lesson_flashcards (lesson_id, front_content, back_content, card_type)
                        VALUES (%s, %s, %s, %s)
                        RETURNING flashcard_id, created_at
                        """,
                        (lesson_id, fc["front"], fc["back"], fc.get("card_type", "basic"))
                    )
                    row = cur.fetchone()
                    created_flashcards.append(
                        LessonFlashcard(
                            id=row[0],
                            lesson_id=lesson_id,
                            front=fc["front"],
                            back=fc["back"],
                            created_at=row[1].isoformat()
                        )
                    )
                conn.commit()
                
        return created_flashcards

    def add_flashcards_to_queue(self, lesson_id: int, user_id: int, request: Dict) -> None:
        """Add flashcards to user's study queue"""
        # This would integrate with your existing flashcard system
        # For now, just a placeholder
        pass

    def update_flashcard_requirement(self, lesson_id: int, required_count: int) -> None:
        """Update flashcard requirement for a lesson"""
        self.db.execute(
            "UPDATE course_lessons SET flashcards_required = %s WHERE lesson_id = %s",
            (required_count, lesson_id)
        )

    # ========== Tag Methods ==========

    def list_tags(self) -> List[str]:
        """Get all available course tags"""
        rows = self.db.fetch_all("SELECT tag_name FROM course_tags ORDER BY tag_name")
        return [row["tag_name"] for row in rows]

    # ========== Helper Methods ==========

    def _row_to_course_response(self, row: Dict) -> CourseResponse:
        """Convert database row to CourseResponse"""
        return CourseResponse(
            id=row["course_id"],
            creator_id=row["user_id"],
            creator_name=row["creator_name"],
            title=row["name"],
            description=row.get("description"),
            thumbnail_url=row.get("thumbnail_url"),
            is_public=row["is_public"],
            created_at=row["created_at"].isoformat(),
            updated_at=row["updated_at"].isoformat(),
            lesson_count=row.get("lesson_count", 0),
            enrolled_count=row.get("enrolled_count", 0),
            tags=row.get("tags") or []
        )
    
    def _row_to_enrolled_course_response(self, row: Dict) -> EnrolledCourseResponse:
        """Convert database row to EnrolledCourseResponse with progress data"""
        return EnrolledCourseResponse(
            id=row["course_id"],
            creator_id=row["creator_id"],
            creator_name=row["creator_name"],
            title=row["title"],
            description=row.get("description"),
            thumbnail_url=row.get("thumbnail_url"),
            is_public=row["is_public"],
            created_at=row["created_at"].isoformat(),
            updated_at=row["updated_at"].isoformat(),
            lesson_count=row.get("lesson_count", 0),
            enrolled_count=row.get("enrolled_count", 0),
            tags=row.get("tags") or [],
            progress_percentage=row.get("progress_percentage", 0),
            lessons_completed=row.get("lessons_completed", 0),
            current_lesson_position=row.get("current_lesson_position", 1),
            last_accessed=row["last_accessed"].isoformat() if row.get("last_accessed") else None,
            enrolled_at=row["enrolled_at"].isoformat() if row.get("enrolled_at") else None
        )

    def _row_to_lesson_response(self, row: Dict) -> LessonResponse:
        """Convert database row to LessonResponse (legacy for backwards compatibility)"""
        content_data = row.get("content_data")
        if content_data and isinstance(content_data, str):
            content_data = json.loads(content_data)
            
        return LessonResponse(
            id=row["lesson_id"],
            course_id=row["course_id"],
            position=row["position"],
            title=row["title"],
            description=row.get("description"),
            content_type=row["content_type"],
            content_data=content_data,
            flashcards_required=row.get("flashcards_required", 0),
            created_at=row["created_at"].isoformat()
        )
    
    def _row_to_lesson_response_normalized(self, row: Dict) -> LessonResponse:
        """Convert database row from normalized structure to LessonResponse"""
        content_type = row["content_type"]
        content_data = {}
        
        # Build content_data based on lesson type
        if content_type == "video":
            content_data = {
                "youtube_url": row.get("youtube_url"),
                "duration_minutes": row.get("duration_minutes")
            }
        elif content_type == "article":
            content_data = {
                "article_text": row.get("article_text"),
                "reading_time_minutes": row.get("reading_time_minutes")
            }
        elif content_type == "external_link":
            content_data = {
                "external_url": row.get("external_url"),
                "external_title": row.get("external_title"),
                "external_description": row.get("external_description")
            }
        elif content_type == "quiz":
            # Get quiz flashcards for this lesson
            flashcards = self.get_lesson_flashcards(row["lesson_id"])
            flashcards_data = [
                {
                    "reference": f.front,
                    "verseCodes": f.back.split(", ") if f.back else []
                }
                for f in flashcards
            ]
            
            content_data = {
                "quiz_config": {
                    "verse_count": row.get("verse_count", 5),
                    "pass_threshold": row.get("pass_threshold", 85),
                    "randomize": row.get("randomize_questions", True),
                    "time_limit_minutes": row.get("time_limit_minutes"),
                    "flashcards": flashcards_data
                }
            }
            
        return LessonResponse(
            id=row["lesson_id"],
            course_id=row["course_id"],
            position=row["position"],
            title=row["title"],
            description=row.get("description"),
            content_type=content_type,
            content_data=content_data,
            flashcards_required=0,  # Legacy field, not used in new structure
            created_at=row["created_at"].isoformat()
        )

    def _row_to_lesson_progress(self, row) -> UserLessonProgress:
        """Convert database row to UserLessonProgress"""
        # Handle both dictionary (from fetch_one) and tuple (from direct cursor) formats
        if isinstance(row, dict):
            return UserLessonProgress(
                user_id=row['user_id'],
                lesson_id=row['lesson_id'],
                course_id=row['course_id'],
                started_at=row['started_at'].isoformat(),
                completed_at=row['completed_at'].isoformat() if row['completed_at'] else None,
                flashcards_required=row['flashcards_required'],
                flashcards_completed=row['flashcards_completed'],
                is_unlocked=True,  # You might want to implement unlock logic
                quiz_attempts=None,
                best_score=None,
                last_attempt=None
            )
        else:
            # Tuple format from direct cursor
            return UserLessonProgress(
                user_id=row[0],
                lesson_id=row[1],
                course_id=row[2],
                started_at=row[3].isoformat(),
                completed_at=row[4].isoformat() if row[4] else None,
                flashcards_required=row[5],
                flashcards_completed=row[6],
                is_unlocked=True,  # You might want to implement unlock logic
                quiz_attempts=None,
                best_score=None,
                last_attempt=None
            )