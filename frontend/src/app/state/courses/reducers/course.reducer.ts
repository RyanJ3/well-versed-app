import { createReducer, on } from '@ngrx/store';
import { courseAdapter, initialCoursesState } from '../models/course.state';
import * as CourseActions from '../actions/course.actions';

export const courseReducer = createReducer(
  initialCoursesState,
  
  // Load Courses
  on(CourseActions.loadCourses, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CourseActions.loadCoursesSuccess, (state, { courses }) => 
    courseAdapter.setAll(courses, {
      ...state,
      loading: false
    })
  ),
  
  on(CourseActions.loadCoursesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load Single Course
  on(CourseActions.loadCourse, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CourseActions.loadCourseSuccess, (state, { course, userProgress }) => 
    courseAdapter.upsertOne(course, {
      ...state,
      loading: false,
      selectedCourseId: course.id,
      userProgress: userProgress ? {
        ...state.userProgress,
        [course.id]: userProgress
      } : state.userProgress
    })
  ),
  
  on(CourseActions.loadCourseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Enrolled Courses
  on(CourseActions.loadEnrolledCourses, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CourseActions.loadEnrolledCoursesSuccess, (state, { courses }) => {
    const enrolledIds = courses.map(c => c.id);
    return courseAdapter.upsertMany(courses, {
      ...state,
      enrolledCourseIds: enrolledIds,
      loading: false
    });
  }),
  
  on(CourseActions.loadEnrolledCoursesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Create Course
  on(CourseActions.createCourse, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CourseActions.createCourseSuccess, (state, { course }) => 
    courseAdapter.addOne(course, {
      ...state,
      loading: false,
      selectedCourseId: course.id
    })
  ),
  
  on(CourseActions.createCourseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Course
  on(CourseActions.updateCourse, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CourseActions.updateCourseSuccess, (state, { course }) => 
    courseAdapter.updateOne(
      { id: course.id, changes: course },
      {
        ...state,
        loading: false
      }
    )
  ),
  
  on(CourseActions.updateCourseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Delete Course
  on(CourseActions.deleteCourse, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CourseActions.deleteCourseSuccess, (state, { courseId }) => 
    courseAdapter.removeOne(courseId, {
      ...state,
      loading: false,
      selectedCourseId: state.selectedCourseId === courseId ? null : state.selectedCourseId,
      enrolledCourseIds: state.enrolledCourseIds.filter(id => id !== courseId)
    })
  ),
  
  on(CourseActions.deleteCourseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Enrollment
  on(CourseActions.enrollInCourse, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CourseActions.enrollInCourseSuccess, (state, { courseId, progress }) => ({
    ...state,
    loading: false,
    enrolledCourseIds: [...state.enrolledCourseIds, courseId],
    userProgress: {
      ...state.userProgress,
      [courseId]: progress
    }
  })),
  
  on(CourseActions.enrollInCourseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(CourseActions.unenrollFromCourse, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CourseActions.unenrollFromCourseSuccess, (state, { courseId }) => {
    const { [courseId]: removed, ...remainingProgress } = state.userProgress;
    return {
      ...state,
      loading: false,
      enrolledCourseIds: state.enrolledCourseIds.filter(id => id !== courseId),
      userProgress: remainingProgress
    };
  }),
  
  on(CourseActions.unenrollFromCourseFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Lessons
  on(CourseActions.loadLesson, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CourseActions.loadLessonSuccess, (state, { lesson, flashcards, userProgress }) => ({
    ...state,
    loading: false,
    currentLesson: lesson,
    lessonFlashcards: flashcards,
    lessonProgress: userProgress ? {
      ...state.lessonProgress,
      [`${lesson.id}`]: userProgress
    } : state.lessonProgress
  })),
  
  on(CourseActions.loadLessonFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(CourseActions.startLessonSuccess, (state, { progress }) => ({
    ...state,
    lessonProgress: {
      ...state.lessonProgress,
      [progress.lesson_id]: progress
    }
  })),
  
  on(CourseActions.completeLessonSuccess, (state, { progress }) => ({
    ...state,
    lessonProgress: {
      ...state.lessonProgress,
      [progress.lesson_id]: progress
    }
  })),
  
  // UI Actions
  on(CourseActions.selectCourse, (state, { courseId }) => ({
    ...state,
    selectedCourseId: courseId
  })),
  
  on(CourseActions.setSearchQuery, (state, { query }) => ({
    ...state,
    searchQuery: query
  })),
  
  on(CourseActions.setFilters, (state, { tags, type }) => ({
    ...state,
    filters: {
      tags: tags ?? state.filters.tags,
      type: type !== undefined ? type : state.filters.type
    }
  })),
  
  on(CourseActions.clearError, (state) => ({
    ...state,
    error: null
  }))
);