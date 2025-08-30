/**
 * Enum for workspace filter modes to provide type safety
 * instead of using string literals throughout the codebase
 */
export enum WorkspaceFilterMode {
  ALL = 'all',
  UNMEMORIZED = 'unmemorized',
  NEEDS_REVIEW = 'needsReview'
}