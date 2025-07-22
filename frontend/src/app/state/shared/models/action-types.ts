// Helper type for creating consistent action groups
export interface ActionGroup<T extends string> {
  source: T;
  events: Record<string, any>;
}

// Helper for async actions
export interface AsyncActionSet<T> {
  request: T;
  success: T;
  failure: T;
}

// Pagination model
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Sort model
export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// Filter model
export interface FilterState {
  [key: string]: any;
}
