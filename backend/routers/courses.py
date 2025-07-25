# backend/routers/courses.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import json
import logging
from database import DatabaseConnection
import db_pool
from domain.courses.repository import CourseRepository

logger = logging.getLogger(__name__)

router = APIRouter()


class CourseCreate(BaseModel):
    name: str = Field(alias="title")
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_public: bool = False
    tags: List[str] = []


class CourseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, alias="title")
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class CourseResponse(BaseModel):
    id: int
    creator_id: int
    creator_name: str
    title: str
    description: Optional[str]
    thumbnail_url: Optional[str] = None
    is_public: bool
    created_at: str
    updated_at: str
    lesson_count: int = 0
    enrolled_count: int = 0
    tags: List[str] = []


class CourseListResponse(BaseModel):
    total: int
    courses: List[CourseResponse]


class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: str
    content_data: Optional[Dict] = None
    flashcards_required: int = 0
    position: Optional[int] = None


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[str] = None
    content_data: Optional[Dict] = None
    flashcards_required: Optional[int] = None
    position: Optional[int] = None


class LessonResponse(BaseModel):
    id: int
    course_id: int
    position: int
    title: str
    description: Optional[str]
    content_type: str
    content_data: Optional[Dict] = None
    flashcards_required: int
    created_at: str


class LessonListResponse(BaseModel):
    total: int
    lessons: List[LessonResponse]


class UserCourseProgress(BaseModel):
    user_id: int
    course_id: int
    current_lesson_id: Optional[int] = None
    current_lesson_position: int
    lessons_completed: int
    enrolled_at: str
    last_accessed: str
    completed_at: Optional[str] = None


class UserLessonProgress(BaseModel):
    user_id: int
    lesson_id: int
    course_id: int
    started_at: str
    completed_at: Optional[str] = None
    flashcards_required: int
    flashcards_completed: int
    is_unlocked: bool
    quiz_attempts: Optional[int] = None
    best_score: Optional[int] = None
    last_attempt: Optional[str] = None


def get_db():
    return DatabaseConnection(db_pool.db_pool)


def get_course_repository(db: DatabaseConnection = Depends(get_db)) -> CourseRepository:
    return CourseRepository(db)


