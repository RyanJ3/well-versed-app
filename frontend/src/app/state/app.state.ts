import { RouterReducerState } from '@ngrx/router-store';
import { BibleTrackerState } from './bible-tracker/models/bible-tracker.model';

// Root state interface - all feature states will be added here
export interface AppState {
  router: RouterReducerState;
  bibleTracker: BibleTrackerState;
  // decks: DeckState;
  // practiceSession: PracticeSessionState;
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
