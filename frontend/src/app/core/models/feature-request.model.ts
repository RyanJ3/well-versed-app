// frontend/src/app/core/models/feature-request.model.ts

export enum RequestType {
  BUG = 'bug',
  ENHANCEMENT = 'enhancement',
  FEATURE = 'feature'
}

export enum RequestStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLOSED = 'closed',
  DUPLICATE = 'duplicate'
}

export enum RequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface FeatureRequest {
  id: number;
  title: string;
  description: string;
  type: RequestType;
  status: RequestStatus;
  priority?: RequestPriority;
  upvotes: number;
  downvotes: number;
  user_id: number;
  user_name: string;
  created_at: string;
  updated_at?: string;
  has_voted?: boolean;
  user_vote?: 'up' | 'down' | null;
  tags?: string[];
  comments_count?: number;
}

export interface CreateFeatureRequest {
  title: string;
  description: string;
  type: RequestType;
  tags?: string[];
}

export interface FeatureRequestVote {
  request_id: number;
  user_id: number;
  vote_type: 'up' | 'down';
}

export interface FeatureRequestComment {
  id: number;
  request_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface FeatureRequestListResponse {
  total: number;
  requests: FeatureRequest[];
  page: number;
  per_page: number;
}