import { RouterReducerState } from '@ngrx/router-store';
import { BibleTrackerState } from './bible-tracker/models/bible-tracker.model';
import { DecksState as DeckState } from './decks/models/deck.model';
import { PracticeSessionState } from './practice-session/models/practice-session.model';
import { UIState } from './ui/ui.state';

// Root state interface - all feature states will be added here
export interface AppState {
  router: RouterReducerState;
  auth: AuthState;
  bibleTracker: BibleTrackerState;
  decks: DeckState;
  practiceSession: PracticeSessionState;
  courses: CourseState;
  atlas: AtlasState;
  ui: UIState;
  featureRequests: FeatureRequestState;
}

// Shared state interfaces used across features
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

export interface EntityLoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  lastFetch: Date | null;
}

// Placeholder interfaces for features to be migrated to NgRx
export interface AuthState {}
export interface CourseState {}
export interface AtlasState {}
export interface FeatureRequestState {}