@router.post("", response_model=CourseResponse)
async def create_course(
    course: CourseCreate, db: DatabaseConnection = Depends(get_db)
):
    logger.info(f"Creating course request: {course.dict()}")
    user_id = 1  # TODO: auth
    with db.get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO courses (user_id, name, description, thumbnail_url, is_public)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING course_id, created_at, updated_at
                """,
                (
                    user_id,
                    course.name,
                    course.description,
                    course.thumbnail_url,
                    course.is_public,
                ),
            )
            row = cur.fetchone()
            course_id = row[0]
            created_at = row[1].isoformat()
            updated_at = row[2].isoformat()
            cur.execute("SELECT name FROM users WHERE user_id = %s", (user_id,))
            creator_name = cur.fetchone()[0]

            # Handle tags
            for tag in course.tags:
                cur.execute(
                    "INSERT INTO course_tags (tag_name) VALUES (%s) ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name RETURNING tag_id",
                    (tag,),
                )
                tag_id = cur.fetchone()[0]
                cur.execute(
                    "INSERT INTO course_tag_map (course_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (course_id, tag_id),
                )
            conn.commit()
    logger.info(f"Course {course_id} created with {len(course.tags)} tags")
    response = CourseResponse(
        id=course_id,
        creator_id=user_id,
        creator_name=creator_name,
        title=course.name,
        description=course.description,
        thumbnail_url=course.thumbnail_url,
        is_public=course.is_public,
        created_at=created_at,
        updated_at=updated_at,
        lesson_count=0,
        enrolled_count=0,
        tags=course.tags,
    )
    logger.info(f"Create course response: {response}")
    return response


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    updates: CourseUpdate,
    db: DatabaseConnection = Depends(get_db),
):
    logger.info(f"Updating course {course_id}: {updates.dict(exclude_unset=True)}")
    update_fields = []
    params: List = []
    if updates.name is not None:
        update_fields.append("name = %s")
        params.append(updates.name)
    if updates.description is not None:
        update_fields.append("description = %s")
        params.append(updates.description)
    if updates.thumbnail_url is not None:
        update_fields.append("thumbnail_url = %s")
        params.append(updates.thumbnail_url)
    if updates.is_public is not None:
        update_fields.append("is_public = %s")
        params.append(updates.is_public)
    params.append(course_id)
    if update_fields:
        query = f"UPDATE courses SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP WHERE course_id = %s"
        db.execute(query, tuple(params))

    if updates.tags is not None:
        with db.get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM course_tag_map WHERE course_id = %s",
                    (course_id,),
                )
                for tag in updates.tags:
                    cur.execute(
                        "INSERT INTO course_tags (tag_name) VALUES (%s) ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name RETURNING tag_id",
                        (tag,),
                    )
                    tag_id = cur.fetchone()[0]
                    cur.execute(
                        "INSERT INTO course_tag_map (course_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (course_id, tag_id),
                    )
                conn.commit()

    response = await get_course(course_id, db)
    logger.info(f"Updated course response: {response}")
    return response


@router.get("/tags", response_model=List[str])
async def list_course_tags(db: DatabaseConnection = Depends(get_db)):
    logger.info("Listing course tags")
    rows = db.fetch_all("SELECT tag_name FROM course_tags ORDER BY tag_name")
    return [r["tag_name"] for r in rows]


@router.get("/public", response_model=CourseListResponse)
async def list_public_courses(
    search: Optional[str] = None,
    tags: Optional[str] = None,
    db: DatabaseConnection = Depends(get_db),
):
    logger.info(f"Listing public courses search={search} tags={tags}")
    where_clause = "WHERE w.is_public = TRUE"
    params: List[str] = []
    if search:
        where_clause += " AND (w.name ILIKE %s OR w.description ILIKE %s)"
        like = f"%{search}%"
        params.extend([like, like])
    if tags:
        tag_list = [t.strip() for t in tags.split(',') if t.strip()]
        if tag_list:
            where_clause += " AND t.tag_name = ANY(%s)"
            params.append(tag_list)

    query = f"""
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
        {where_clause}
        GROUP BY w.course_id, w.user_id, u.name, w.name, w.description, w.thumbnail_url, w.is_public, w.created_at, w.updated_at
        ORDER BY w.created_at DESC
    """
    rows = db.fetch_all(query, tuple(params))
    courses = []
    for r in rows:
        courses.append(
            CourseResponse(
                id=r["course_id"],
                creator_id=r["user_id"],
                creator_name=r["creator_name"],
                title=r["name"],
                description=r["description"],
                thumbnail_url=r.get("thumbnail_url"),
                is_public=r["is_public"],
                created_at=r["created_at"].isoformat(),
                updated_at=r["updated_at"].isoformat(),
                lesson_count=r["lesson_count"],
                enrolled_count=r.get("enrolled_count", 0),
                tags=r.get("tags") or [],
            )
        )
    logger.info(f"Public courses returned: {len(courses)}")
    return CourseListResponse(total=len(courses), courses=courses)


@router.get("/user/{user_id}", response_model=CourseListResponse)
async def list_user_courses(user_id: int, db: DatabaseConnection = Depends(get_db)):
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
        GROUP BY w.course_id, w.user_id, u.name, w.name, w.description, w.thumbnail_url, w.is_public, w.created_at, w.updated_at
        ORDER BY w.created_at DESC
    """
    rows = db.fetch_all(query, (user_id,))
    courses = [
        CourseResponse(
            id=r["course_id"],
            creator_id=r["user_id"],
            creator_name=r["creator_name"],
            title=r["name"],
            description=r["description"],
            thumbnail_url=r.get("thumbnail_url"),
            is_public=r["is_public"],
            created_at=r["created_at"].isoformat(),
            updated_at=r["updated_at"].isoformat(),
            lesson_count=r["lesson_count"],
            enrolled_count=r.get("enrolled_count", 0),
            tags=r.get("tags") or [],
        )
        for r in rows
    ]
    logger.info(f"User {user_id} courses returned: {len(courses)}")
    return CourseListResponse(total=len(courses), courses=courses)


