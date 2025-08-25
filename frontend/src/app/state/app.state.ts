import { RouterReducerState } from '@ngrx/router-store';
import { BibleMemorizationState } from "./bible-tracker/models/bible-memorization.model";
import { BibleTrackerState } from './bible-tracker/models/bible-tracker.model';
import { DecksState as DeckState } from './decks/models/deck.model';
import { PracticeSessionState } from './practice-session/models/practice-session.model';
import { UIState } from './ui/ui.state';
import { VerseWorkspaceState } from '../features/verse-workspace/state/verse-workspace.state';
import { CoursesState } from './courses/models/course.state';
import { AuthState } from './auth/models/auth.model';
import { AtlasState } from './atlas/models/atlas.state';
import { FeatureRequestState } from './feature-requests/models/feature-request.state';

// Root state interface - all feature states will be added here
export interface AppState {
  router: RouterReducerState;
  auth: AuthState;
  bibleMemorization: BibleMemorizationState;
  decks: DeckState;
  practiceSession: PracticeSessionState;
  courses: CoursesState;
  atlas: AtlasState;
  ui: UIState;
  featureRequests: FeatureRequestState;
  verseWorkspace: VerseWorkspaceState;
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

