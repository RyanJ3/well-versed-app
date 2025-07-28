// frontend/src/app/core/services/course.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Course,
  Lesson,
  UserCourseProgress,
  UserLessonProgress,
  LessonFlashcard,
  CreateCourseRequest,
  CreateLessonRequest,
  AddFlashcardsToQueueRequest
} from '../models/course.model';

export interface CourseListResponse {
  total: number;
  courses: Course[];
  page: number;
  per_page: number;
}

export interface CourseDetailResponse extends Course {
  lessons: Lesson[];
  is_enrolled: boolean;
  user_progress?: UserCourseProgress;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;

  /** Normalize provided user id so API calls never include undefined values. */
  private normalizeUserId(id: any): number {
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }

  // Track current course being viewed/edited
  private currentCourseSubject = new BehaviorSubject<CourseDetailResponse | null>(null);
  public currentCourse$ = this.currentCourseSubject.asObservable();

  // Track user's enrolled courses
  private enrolledCoursesSubject = new BehaviorSubject<Course[]>([]);
  public enrolledCourses$ = this.enrolledCoursesSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ========== Course Management ==========

  // Get all public courses
  getPublicCourses(
    page: number = 1,
    perPage: number = 20,
    search?: string,
    tags?: string[]
  ): Observable<CourseListResponse> {
    console.log(`Fetching public courses page=${page} perPage=${perPage}`);
    let url = `${this.apiUrl}/public?page=${page}&per_page=${perPage}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tags?.length) url += `&tags=${tags.join(',')}`;

    return this.http.get<CourseListResponse>(url).pipe(
      tap(r => console.log(`Loaded ${r.courses.length} courses`)),
      catchError(err => { console.error('Error loading courses', err); throw err; })
    );
  }


  // Get courses created by a user
  getUserCourses(userId: number): Observable<CourseListResponse> {
    const uid = this.normalizeUserId(userId);
    console.log(`Fetching user courses for ${uid}`);
    return this.http.get<CourseListResponse>(`${this.apiUrl}/user/${uid}`).pipe(
      tap(r => console.log(`Loaded ${r.courses.length} user courses`)),
      catchError(err => { console.error('Error loading user courses', err); throw err; })
    );
  }

  // Get enrolled courses for a user
  getEnrolledCourses(userId: number): Observable<Course[]> {
    const uid = this.normalizeUserId(userId);
    console.log(`Fetching enrolled courses for user ${uid}`);
    return this.http.get<Course[]>(`${this.apiUrl}/enrolled/${uid}`).pipe(
      tap(courses => {
        console.log(`Loaded ${courses.length} enrolled courses`);
        this.enrolledCoursesSubject.next(courses);
      }),
      catchError(err => { console.error('Error loading enrolled courses', err); throw err; })
    );
  }

  // Get course details with lessons
  getCourse(courseId: number, userId?: number): Observable<CourseDetailResponse> {
    console.log(`Fetching course ${courseId}`);
    let url = `${this.apiUrl}/${courseId}`;
    if (userId) {
      const uid = this.normalizeUserId(userId);
      url += `?user_id=${uid}`;
    }

    return this.http.get<CourseDetailResponse>(url).pipe(
      tap(course => {
        console.log('Loaded course', course);
        this.currentCourseSubject.next(course);
      }),
      catchError(err => { console.error('Error loading course', err); throw err; })
    );
  }

  // Create a new course
  createCourse(course: CreateCourseRequest): Observable<Course> {
    console.log('Creating course', course);
    return this.http.post<Course>(this.apiUrl, course).pipe(
      tap(() => console.log('Course created')),
      catchError(err => { console.error('Error creating course', err); throw err; })
    );
  }

  // Update course
  updateCourse(courseId: number, updates: Partial<CreateCourseRequest>): Observable<Course> {
    console.log(`Updating course ${courseId}`);
    return this.http.put<Course>(`${this.apiUrl}/${courseId}`, updates).pipe(
      tap(() => console.log('Course updated')),
      catchError(err => { console.error('Error updating course', err); throw err; })
    );
  }

  // Delete course
  deleteCourse(courseId: number): Observable<any> {
    console.log(`Deleting course ${courseId}`);
    return this.http.delete(`${this.apiUrl}/${courseId}`).pipe(
      tap(() => console.log('Course deleted')),
      catchError(err => { console.error('Error deleting course', err); throw err; })
    );
  }

  // ========== Enrollment & Progress ==========

  // Enroll in a course
  enrollInCourse(courseId: number): Observable<UserCourseProgress> {
    console.log(`Enrolling in course ${courseId}`);
    return this.http.post<UserCourseProgress>(`${this.apiUrl}/${courseId}/enroll`, {}).pipe(
      tap(() => console.log('Enrolled in course')),
      catchError(err => { console.error('Error enrolling in course', err); throw err; })
    );
  }

  // Unenroll from a course
  unenrollFromCourse(courseId: number, userId: number): Observable<any> {
    const uid = this.normalizeUserId(userId);
    console.log(`Unenrolling user ${uid} from course ${courseId}`);
    return this.http.delete(`${this.apiUrl}/${courseId}/enroll/${uid}`).pipe(
      tap(() => console.log('Unenrolled from course')),
      catchError(err => { console.error('Error unenrolling from course', err); throw err; })
    );
  }

  // Get user's progress in a course
  getUserCourseProgress(courseId: number, userId: number): Observable<UserCourseProgress> {
    const uid = this.normalizeUserId(userId);
    console.log(`Fetching course progress for course ${courseId} user ${uid}`);
    return this.http.get<UserCourseProgress>(`${this.apiUrl}/${courseId}/progress/${uid}`).pipe(
      tap(progress => console.log('Loaded progress', progress)),
      catchError(err => { console.error('Error loading progress', err); throw err; })
    );
  }

  // ========== Lesson Management ==========

  // Get lesson details
  getLesson(lessonId: number, userId?: number): Observable<Lesson & { flashcards: LessonFlashcard[], user_progress?: UserLessonProgress }> {
    console.log(`Fetching lesson ${lessonId}`);
    let url = `${this.apiUrl}/lessons/${lessonId}`;
    if (userId) {
      const uid = this.normalizeUserId(userId);
      url += `?user_id=${uid}`;
    }
    return this.http.get<Lesson & { flashcards: LessonFlashcard[], user_progress?: UserLessonProgress }>(url).pipe(
      tap(l => console.log('Loaded lesson', l)),
      catchError(err => { console.error('Error loading lesson', err); throw err; })
    );
  }

  // Create a new lesson
  createLesson(lesson: CreateLessonRequest): Observable<Lesson> {
    console.log('Creating lesson', lesson);
    return this.http.post<Lesson>(`${this.apiUrl}/${lesson.course_id}/lessons`, lesson).pipe(
      tap(() => console.log('Lesson created')),
      catchError(err => { console.error('Error creating lesson', err); throw err; })
    );
  }

  // Update lesson
  updateLesson(lessonId: number, updates: Partial<CreateLessonRequest>): Observable<Lesson> {
    console.log(`Updating lesson ${lessonId}`);
    return this.http.put<Lesson>(`${this.apiUrl}/lessons/${lessonId}`, updates).pipe(
      tap(() => console.log('Lesson updated')),
      catchError(err => { console.error('Error updating lesson', err); throw err; })
    );
  }

  // Delete lesson
  deleteLesson(lessonId: number): Observable<any> {
    console.log(`Deleting lesson ${lessonId}`);
    return this.http.delete(`${this.apiUrl}/lessons/${lessonId}`).pipe(
      tap(() => console.log('Lesson deleted')),
      catchError(err => { console.error('Error deleting lesson', err); throw err; })
    );
  }

  // Reorder lessons
  reorderLessons(courseId: number, lessonIds: number[]): Observable<any> {
    console.log(`Reordering lessons for course ${courseId}`);
    return this.http.post(`${this.apiUrl}/${courseId}/lessons/reorder`, {
      lesson_ids: lessonIds
    }).pipe(
      tap(() => console.log('Lessons reordered')),
      catchError(err => { console.error('Error reordering lessons', err); throw err; })
    );
  }

  // ========== Lesson Progress ==========

  // Mark lesson as started
  startLesson(lessonId: number, userId: number): Observable<UserLessonProgress> {
    const uid = this.normalizeUserId(userId);
    console.log(`Starting lesson ${lessonId} for user ${uid}`);
    return this.http.post<UserLessonProgress>(`${this.apiUrl}/lessons/${lessonId}/start`, {
      user_id: uid
    }).pipe(
      tap(() => console.log('Lesson started')),
      catchError(err => { console.error('Error starting lesson', err); throw err; })
    );
  }

  // Mark lesson as completed
  completeLesson(lessonId: number, userId: number): Observable<UserLessonProgress> {
    const uid = this.normalizeUserId(userId);
    console.log(`Completing lesson ${lessonId} for user ${uid}`);
    return this.http.post<UserLessonProgress>(`${this.apiUrl}/lessons/${lessonId}/complete`, {
      user_id: uid
    }).pipe(
      tap(() => console.log('Lesson completed')),
      catchError(err => { console.error('Error completing lesson', err); throw err; })
    );
  }

  // Get user's lesson progress
  getUserLessonProgress(lessonId: number, userId: number): Observable<UserLessonProgress> {
    const uid = this.normalizeUserId(userId);
    console.log(`Fetching lesson progress for lesson ${lessonId} user ${uid}`);
    return this.http.get<UserLessonProgress>(`${this.apiUrl}/lessons/${lessonId}/progress/${uid}`).pipe(
      tap(p => console.log('Loaded lesson progress', p)),
      catchError(err => { console.error('Error loading lesson progress', err); throw err; })
    );
  }

  // ========== Flashcards ==========

  // Get flashcards for a lesson
  getLessonFlashcards(lessonId: number): Observable<LessonFlashcard[]> {
    console.log(`Fetching flashcards for lesson ${lessonId}`);
    return this.http.get<LessonFlashcard[]>(`${this.apiUrl}/lessons/${lessonId}/flashcards`).pipe(
      tap(f => console.log(`Loaded ${f.length} flashcards`)),
      catchError(err => { console.error('Error loading flashcards', err); throw err; })
    );
  }

  // Add flashcards to user's queue
  addFlashcardsToQueue(request: AddFlashcardsToQueueRequest, userId: number): Observable<any> {
    const uid = this.normalizeUserId(userId);
    console.log(`Adding flashcards to queue for lesson ${request.lesson_id} user ${uid}`);
    return this.http.post(`${this.apiUrl}/lessons/${request.lesson_id}/flashcards/queue`, {
      ...request,
      user_id: uid
    }).pipe(
      tap(() => console.log('Flashcards added to queue')),
      catchError(err => { console.error('Error adding flashcards', err); throw err; })
    );
  }

  // Create custom flashcards for a lesson
  createLessonFlashcards(lessonId: number, flashcards: Omit<LessonFlashcard, 'id' | 'lesson_id'>[]): Observable<LessonFlashcard[]> {
    console.log(`Creating flashcards for lesson ${lessonId}`);
    return this.http.post<LessonFlashcard[]>(`${this.apiUrl}/lessons/${lessonId}/flashcards`, {
      flashcards
    }).pipe(
      tap(() => console.log('Flashcards created')),
      catchError(err => { console.error('Error creating flashcards', err); throw err; })
    );
  }

  // Update lesson flashcard requirement count
  updateFlashcardRequirement(lessonId: number, requiredCount: number): Observable<any> {
    console.log(`Updating flashcard requirement for lesson ${lessonId}`);
    return this.http.patch(`${this.apiUrl}/lessons/${lessonId}/flashcard-requirement`, {
      required_count: requiredCount
    }).pipe(
      tap(() => console.log('Flashcard requirement updated')),
      catchError(err => { console.error('Error updating flashcard requirement', err); throw err; })
    );
  }


  // ========== Suggested Tags ==========

  getSuggestedTags(): string[] {
    return [
      'beginner',
      'intermediate',
      'advanced',
      'bible-study',
      'theology',
      'prayer',
      'devotional',
      'history',
      'languages',
      'hebrew',
      'greek',
      'memorization',
      'meditation',
      'worship',
      'evangelism',
      'discipleship',
      'leadership',
      'youth',
      'children',
      'family'
    ];
  }
}