@router.get("/enrolled/{user_id}", response_model=List[CourseResponse])
async def list_enrolled_courses(
    user_id: int,
    repo: CourseRepository = Depends(get_course_repository),
):
    logger.info(f"Listing courses enrolled by user {user_id}")

    courses = repo.get_enrolled_courses(user_id)

    logger.info(f"User {user_id} enrolled courses count: {len(courses)}")
    return [CourseResponse(**c) for c in courses]


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Fetching course {course_id}")
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
        GROUP BY w.course_id, w.user_id, u.name, w.name, w.description, w.thumbnail_url, w.is_public, w.created_at, w.updated_at
    """
    row = db.fetch_one(query, (course_id,))
    if not row:
        logger.warning(f"Course {course_id} not found")
        raise HTTPException(status_code=404, detail="Course not found")
    response = CourseResponse(
        id=row["course_id"],
        creator_id=row["user_id"],
        creator_name=row["creator_name"],
        title=row["name"],
        description=row["description"],
        thumbnail_url=row.get("thumbnail_url"),
        is_public=row["is_public"],
        created_at=row["created_at"].isoformat(),
        updated_at=row["updated_at"].isoformat(),
        lesson_count=row["lesson_count"],
        enrolled_count=row.get("enrolled_count", 0),
        tags=row.get("tags") or [],
    )
    logger.info(f"Fetched course {course_id}")
    return response


@router.post("/{course_id}/enroll", response_model=UserCourseProgress)
async def enroll_course(course_id: int, user_id: int = 1, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Enrolling user {user_id} in course {course_id}")
    with db.get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO course_enrollments (user_id, course_id)
                VALUES (%s, %s)
                ON CONFLICT (user_id, course_id)
                DO UPDATE SET last_accessed = CURRENT_TIMESTAMP
                RETURNING user_id, course_id, current_lesson_id, current_lesson_position,
                          lessons_completed, enrolled_at, last_accessed, completed_at
                """,
                (user_id, course_id),
            )
            row = cur.fetchone()
            conn.commit()
    response = UserCourseProgress(
        user_id=row[0],
        course_id=row[1],
        current_lesson_id=row[2],
        current_lesson_position=row[3],
        lessons_completed=row[4],
        enrolled_at=row[5].isoformat(),
        last_accessed=row[6].isoformat(),
        completed_at=row[7].isoformat() if row[7] else None,
    )
    logger.info(f"Enroll course response: {response}")
    return response


