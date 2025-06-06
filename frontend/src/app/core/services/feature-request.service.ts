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
    console.log(`Fetching feature requests page=${page} perPage=${perPage}`);
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

    return this.http.get<FeatureRequestListResponse>(this.apiUrl, { params }).pipe(
      tap(res => console.log(`Loaded ${res.requests.length} requests`)),
      catchError(err => { console.error('Error loading requests', err); throw err; })
    );
  }

  // Get a single feature request
  getFeatureRequest(id: number): Observable<FeatureRequest> {
    console.log(`Fetching feature request ${id}`);
    return this.http.get<FeatureRequest>(`${this.apiUrl}/${id}`).pipe(
      tap(r => console.log('Loaded request', r)),
      catchError(err => { console.error('Error loading request', err); throw err; })
    );
  }

  // Create a new feature request
  createFeatureRequest(request: CreateFeatureRequest, userId: number): Observable<FeatureRequest> {
    const payload = {
      ...request,
      user_id: userId
    };
    console.log('Creating feature request', payload);
    return this.http.post<FeatureRequest>(this.apiUrl, payload).pipe(
      tap(() => {
        console.log('Feature request created');
        this.requestsUpdated.next(true);
      }),
      catchError(err => { console.error('Error creating request', err); throw err; })
    );
  }

  // Vote on a feature request
  voteOnRequest(requestId: number, voteType: 'up' | 'down', userId: number): Observable<any> {
    const payload: FeatureRequestVote = {
      request_id: requestId,
      user_id: userId,
      vote_type: voteType
    };

    console.log(`Voting ${voteType} on request ${requestId}`);
    return this.http.post(`${this.apiUrl}/${requestId}/vote`, payload).pipe(
      tap(() => {
        console.log('Vote recorded');
        this.requestsUpdated.next(true);
      }),
      catchError(err => { console.error('Error voting', err); throw err; })
    );
  }

  // Remove vote from a feature request
  removeVote(requestId: number, userId: number): Observable<any> {
    console.log(`Removing vote for request ${requestId} by user ${userId}`);
    return this.http.delete(`${this.apiUrl}/${requestId}/vote/${userId}`).pipe(
      tap(() => this.requestsUpdated.next(true)),
      catchError(err => { console.error('Error removing vote', err); throw err; })
    );
  }

  // Get comments for a feature request
  getComments(requestId: number): Observable<FeatureRequestComment[]> {
    console.log(`Fetching comments for request ${requestId}`);
    return this.http.get<FeatureRequestComment[]>(`${this.apiUrl}/${requestId}/comments`).pipe(
      tap(comments => console.log(`Loaded ${comments.length} comments`)),
      catchError(err => { console.error('Error loading comments', err); throw err; })
    );
  }

  // Add a comment to a feature request
  addComment(requestId: number, comment: string, userId: number): Observable<FeatureRequestComment> {
    const payload = {
      comment,
      user_id: userId
    };

    console.log(`Adding comment to request ${requestId}`);
    return this.http.post<FeatureRequestComment>(`${this.apiUrl}/${requestId}/comments`, payload).pipe(
      tap(() => console.log('Comment added')),
      catchError(err => { console.error('Error adding comment', err); throw err; })
    );
  }

  // Get user's feature requests
  getUserRequests(userId: number): Observable<FeatureRequest[]> {
    console.log(`Fetching requests for user ${userId}`);
    return this.http.get<FeatureRequest[]>(`${this.apiUrl}/user/${userId}`).pipe(
      tap(r => console.log(`Loaded ${r.length} user requests`)),
      catchError(err => { console.error('Error loading user requests', err); throw err; })
    );
  }

  // Get trending feature requests (most upvoted in last 7 days)
  getTrendingRequests(limit: number = 5): Observable<FeatureRequest[]> {
    const params = new HttpParams()
      .set('trending', 'true')
      .set('limit', limit.toString());

    console.log(`Fetching trending requests limit=${limit}`);
    return this.http.get<FeatureRequest[]>(`${this.apiUrl}/trending`, { params }).pipe(
      tap(r => console.log(`Loaded ${r.length} trending requests`)),
      catchError(err => { console.error('Error loading trending requests', err); throw err; })
    );
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