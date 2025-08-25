import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FeatureRequestState } from '../models/feature-request.state';
import { featureRequestAdapter } from '../models/feature-request.state';

export const selectFeatureRequestState = createFeatureSelector<FeatureRequestState>('featureRequests');

const { selectIds, selectEntities, selectAll, selectTotal } = featureRequestAdapter.getSelectors();

export const selectAllFeatureRequests = createSelector(
  selectFeatureRequestState,
  selectAll
);

export const selectFeatureRequestEntities = createSelector(
  selectFeatureRequestState,
  selectEntities
);

export const selectFeatureRequestIds = createSelector(
  selectFeatureRequestState,
  selectIds
);

export const selectFeatureRequestsTotal = createSelector(
  selectFeatureRequestState,
  selectTotal
);

export const selectSelectedRequestId = createSelector(
  selectFeatureRequestState,
  (state) => state.selectedRequestId
);

export const selectSelectedRequest = createSelector(
  selectFeatureRequestEntities,
  selectSelectedRequestId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

export const selectFeatureRequestsLoading = createSelector(
  selectFeatureRequestState,
  (state) => state.loading
);

export const selectFeatureRequestsError = createSelector(
  selectFeatureRequestState,
  (state) => state.error
);

export const selectSearchQuery = createSelector(
  selectFeatureRequestState,
  (state) => state.searchQuery
);

export const selectFilters = createSelector(
  selectFeatureRequestState,
  (state) => state.filters
);

export const selectPagination = createSelector(
  selectFeatureRequestState,
  (state) => state.pagination
);

export const selectUserVotes = createSelector(
  selectFeatureRequestState,
  (state) => state.userVotes
);

export const selectTrendingRequests = createSelector(
  selectFeatureRequestState,
  (state) => state.trendingRequests
);

export const selectFilteredRequests = createSelector(
  selectAllFeatureRequests,
  selectSearchQuery,
  selectFilters,
  (requests, searchQuery, filters) => {
    let filtered = requests;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(query) ||
        request.description.toLowerCase().includes(query)
      );
    }
    
    if (filters.type) {
      filtered = filtered.filter(request => request.type === filters.type);
    }
    
    if (filters.status) {
      filtered = filtered.filter(request => request.status === filters.status);
    }
    
    if (filters.sortBy === 'upvotes') {
      filtered = [...filtered].sort((a, b) => b.upvotes - a.upvotes);
    } else if (filters.sortBy === 'recent') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    return filtered;
  }
);

export const selectUserVoteForRequest = (requestId: number) => createSelector(
  selectUserVotes,
  (votes) => votes[requestId] || null
);