@router.delete("/{course_id}/enroll/{user_id}")
async def unenroll_course(course_id: int, user_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Unenrolling user {user_id} from course {course_id}")
    db.execute(
        "DELETE FROM course_enrollments WHERE course_id = %s AND user_id = %s",
        (course_id, user_id),
    )
    return {"message": "Unenrolled"}


@router.get("/{course_id}/progress/{user_id}", response_model=UserCourseProgress)
async def get_course_progress(course_id: int, user_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Fetching progress for user {user_id} course {course_id}")
    row = db.fetch_one(
        """
        SELECT user_id, course_id, current_lesson_id, current_lesson_position,
               lessons_completed, enrolled_at, last_accessed, completed_at
        FROM course_enrollments
        WHERE course_id = %s AND user_id = %s
        """,
        (course_id, user_id),
    )
    if not row:
        logger.warning(f"Enrollment not found for user {user_id} course {course_id}")
        raise HTTPException(status_code=404, detail="Enrollment not found")
    response = UserCourseProgress(
        user_id=row["user_id"],
        course_id=row["course_id"],
        current_lesson_id=row.get("current_lesson_id"),
        current_lesson_position=row["current_lesson_position"],
        lessons_completed=row["lessons_completed"],
        enrolled_at=row["enrolled_at"].isoformat(),
        last_accessed=row["last_accessed"].isoformat(),
        completed_at=row["completed_at"].isoformat() if row.get("completed_at") else None,
    )
    logger.info(f"Course progress response: {response}")
    return response



@router.post("/{course_id}/lessons", response_model=LessonResponse)
async def add_lesson(
    course_id: int, lesson: LessonCreate, db: DatabaseConnection = Depends(get_db)
):
    logger.info(f"Adding lesson to course {course_id}: {lesson.dict()}")
    user_id = 1
    # Verify course ownership
    wf = db.fetch_one(
        "SELECT user_id FROM courses WHERE course_id = %s", (course_id,)
    )
    if not wf:
        raise HTTPException(status_code=404, detail="Course not found")
    if wf["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify course")
    position = lesson.position or 1
    with db.get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data, flashcards_required)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING lesson_id, created_at
                """,
                (
                    course_id,
                    position,
                    lesson.title,
                    lesson.description,
                    lesson.content_type,
                    json.dumps(lesson.content_data) if lesson.content_data else None,
                    lesson.flashcards_required,
                ),
            )
            row = cur.fetchone()
            conn.commit()
            lesson_id = row[0]
            created_at = row[1].isoformat()
    response = LessonResponse(
        id=lesson_id,
        course_id=course_id,
        position=position,
        title=lesson.title,
        description=lesson.description,
        content_type=lesson.content_type,
        content_data=lesson.content_data,
        flashcards_required=lesson.flashcards_required,
        created_at=created_at,
    )
    logger.info(f"Added lesson response: {response}")
    return response


@router.get("/{course_id}/lessons", response_model=LessonListResponse)
async def list_lessons(course_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Listing lessons for course {course_id}")
    query = """
        SELECT lesson_id, course_id, position, title, description, content_type, content_data,
               flashcards_required, created_at
        FROM course_lessons
        WHERE course_id = %s
        ORDER BY position
    """
    rows = db.fetch_all(query, (course_id,))
    lessons = [
        LessonResponse(
            id=r["lesson_id"],
            course_id=r["course_id"],
            position=r["position"],
            title=r["title"],
            description=r.get("description"),
            content_type=r["content_type"],
            content_data=r.get("content_data"),
            flashcards_required=r.get("flashcards_required", 0),
            created_at=r["created_at"].isoformat(),
        )
        for r in rows
    ]
    logger.info(f"Lessons returned: {len(lessons)} for course {course_id}")
    return LessonListResponse(total=len(lessons), lessons=lessons)


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(lesson_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Fetching lesson {lesson_id}")
    row = db.fetch_one(
        """
        SELECT lesson_id, course_id, position, title, description, content_type, content_data,
               flashcards_required, created_at
        FROM course_lessons
        WHERE lesson_id = %s
        """,
        (lesson_id,),
    )
    if not row:
        logger.warning(f"Lesson {lesson_id} not found")
        raise HTTPException(status_code=404, detail="Lesson not found")
    response = LessonResponse(
        id=row["lesson_id"],
        course_id=row["course_id"],
        position=row["position"],
        title=row["title"],
        description=row.get("description"),
        content_type=row["content_type"],
        content_data=row.get("content_data"),
        flashcards_required=row.get("flashcards_required", 0),
        created_at=row["created_at"].isoformat(),
    )
    logger.info(f"Fetched lesson {lesson_id}")
    return response


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(lesson_id: int, updates: LessonUpdate, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Updating lesson {lesson_id}: {updates.dict(exclude_unset=True)}")
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
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    params.append(lesson_id)
    query = f"UPDATE course_lessons SET {', '.join(update_fields)} WHERE lesson_id = %s"
    db.execute(query, tuple(params))
    response = await get_lesson(lesson_id, db)
    logger.info(f"Updated lesson response: {response}")
    return response


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Deleting lesson {lesson_id}")
    db.execute("DELETE FROM course_lessons WHERE lesson_id = %s", (lesson_id,))
    return {"message": "Lesson deleted"}
