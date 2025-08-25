import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { FeatureRequest, RequestType, RequestStatus } from '@models/feature-request.model';

export interface FeatureRequestState extends EntityState<FeatureRequest> {
  selectedRequestId: number | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    type: RequestType | null;
    status: RequestStatus | null;
    sortBy: string;
  };
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
  userVotes: { [requestId: number]: 'up' | 'down' };
  trendingRequests: FeatureRequest[];
}

export const featureRequestAdapter: EntityAdapter<FeatureRequest> = createEntityAdapter<FeatureRequest>({
  selectId: (request: FeatureRequest) => request.id,
  sortComparer: (a: FeatureRequest, b: FeatureRequest) => b.upvotes - a.upvotes
});

export const initialFeatureRequestState: FeatureRequestState = featureRequestAdapter.getInitialState({
  selectedRequestId: null,
  loading: false,
  error: null,
  searchQuery: '',
  filters: {
    type: null,
    status: null,
    sortBy: 'upvotes'
  },
  pagination: {
    page: 1,
    perPage: 20,
    total: 0
  },
  userVotes: {},
  trendingRequests: []
});