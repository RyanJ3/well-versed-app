// frontend/src/app/core/services/workflow.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WorkflowCreate {
  name: string;
  description?: string;
  is_public: boolean;
}

export interface WorkflowResponse {
  workflow_id: number;
  creator_id: number;
  creator_name: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  lesson_count: number;
}

export interface WorkflowListResponse {
  total: number;
  workflows: WorkflowResponse[];
}

export interface LessonCreate {
  title: string;
  video_url?: string;
  article_text?: string;
  article_url?: string;
  audio_url?: string;
  position?: number;
}

export interface LessonResponse {
  lesson_id: number;
  workflow_id: number;
  position: number;
  title: string;
  video_url?: string;
  article_text?: string;
  article_url?: string;
  audio_url?: string;
  created_at: string;
}

export interface LessonListResponse {
  total: number;
  lessons: LessonResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private apiUrl = `${environment.apiUrl}/workflows`;

  constructor(private http: HttpClient) {}

  createWorkflow(workflow: WorkflowCreate): Observable<WorkflowResponse> {
    return this.http.post<WorkflowResponse>(this.apiUrl, workflow);
  }

  getPublicWorkflows(): Observable<WorkflowListResponse> {
    return this.http.get<WorkflowListResponse>(`${this.apiUrl}/public`);
  }

  getWorkflow(id: number): Observable<WorkflowResponse> {
    return this.http.get<WorkflowResponse>(`${this.apiUrl}/${id}`);
  }

  addLesson(
    workflowId: number,
    lesson: LessonCreate,
  ): Observable<LessonResponse> {
    return this.http.post<LessonResponse>(
      `${this.apiUrl}/${workflowId}/lessons`,
      lesson,
    );
  }

  getLessons(workflowId: number): Observable<LessonListResponse> {
    return this.http.get<LessonListResponse>(
      `${this.apiUrl}/${workflowId}/lessons`,
    );
  }
}
