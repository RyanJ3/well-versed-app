import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {
  StartSessionRequest,
  ActiveSession,
  SubmitResponseRequest,
  CardResponse,
  SessionSummary,
  CompletedSession
} from '../../state/practice-session/models/practice-session.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PracticeService {
  private apiUrl = `${environment.apiUrl}/practice`;

  constructor(private http: HttpClient) {}

  startSession(request: StartSessionRequest): Observable<ActiveSession> {
    // Placeholder implementation
    return this.http.post<ActiveSession>(`${this.apiUrl}/sessions`, request);
  }

  submitResponse(req: SubmitResponseRequest): Observable<CardResponse> {
    return this.http.post<CardResponse>(`${this.apiUrl}/responses`, req);
  }

  completeSession(sessionId: string): Observable<SessionSummary> {
    return this.http.post<SessionSummary>(`${this.apiUrl}/sessions/${sessionId}/complete`, {});
  }

  getSessionHistory(): Observable<CompletedSession[]> {
    return this.http.get<CompletedSession[]>(`${this.apiUrl}/sessions`);
  }
}
