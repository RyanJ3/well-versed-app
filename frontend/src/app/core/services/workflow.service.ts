// frontend/src/app/core/services/workflow.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Workflow,
  Lesson,
  UserWorkflowProgress,
  UserLessonProgress,
  LessonFlashcard,
  CreateWorkflowRequest,
  CreateLessonRequest,
  AddFlashcardsToQueueRequest
} from '../models/workflow.model';

export interface WorkflowListResponse {
  total: number;
  workflows: Workflow[];
  page: number;
  per_page: number;
}

export interface WorkflowDetailResponse extends Workflow {
  lessons: Lesson[];
  is_enrolled: boolean;
  user_progress?: UserWorkflowProgress;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private apiUrl = `${environment.apiUrl}/workflows`;
  
  // Track current workflow being viewed/edited
  private currentWorkflowSubject = new BehaviorSubject<WorkflowDetailResponse | null>(null);
  public currentWorkflow$ = this.currentWorkflowSubject.asObservable();
  
  // Track user's enrolled workflows
  private enrolledWorkflowsSubject = new BehaviorSubject<Workflow[]>([]);
  public enrolledWorkflows$ = this.enrolledWorkflowsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ========== Workflow Management ==========

  // Get all public workflows
  getPublicWorkflows(
    page: number = 1,
    perPage: number = 20,
    search?: string,
    tags?: string[]
  ): Observable<WorkflowListResponse> {
    console.log(`Fetching public workflows page=${page} perPage=${perPage}`);
    let url = `${this.apiUrl}/public?page=${page}&per_page=${perPage}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tags?.length) url += `&tags=${tags.join(',')}`;
    
    return this.http.get<WorkflowListResponse>(url).pipe(
      tap(r => console.log(`Loaded ${r.workflows.length} workflows`)),
      catchError(err => { console.error('Error loading workflows', err); throw err; })
    );
  }

  // Get workflows created by a user
  getUserWorkflows(userId: number): Observable<WorkflowListResponse> {
    console.log(`Fetching user workflows for ${userId}`);
    return this.http.get<WorkflowListResponse>(`${this.apiUrl}/user/${userId}`).pipe(
      tap(r => console.log(`Loaded ${r.workflows.length} user workflows`)),
      catchError(err => { console.error('Error loading user workflows', err); throw err; })
    );
  }

  // Get enrolled workflows for a user
  getEnrolledWorkflows(userId: number): Observable<Workflow[]> {
    console.log(`Fetching enrolled workflows for user ${userId}`);
    return this.http.get<Workflow[]>(`${this.apiUrl}/enrolled/${userId}`).pipe(
      tap(workflows => {
        console.log(`Loaded ${workflows.length} enrolled workflows`);
        this.enrolledWorkflowsSubject.next(workflows);
      }),
      catchError(err => { console.error('Error loading enrolled workflows', err); throw err; })
    );
  }

  // Get workflow details with lessons
  getWorkflow(workflowId: number, userId?: number): Observable<WorkflowDetailResponse> {
    console.log(`Fetching workflow ${workflowId}`);
    let url = `${this.apiUrl}/${workflowId}`;
    if (userId) url += `?user_id=${userId}`;

    return this.http.get<WorkflowDetailResponse>(url).pipe(
      tap(workflow => {
        console.log('Loaded workflow', workflow);
        this.currentWorkflowSubject.next(workflow);
      }),
      catchError(err => { console.error('Error loading workflow', err); throw err; })
    );
  }

  // Create a new workflow
  createWorkflow(workflow: CreateWorkflowRequest, userId: number): Observable<Workflow> {
    console.log('Creating workflow', workflow);
    return this.http.post<Workflow>(this.apiUrl, {
      ...workflow,
      creator_id: userId
    }).pipe(
      tap(() => console.log('Workflow created')),
      catchError(err => { console.error('Error creating workflow', err); throw err; })
    );
  }

  // Update workflow
  updateWorkflow(workflowId: number, updates: Partial<CreateWorkflowRequest>): Observable<Workflow> {
    console.log(`Updating workflow ${workflowId}`);
    return this.http.put<Workflow>(`${this.apiUrl}/${workflowId}`, updates).pipe(
      tap(() => console.log('Workflow updated')),
      catchError(err => { console.error('Error updating workflow', err); throw err; })
    );
  }

  // Delete workflow
  deleteWorkflow(workflowId: number): Observable<any> {
    console.log(`Deleting workflow ${workflowId}`);
    return this.http.delete(`${this.apiUrl}/${workflowId}`).pipe(
      tap(() => console.log('Workflow deleted')),
      catchError(err => { console.error('Error deleting workflow', err); throw err; })
    );
  }

  // ========== Enrollment & Progress ==========

  // Enroll in a workflow
  enrollInWorkflow(workflowId: number, userId: number): Observable<UserWorkflowProgress> {
    console.log(`Enrolling user ${userId} in workflow ${workflowId}`);
    return this.http.post<UserWorkflowProgress>(`${this.apiUrl}/${workflowId}/enroll`, {
      user_id: userId
    }).pipe(
      tap(() => console.log('Enrolled in workflow')),
      catchError(err => { console.error('Error enrolling in workflow', err); throw err; })
    );
  }

  // Unenroll from a workflow
  unenrollFromWorkflow(workflowId: number, userId: number): Observable<any> {
    console.log(`Unenrolling user ${userId} from workflow ${workflowId}`);
    return this.http.delete(`${this.apiUrl}/${workflowId}/enroll/${userId}`).pipe(
      tap(() => console.log('Unenrolled from workflow')),
      catchError(err => { console.error('Error unenrolling from workflow', err); throw err; })
    );
  }

  // Get user's progress in a workflow
  getUserWorkflowProgress(workflowId: number, userId: number): Observable<UserWorkflowProgress> {
    console.log(`Fetching workflow progress for workflow ${workflowId} user ${userId}`);
    return this.http.get<UserWorkflowProgress>(`${this.apiUrl}/${workflowId}/progress/${userId}`).pipe(
      tap(progress => console.log('Loaded progress', progress)),
      catchError(err => { console.error('Error loading progress', err); throw err; })
    );
  }

  // ========== Lesson Management ==========

  // Get lesson details
  getLesson(lessonId: number, userId?: number): Observable<Lesson & { flashcards: LessonFlashcard[], user_progress?: UserLessonProgress }> {
    console.log(`Fetching lesson ${lessonId}`);
    let url = `${this.apiUrl}/lessons/${lessonId}`;
    if (userId) url += `?user_id=${userId}`;
    return this.http.get<Lesson & { flashcards: LessonFlashcard[], user_progress?: UserLessonProgress }>(url).pipe(
      tap(l => console.log('Loaded lesson', l)),
      catchError(err => { console.error('Error loading lesson', err); throw err; })
    );
  }

  // Create a new lesson
  createLesson(lesson: CreateLessonRequest): Observable<Lesson> {
    console.log('Creating lesson', lesson);
    return this.http.post<Lesson>(`${this.apiUrl}/${lesson.workflow_id}/lessons`, lesson).pipe(
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
  reorderLessons(workflowId: number, lessonIds: number[]): Observable<any> {
    console.log(`Reordering lessons for workflow ${workflowId}`);
    return this.http.post(`${this.apiUrl}/${workflowId}/lessons/reorder`, {
      lesson_ids: lessonIds
    }).pipe(
      tap(() => console.log('Lessons reordered')),
      catchError(err => { console.error('Error reordering lessons', err); throw err; })
    );
  }

  // ========== Lesson Progress ==========

  // Mark lesson as started
  startLesson(lessonId: number, userId: number): Observable<UserLessonProgress> {
    console.log(`Starting lesson ${lessonId}`);
    return this.http.post<UserLessonProgress>(`${this.apiUrl}/lessons/${lessonId}/start`, {
      user_id: userId
    }).pipe(
      tap(() => console.log('Lesson started')),
      catchError(err => { console.error('Error starting lesson', err); throw err; })
    );
  }

  // Mark lesson as completed
  completeLesson(lessonId: number, userId: number): Observable<UserLessonProgress> {
    console.log(`Completing lesson ${lessonId}`);
    return this.http.post<UserLessonProgress>(`${this.apiUrl}/lessons/${lessonId}/complete`, {
      user_id: userId
    }).pipe(
      tap(() => console.log('Lesson completed')),
      catchError(err => { console.error('Error completing lesson', err); throw err; })
    );
  }

  // Get user's lesson progress
  getUserLessonProgress(lessonId: number, userId: number): Observable<UserLessonProgress> {
    console.log(`Fetching lesson progress for lesson ${lessonId} user ${userId}`);
    return this.http.get<UserLessonProgress>(`${this.apiUrl}/lessons/${lessonId}/progress/${userId}`).pipe(
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
    console.log(`Adding flashcards to queue for lesson ${request.lesson_id}`);
    return this.http.post(`${this.apiUrl}/lessons/${request.lesson_id}/flashcards/queue`, {
      ...request,
      user_id: userId
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

  // ========== Ratings ==========

  getWorkflowRating(workflowId: number, userId?: number): Observable<{ average_rating: number; user_rating?: number }> {
    let url = `${this.apiUrl}/${workflowId}/rating`;
    if (userId) url += `?user_id=${userId}`;
    return this.http.get<{ average_rating: number; user_rating?: number }>(url);
  }

  submitWorkflowRating(workflowId: number, userId: number, rating: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${workflowId}/rating`, { user_id: userId, rating });
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