import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CoursesState } from '../models/course.state';
import { courseAdapter } from '../models/course.state';

export const selectCoursesState = createFeatureSelector<CoursesState>('courses');

const { selectIds, selectEntities, selectAll, selectTotal } = courseAdapter.getSelectors();

export const selectAllCourses = createSelector(
  selectCoursesState,
  selectAll
);

export const selectCourseEntities = createSelector(
  selectCoursesState,
  selectEntities
);

export const selectCourseIds = createSelector(
  selectCoursesState,
  selectIds
);

export const selectCoursesTotal = createSelector(
  selectCoursesState,
  selectTotal
);

export const selectSelectedCourseId = createSelector(
  selectCoursesState,
  (state) => state.selectedCourseId
);

export const selectSelectedCourse = createSelector(
  selectCourseEntities,
  selectSelectedCourseId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

export const selectEnrolledCourseIds = createSelector(
  selectCoursesState,
  (state) => state.enrolledCourseIds
);

export const selectEnrolledCourses = createSelector(
  selectAllCourses,
  selectEnrolledCourseIds,
  (courses, enrolledIds) => courses.filter(course => enrolledIds.includes(course.id))
);

export const selectCurrentLesson = createSelector(
  selectCoursesState,
  (state) => state.currentLesson
);

export const selectLessonFlashcards = createSelector(
  selectCoursesState,
  (state) => state.lessonFlashcards
);

export const selectCourseProgress = createSelector(
  selectCoursesState,
  selectSelectedCourseId,
  (state, courseId) => courseId ? state.userProgress[courseId] : null
);

export const selectLessonProgress = createSelector(
  selectCoursesState,
  selectCurrentLesson,
  (state, lesson) => lesson ? state.lessonProgress[lesson.id] : null
);

export const selectCoursesLoading = createSelector(
  selectCoursesState,
  (state) => state.loading
);

export const selectCoursesError = createSelector(
  selectCoursesState,
  (state) => state.error
);

export const selectSearchQuery = createSelector(
  selectCoursesState,
  (state) => state.searchQuery
);

export const selectFilters = createSelector(
  selectCoursesState,
  (state) => state.filters
);

export const selectFilteredCourses = createSelector(
  selectAllCourses,
  selectSearchQuery,
  selectFilters,
  (courses, searchQuery, filters) => {
    let filtered = courses;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
      );
    }
    
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(course =>
        course.tags && filters.tags.some(tag => course.tags?.includes(tag))
      );
    }
    
    return filtered;
  }
);

export const selectIsEnrolled = createSelector(
  selectEnrolledCourseIds,
  selectSelectedCourseId,
  (enrolledIds, selectedId) => selectedId ? enrolledIds.includes(selectedId) : false
);