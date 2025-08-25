import { createAction, props } from '@ngrx/store';
import { Course, Lesson, UserCourseProgress, UserLessonProgress, LessonFlashcard } from '@models/course.model';

// Load Courses
export const loadCourses = createAction(
  '[Courses] Load Courses',
  props<{ page?: number; perPage?: number; search?: string; tags?: string[] }>()
);

export const loadCoursesSuccess = createAction(
  '[Courses] Load Courses Success',
  props<{ courses: Course[]; total: number }>()
);

export const loadCoursesFailure = createAction(
  '[Courses] Load Courses Failure',
  props<{ error: string }>()
);

// Load Single Course
export const loadCourse = createAction(
  '[Courses] Load Course',
  props<{ courseId: number; userId?: number }>()
);

export const loadCourseSuccess = createAction(
  '[Courses] Load Course Success',
  props<{ course: Course; lessons: Lesson[]; isEnrolled: boolean; userProgress?: UserCourseProgress }>()
);

export const loadCourseFailure = createAction(
  '[Courses] Load Course Failure',
  props<{ error: string }>()
);

// Enrolled Courses
export const loadEnrolledCourses = createAction(
  '[Courses] Load Enrolled Courses',
  props<{ userId: number }>()
);

export const loadEnrolledCoursesSuccess = createAction(
  '[Courses] Load Enrolled Courses Success',
  props<{ courses: Course[] }>()
);

export const loadEnrolledCoursesFailure = createAction(
  '[Courses] Load Enrolled Courses Failure',
  props<{ error: string }>()
);

// Course Management
export const createCourse = createAction(
  '[Courses] Create Course',
  props<{ course: { title: string; description: string; tags?: string[]; is_public?: boolean } }>()
);

export const createCourseSuccess = createAction(
  '[Courses] Create Course Success',
  props<{ course: Course }>()
);

export const createCourseFailure = createAction(
  '[Courses] Create Course Failure',
  props<{ error: string }>()
);

export const updateCourse = createAction(
  '[Courses] Update Course',
  props<{ courseId: number; changes: Partial<Course> }>()
);

export const updateCourseSuccess = createAction(
  '[Courses] Update Course Success',
  props<{ course: Course }>()
);

export const updateCourseFailure = createAction(
  '[Courses] Update Course Failure',
  props<{ error: string }>()
);

export const deleteCourse = createAction(
  '[Courses] Delete Course',
  props<{ courseId: number }>()
);

export const deleteCourseSuccess = createAction(
  '[Courses] Delete Course Success',
  props<{ courseId: number }>()
);

export const deleteCourseFailure = createAction(
  '[Courses] Delete Course Failure',
  props<{ error: string }>()
);

// Enrollment
export const enrollInCourse = createAction(
  '[Courses] Enroll In Course',
  props<{ courseId: number }>()
);

export const enrollInCourseSuccess = createAction(
  '[Courses] Enroll In Course Success',
  props<{ courseId: number; progress: UserCourseProgress }>()
);

export const enrollInCourseFailure = createAction(
  '[Courses] Enroll In Course Failure',
  props<{ error: string }>()
);

export const unenrollFromCourse = createAction(
  '[Courses] Unenroll From Course',
  props<{ courseId: number; userId: number }>()
);

export const unenrollFromCourseSuccess = createAction(
  '[Courses] Unenroll From Course Success',
  props<{ courseId: number }>()
);

export const unenrollFromCourseFailure = createAction(
  '[Courses] Unenroll From Course Failure',
  props<{ error: string }>()
);

// Lessons
export const loadLesson = createAction(
  '[Courses] Load Lesson',
  props<{ lessonId: number; userId?: number }>()
);

export const loadLessonSuccess = createAction(
  '[Courses] Load Lesson Success',
  props<{ lesson: Lesson; flashcards: LessonFlashcard[]; userProgress?: UserLessonProgress }>()
);

export const loadLessonFailure = createAction(
  '[Courses] Load Lesson Failure',
  props<{ error: string }>()
);

export const startLesson = createAction(
  '[Courses] Start Lesson',
  props<{ lessonId: number; userId: number }>()
);

export const startLessonSuccess = createAction(
  '[Courses] Start Lesson Success',
  props<{ progress: UserLessonProgress }>()
);

export const completeLesson = createAction(
  '[Courses] Complete Lesson',
  props<{ lessonId: number; userId: number }>()
);

export const completeLessonSuccess = createAction(
  '[Courses] Complete Lesson Success',
  props<{ progress: UserLessonProgress }>()
);

// Flashcards
export const addFlashcardsToQueue = createAction(
  '[Courses] Add Flashcards To Queue',
  props<{ lessonId: number; userId: number; flashcardIds?: number[]; addAll?: boolean }>()
);

export const addFlashcardsToQueueSuccess = createAction(
  '[Courses] Add Flashcards To Queue Success'
);

// UI Actions
export const selectCourse = createAction(
  '[Courses] Select Course',
  props<{ courseId: number }>()
);

export const setSearchQuery = createAction(
  '[Courses] Set Search Query',
  props<{ query: string }>()
);

export const setFilters = createAction(
  '[Courses] Set Filters',
  props<{ tags?: string[]; type?: string | null }>()
);

export const clearError = createAction('[Courses] Clear Error');