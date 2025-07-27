class CourseNotFoundError(Exception):
    def __init__(self, course_id: int):
        super().__init__(f"Course {course_id} not found")
        self.course_id = course_id


class CourseAccessDeniedError(Exception):
    def __init__(self, user_id: int, course_id: int):
        super().__init__(f"User {user_id} cannot access course {course_id}")
        self.user_id = user_id
        self.course_id = course_id


class AlreadyEnrolledError(Exception):
    def __init__(self, user_id: int, course_id: int):
        super().__init__(f"User {user_id} is already enrolled in course {course_id}")
        self.user_id = user_id
        self.course_id = course_id
