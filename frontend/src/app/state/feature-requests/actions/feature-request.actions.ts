import { createAction, props } from '@ngrx/store';
import { FeatureRequest, CreateFeatureRequest, FeatureRequestComment, RequestType, RequestStatus } from '@models/feature-request.model';

// Load Feature Requests
export const loadFeatureRequests = createAction(
  '[Feature Requests] Load Feature Requests',
  props<{ 
    page?: number; 
    perPage?: number; 
    requestType?: RequestType; 
    status?: RequestStatus; 
    sortBy?: string; 
    search?: string 
  }>()
);

export const loadFeatureRequestsSuccess = createAction(
  '[Feature Requests] Load Feature Requests Success',
  props<{ requests: FeatureRequest[]; total: number; page: number; perPage: number }>()
);

export const loadFeatureRequestsFailure = createAction(
  '[Feature Requests] Load Feature Requests Failure',
  props<{ error: string }>()
);

// Load Single Request
export const loadFeatureRequest = createAction(
  '[Feature Requests] Load Feature Request',
  props<{ requestId: number }>()
);

export const loadFeatureRequestSuccess = createAction(
  '[Feature Requests] Load Feature Request Success',
  props<{ request: FeatureRequest }>()
);

export const loadFeatureRequestFailure = createAction(
  '[Feature Requests] Load Feature Request Failure',
  props<{ error: string }>()
);

// Create Request
export const createFeatureRequest = createAction(
  '[Feature Requests] Create Feature Request',
  props<{ request: CreateFeatureRequest; userId: number }>()
);

export const createFeatureRequestSuccess = createAction(
  '[Feature Requests] Create Feature Request Success',
  props<{ request: FeatureRequest }>()
);

export const createFeatureRequestFailure = createAction(
  '[Feature Requests] Create Feature Request Failure',
  props<{ error: string }>()
);

// Voting
export const voteOnRequest = createAction(
  '[Feature Requests] Vote On Request',
  props<{ requestId: number; voteType: 'up' | 'down'; userId: number }>()
);

export const voteOnRequestSuccess = createAction(
  '[Feature Requests] Vote On Request Success',
  props<{ requestId: number; voteType: 'up' | 'down' }>()
);

export const voteOnRequestFailure = createAction(
  '[Feature Requests] Vote On Request Failure',
  props<{ error: string }>()
);

export const removeVote = createAction(
  '[Feature Requests] Remove Vote',
  props<{ requestId: number; userId: number }>()
);

export const removeVoteSuccess = createAction(
  '[Feature Requests] Remove Vote Success',
  props<{ requestId: number }>()
);

export const removeVoteFailure = createAction(
  '[Feature Requests] Remove Vote Failure',
  props<{ error: string }>()
);

// Comments
export const loadComments = createAction(
  '[Feature Requests] Load Comments',
  props<{ requestId: number }>()
);

export const loadCommentsSuccess = createAction(
  '[Feature Requests] Load Comments Success',
  props<{ requestId: number; comments: FeatureRequestComment[] }>()
);

export const loadCommentsFailure = createAction(
  '[Feature Requests] Load Comments Failure',
  props<{ error: string }>()
);

export const addComment = createAction(
  '[Feature Requests] Add Comment',
  props<{ requestId: number; comment: string; userId: number }>()
);

export const addCommentSuccess = createAction(
  '[Feature Requests] Add Comment Success',
  props<{ requestId: number; comment: FeatureRequestComment }>()
);

export const addCommentFailure = createAction(
  '[Feature Requests] Add Comment Failure',
  props<{ error: string }>()
);

// Trending
export const loadTrendingRequests = createAction(
  '[Feature Requests] Load Trending Requests',
  props<{ limit?: number }>()
);

export const loadTrendingRequestsSuccess = createAction(
  '[Feature Requests] Load Trending Requests Success',
  props<{ requests: FeatureRequest[] }>()
);

export const loadTrendingRequestsFailure = createAction(
  '[Feature Requests] Load Trending Requests Failure',
  props<{ error: string }>()
);

// User Requests
export const loadUserRequests = createAction(
  '[Feature Requests] Load User Requests',
  props<{ userId: number }>()
);

export const loadUserRequestsSuccess = createAction(
  '[Feature Requests] Load User Requests Success',
  props<{ requests: FeatureRequest[] }>()
);

export const loadUserRequestsFailure = createAction(
  '[Feature Requests] Load User Requests Failure',
  props<{ error: string }>()
);

// UI Actions
export const selectRequest = createAction(
  '[Feature Requests] Select Request',
  props<{ requestId: number }>()
);

export const setSearchQuery = createAction(
  '[Feature Requests] Set Search Query',
  props<{ query: string }>()
);

export const setFilters = createAction(
  '[Feature Requests] Set Filters',
  props<{ requestType?: RequestType | null; status?: RequestStatus | null; sortBy?: string }>()
);

export const clearError = createAction('[Feature Requests] Clear Error');