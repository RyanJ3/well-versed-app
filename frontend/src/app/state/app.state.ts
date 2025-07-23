import { RouterReducerState } from '@ngrx/router-store';
import { BibleTrackerState } from './bible-tracker/models/bible-tracker.model';
import { DecksState } from './decks/models/deck.model';
import { PracticeSessionState } from './practice-session/models/practice-session.model';

// Root state interface - all feature states will be added here
export interface AppState {
  router: RouterReducerState;
  bibleTracker: BibleTrackerState;
  decks: DecksState;
  practiceSession: PracticeSessionState;
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
