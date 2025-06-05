// frontend/src/app/core/services/feature-request.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  FeatureRequest,
  CreateFeatureRequest,
  FeatureRequestListResponse,
  FeatureRequestVote,
  FeatureRequestComment,
  RequestType,
  RequestStatus
} from '../models/feature-request.model';

@Injectable({
  providedIn: 'root'
})
export class FeatureRequestService {
  private apiUrl = `${environment.apiUrl}/feature-requests`;
  
  // Subject to track when requests are updated
  private requestsUpdated = new BehaviorSubject<boolean>(false);
  public requestsUpdated$ = this.requestsUpdated.asObservable();

  constructor(private http: HttpClient) {}

  // Get all feature requests with optional filters
  getFeatureRequests(
    page: number = 1,
    perPage: number = 20,
    type?: RequestType,
    status?: RequestStatus,
    sortBy: string = 'upvotes',
    search?: string
  ): Observable<FeatureRequestListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString())
      .set('sort_by', sortBy);

    if (type) {
      params = params.set('type', type);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<FeatureRequestListResponse>(this.apiUrl, { params });
  }

  // Get a single feature request
  getFeatureRequest(id: number): Observable<FeatureRequest> {
    return this.http.get<FeatureRequest>(`${this.apiUrl}/${id}`);
  }

  // Create a new feature request
  createFeatureRequest(request: CreateFeatureRequest, userId: number): Observable<FeatureRequest> {
    const payload = {
      ...request,
      user_id: userId
    };

    return this.http.post<FeatureRequest>(this.apiUrl, payload).pipe(
      tap(() => this.requestsUpdated.next(true))
    );
  }

  // Vote on a feature request
  voteOnRequest(requestId: number, voteType: 'up' | 'down', userId: number): Observable<any> {
    const payload: FeatureRequestVote = {
      request_id: requestId,
      user_id: userId,
      vote_type: voteType
    };

    return this.http.post(`${this.apiUrl}/${requestId}/vote`, payload).pipe(
      tap(() => this.requestsUpdated.next(true))
    );
  }

  // Remove vote from a feature request
  removeVote(requestId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${requestId}/vote/${userId}`).pipe(
      tap(() => this.requestsUpdated.next(true))
    );
  }

  // Get comments for a feature request
  getComments(requestId: number): Observable<FeatureRequestComment[]> {
    return this.http.get<FeatureRequestComment[]>(`${this.apiUrl}/${requestId}/comments`);
  }

  // Add a comment to a feature request
  addComment(requestId: number, comment: string, userId: number): Observable<FeatureRequestComment> {
    const payload = {
      comment,
      user_id: userId
    };

    return this.http.post<FeatureRequestComment>(`${this.apiUrl}/${requestId}/comments`, payload);
  }

  // Get user's feature requests
  getUserRequests(userId: number): Observable<FeatureRequest[]> {
    return this.http.get<FeatureRequest[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Get trending feature requests (most upvoted in last 7 days)
  getTrendingRequests(limit: number = 5): Observable<FeatureRequest[]> {
    const params = new HttpParams()
      .set('trending', 'true')
      .set('limit', limit.toString());

    return this.http.get<FeatureRequest[]>(`${this.apiUrl}/trending`, { params });
  }

  // Get suggested tags for feature requests
  getSuggestedTags(): string[] {
    return [
      'bible-tracker',
      'memorization',
      'flashcards',
      'flow-method',
      'ui-improvement',
      'performance',
      'mobile',
      'desktop',
      'sync',
      'offline',
      'social',
      'gamification',
      'statistics',
      'audio',
      'translations',
      'apocrypha',
      'search',
      'navigation',
      'accessibility',
      'integrations'
    ];
  }
}