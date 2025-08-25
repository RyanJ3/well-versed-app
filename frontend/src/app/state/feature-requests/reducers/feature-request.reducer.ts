import { createReducer, on } from '@ngrx/store';
import { featureRequestAdapter, initialFeatureRequestState } from '../models/feature-request.state';
import * as FeatureRequestActions from '../actions/feature-request.actions';

export const featureRequestReducer = createReducer(
  initialFeatureRequestState,
  
  // Load Feature Requests
  on(FeatureRequestActions.loadFeatureRequests, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(FeatureRequestActions.loadFeatureRequestsSuccess, (state, { requests, total, page, perPage }) => 
    featureRequestAdapter.setAll(requests, {
      ...state,
      loading: false,
      pagination: { page, perPage, total }
    })
  ),
  
  on(FeatureRequestActions.loadFeatureRequestsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load Single Request
  on(FeatureRequestActions.loadFeatureRequest, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(FeatureRequestActions.loadFeatureRequestSuccess, (state, { request }) => 
    featureRequestAdapter.upsertOne(request, {
      ...state,
      loading: false,
      selectedRequestId: request.id
    })
  ),
  
  on(FeatureRequestActions.loadFeatureRequestFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Create Request
  on(FeatureRequestActions.createFeatureRequest, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(FeatureRequestActions.createFeatureRequestSuccess, (state, { request }) => 
    featureRequestAdapter.addOne(request, {
      ...state,
      loading: false
    })
  ),
  
  on(FeatureRequestActions.createFeatureRequestFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Voting
  on(FeatureRequestActions.voteOnRequest, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(FeatureRequestActions.voteOnRequestSuccess, (state, { requestId, voteType }) => {
    const request = state.entities[requestId];
    if (!request) return state;
    
    const previousVote = state.userVotes[requestId];
    let upvotesDelta = 0;
    let downvotesDelta = 0;
    
    if (previousVote === 'up' && voteType === 'down') {
      upvotesDelta = -1;
      downvotesDelta = 1;
    } else if (previousVote === 'down' && voteType === 'up') {
      upvotesDelta = 1;
      downvotesDelta = -1;
    } else if (!previousVote) {
      if (voteType === 'up') upvotesDelta = 1;
      else downvotesDelta = 1;
    }
    
    return featureRequestAdapter.updateOne(
      {
        id: requestId,
        changes: {
          upvotes: request.upvotes + upvotesDelta,
          downvotes: request.downvotes + downvotesDelta
        }
      },
      {
        ...state,
        loading: false,
        userVotes: { ...state.userVotes, [requestId]: voteType }
      }
    );
  }),
  
  on(FeatureRequestActions.voteOnRequestFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(FeatureRequestActions.removeVote, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(FeatureRequestActions.removeVoteSuccess, (state, { requestId }) => {
    const request = state.entities[requestId];
    if (!request) return state;
    
    const previousVote = state.userVotes[requestId];
    let upvotesDelta = 0;
    let downvotesDelta = 0;
    
    if (previousVote === 'up') upvotesDelta = -1;
    else if (previousVote === 'down') downvotesDelta = -1;
    
    const { [requestId]: removed, ...remainingVotes } = state.userVotes;
    
    return featureRequestAdapter.updateOne(
      {
        id: requestId,
        changes: {
          upvotes: request.upvotes + upvotesDelta,
          downvotes: request.downvotes + downvotesDelta
        }
      },
      {
        ...state,
        loading: false,
        userVotes: remainingVotes
      }
    );
  }),
  
  on(FeatureRequestActions.removeVoteFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Trending
  on(FeatureRequestActions.loadTrendingRequests, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(FeatureRequestActions.loadTrendingRequestsSuccess, (state, { requests }) => ({
    ...state,
    loading: false,
    trendingRequests: requests
  })),
  
  on(FeatureRequestActions.loadTrendingRequestsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // User Requests
  on(FeatureRequestActions.loadUserRequests, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(FeatureRequestActions.loadUserRequestsSuccess, (state, { requests }) => 
    featureRequestAdapter.upsertMany(requests, {
      ...state,
      loading: false
    })
  ),
  
  on(FeatureRequestActions.loadUserRequestsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // UI Actions
  on(FeatureRequestActions.selectRequest, (state, { requestId }) => ({
    ...state,
    selectedRequestId: requestId
  })),
  
  on(FeatureRequestActions.setSearchQuery, (state, { query }) => ({
    ...state,
    searchQuery: query
  })),
  
  on(FeatureRequestActions.setFilters, (state, { requestType, status, sortBy }) => ({
    ...state,
    filters: {
      type: requestType !== undefined ? requestType : state.filters.type,
      status: status !== undefined ? status : state.filters.status,
      sortBy: sortBy ?? state.filters.sortBy
    }
  })),
  
  on(FeatureRequestActions.clearError, (state) => ({
    ...state,
    error: null
  }))
);