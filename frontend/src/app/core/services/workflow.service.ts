// frontend/src/app/core/services/workflow.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
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
    let url = `${this.apiUrl}/public?page=${page}&per_page=${perPage}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tags?.length) url += `&tags=${tags.join(',')}`;
    
    return this.http.get<WorkflowListResponse>(url);
  }

  // Get workflows created by a user
  getUserWorkflows(userId: number): Observable<WorkflowListResponse> {
    return this.http.get<WorkflowListResponse>(`${this.apiUrl}/user/${userId}`);
  }

  // Get enrolled workflows for a user
  getEnrolledWorkflows(userId: number): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(`${this.apiUrl}/enrolled/${userId}`).pipe(
      tap(workflows => this.enrolledWorkflowsSubject.next(workflows))
    );
  }

  // Get workflow details with lessons
  getWorkflow(workflowId: number, userId?: number): Observable<WorkflowDetailResponse> {
    let url = `${this.apiUrl}/${workflowId}`;
    if (userId) url += `?user_id=${userId}`;
    
    return this.http.get<WorkflowDetailResponse>(url).pipe(
      tap(workflow => this.currentWorkflowSubject.next(workflow))
    );
  }

  // Create a new workflow
  createWorkflow(workflow: CreateWorkflowRequest, userId: number): Observable<Workflow> {
    return this.http.post<Workflow>(this.apiUrl, {
      ...workflow,
      creator_id: userId
    });
  }

  // Update workflow
  updateWorkflow(workflowId: number, updates: Partial<CreateWorkflowRequest>): Observable<Workflow> {
    return this.http.put<Workflow>(`${this.apiUrl}/${workflowId}`, updates);
  }

  // Delete workflow
  deleteWorkflow(workflowId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${workflowId}`);
  }

  // ========== Enrollment & Progress ==========

  // Enroll in a workflow
  enrollInWorkflow(workflowId: number, userId: number): Observable<UserWorkflowProgress> {
    return this.http.post<UserWorkflowProgress>(`${this.apiUrl}/${workflowId}/enroll`, {
      user_id: userId
    });
  }

  // Unenroll from a workflow
  unenrollFromWorkflow(workflowId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${workflowId}/enroll/${userId}`);
  }

  // Get user's progress in a workflow
  getUserWorkflowProgress(workflowId: number, userId: number): Observable<UserWorkflowProgress> {
    return this.http.get<UserWorkflowProgress>(`${this.apiUrl}/${workflowId}/progress/${userId}`);
  }

  // ========== Lesson Management ==========

  // Get lesson details
  getLesson(lessonId: number, userId?: number): Observable<Lesson & { flashcards: LessonFlashcard[], user_progress?: UserLessonProgress }> {
    let url = `${this.apiUrl}/lessons/${lessonId}`;
    if (userId) url += `?user_id=${userId}`;
    
    return this.http.get<Lesson & { flashcards: LessonFlashcard[], user_progress?: UserLessonProgress }>(url);
  }

  // Create a new lesson
  createLesson(lesson: CreateLessonRequest): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/${lesson.workflow_id}/lessons`, lesson);
  }

  // Update lesson
  updateLesson(lessonId: number, updates: Partial<CreateLessonRequest>): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/lessons/${lessonId}`, updates);
  }

  // Delete lesson
  deleteLesson(lessonId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lessons/${lessonId}`);
  }

  // Reorder lessons
  reorderLessons(workflowId: number, lessonIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${workflowId}/lessons/reorder`, {
      lesson_ids: lessonIds
    });
  }

  // ========== Lesson Progress ==========

  // Mark lesson as started
  startLesson(lessonId: number, userId: number): Observable<UserLessonProgress> {
    return this.http.post<UserLessonProgress>(`${this.apiUrl}/lessons/${lessonId}/start`, {
      user_id: userId
    });
  }

  // Mark lesson as completed
  completeLesson(lessonId: number, userId: number): Observable<UserLessonProgress> {
    return this.http.post<UserLessonProgress>(`${this.apiUrl}/lessons/${lessonId}/complete`, {
      user_id: userId
    });
  }

  // Get user's lesson progress
  getUserLessonProgress(lessonId: number, userId: number): Observable<UserLessonProgress> {
    return this.http.get<UserLessonProgress>(`${this.apiUrl}/lessons/${lessonId}/progress/${userId}`);
  }

  // ========== Flashcards ==========

  // Get flashcards for a lesson
  getLessonFlashcards(lessonId: number): Observable<LessonFlashcard[]> {
    return this.http.get<LessonFlashcard[]>(`${this.apiUrl}/lessons/${lessonId}/flashcards`);
  }

  // Add flashcards to user's queue
  addFlashcardsToQueue(request: AddFlashcardsToQueueRequest, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/lessons/${request.lesson_id}/flashcards/queue`, {
      ...request,
      user_id: userId
    });
  }

  // Create custom flashcards for a lesson
  createLessonFlashcards(lessonId: number, flashcards: Omit<LessonFlashcard, 'id' | 'lesson_id'>[]): Observable<LessonFlashcard[]> {
    return this.http.post<LessonFlashcard[]>(`${this.apiUrl}/lessons/${lessonId}/flashcards`, {
      flashcards
    });
  }

  // Update lesson flashcard requirement count
  updateFlashcardRequirement(lessonId: number, requiredCount: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/lessons/${lessonId}/flashcard-requirement`, {
      required_count: requiredCount
    });
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