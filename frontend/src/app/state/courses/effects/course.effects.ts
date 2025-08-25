import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap } from 'rxjs/operators';
import { CourseService } from '@services/api/course.service';
import { Course, Lesson } from '@models/course.model';
import * as CourseActions from '../actions/course.actions';

@Injectable()
export class CourseEffects {
  loadCourses$;
  loadCourse$;
  loadEnrolledCourses$;
  createCourse$;
  updateCourse$;
  deleteCourse$;
  enrollInCourse$;
  unenrollFromCourse$;
  loadLesson$;
  startLesson$;
  completeLesson$;
  addFlashcardsToQueue$;

  constructor(
    private actions$: Actions,
    private courseService: CourseService
  ) {
    this.loadCourses$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.loadCourses),
        mergeMap((action) =>
          this.courseService.getPublicCourses(
            action.page,
            action.perPage,
            action.search,
            action.tags
          ).pipe(
            map(response => CourseActions.loadCoursesSuccess({
              courses: response.courses,
              total: response.total
            })),
            catchError(error => of(CourseActions.loadCoursesFailure({
              error: error.message || 'Failed to load courses'
            })))
          )
        )
      )
    );

    this.loadCourse$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.loadCourse),
        mergeMap((action) =>
          this.courseService.getCourse(action.courseId, action.userId).pipe(
            map(response => CourseActions.loadCourseSuccess({
              course: {
                id: response.id,
                creator_id: response.creator_id || 0,
                creator_name: response.creator_name || '',
                title: response.title,
                description: response.description,
                is_public: response.is_public,
                tags: response.tags || [],
                created_at: response.created_at || new Date().toISOString(),
                updated_at: response.updated_at || new Date().toISOString()
              } as Course,
              lessons: response.lessons,
              isEnrolled: response.is_enrolled,
              userProgress: response.user_progress
            })),
            catchError(error => of(CourseActions.loadCourseFailure({
              error: error.message || 'Failed to load course'
            })))
          )
        )
      )
    );

    this.loadEnrolledCourses$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.loadEnrolledCourses),
        mergeMap((action) =>
          this.courseService.getEnrolledCourses(action.userId).pipe(
            map(courses => CourseActions.loadEnrolledCoursesSuccess({ courses })),
            catchError(error => of(CourseActions.loadEnrolledCoursesFailure({
              error: error.message || 'Failed to load enrolled courses'
            })))
          )
        )
      )
    );

    this.createCourse$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.createCourse),
        mergeMap((action) =>
          this.courseService.createCourse({ 
            ...action.course, 
            tags: action.course.tags || [],
            is_public: action.course.is_public || false 
          }).pipe(
            map(course => CourseActions.createCourseSuccess({ course })),
            catchError(error => of(CourseActions.createCourseFailure({
              error: error.message || 'Failed to create course'
            })))
          )
        )
      )
    );

    this.updateCourse$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.updateCourse),
        mergeMap((action) =>
          this.courseService.updateCourse(action.courseId, action.changes).pipe(
            map(course => CourseActions.updateCourseSuccess({ course })),
            catchError(error => of(CourseActions.updateCourseFailure({
              error: error.message || 'Failed to update course'
            })))
          )
        )
      )
    );

    this.deleteCourse$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.deleteCourse),
        mergeMap((action) =>
          this.courseService.deleteCourse(action.courseId).pipe(
            map(() => CourseActions.deleteCourseSuccess({ courseId: action.courseId })),
            catchError(error => of(CourseActions.deleteCourseFailure({
              error: error.message || 'Failed to delete course'
            })))
          )
        )
      )
    );

    this.enrollInCourse$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.enrollInCourse),
        mergeMap((action) =>
          this.courseService.enrollInCourse(action.courseId).pipe(
            map(progress => CourseActions.enrollInCourseSuccess({
              courseId: action.courseId,
              progress
            })),
            catchError(error => of(CourseActions.enrollInCourseFailure({
              error: error.message || 'Failed to enroll in course'
            })))
          )
        )
      )
    );

    this.unenrollFromCourse$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.unenrollFromCourse),
        mergeMap((action) =>
          this.courseService.unenrollFromCourse(action.courseId, action.userId).pipe(
            map(() => CourseActions.unenrollFromCourseSuccess({ courseId: action.courseId })),
            catchError(error => of(CourseActions.unenrollFromCourseFailure({
              error: error.message || 'Failed to unenroll from course'
            })))
          )
        )
      )
    );

    this.loadLesson$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.loadLesson),
        mergeMap((action) =>
          this.courseService.getLesson(action.lessonId, action.userId).pipe(
            map(response => CourseActions.loadLessonSuccess({
              lesson: response as Lesson,
              flashcards: response.flashcards,
              userProgress: response.user_progress
            })),
            catchError(error => of(CourseActions.loadLessonFailure({
              error: error.message || 'Failed to load lesson'
            })))
          )
        )
      )
    );

    this.startLesson$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.startLesson),
        mergeMap((action) =>
          this.courseService.startLesson(action.lessonId, action.userId).pipe(
            map(progress => CourseActions.startLessonSuccess({ progress })),
            catchError(error => of(CourseActions.loadLessonFailure({
              error: error.message || 'Failed to start lesson'
            })))
          )
        )
      )
    );

    this.completeLesson$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.completeLesson),
        mergeMap((action) =>
          this.courseService.completeLesson(action.lessonId, action.userId).pipe(
            map(progress => CourseActions.completeLessonSuccess({ progress })),
            catchError(error => of(CourseActions.loadLessonFailure({
              error: error.message || 'Failed to complete lesson'
            })))
          )
        )
      )
    );

    this.addFlashcardsToQueue$ = createEffect(() =>
      this.actions$.pipe(
        ofType(CourseActions.addFlashcardsToQueue),
        mergeMap((action) =>
          this.courseService.addFlashcardsToQueue(
            {
              lesson_id: action.lessonId,
              flashcard_ids: action.flashcardIds || []
            },
            action.userId
          ).pipe(
            map(() => CourseActions.addFlashcardsToQueueSuccess()),
            catchError(error => of(CourseActions.loadLessonFailure({
              error: error.message || 'Failed to add flashcards to queue'
            })))
          )
        )
      )
    );
  }
}