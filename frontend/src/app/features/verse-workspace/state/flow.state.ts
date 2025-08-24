import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { BaseVerse, MemorizationVerse, CrossReferenceVerse, TopicalVerse } from '../models/verse-types.model';

// Flow modes
export type FlowMode = 'memorization' | 'crossReferences' | 'topical';
export type LayoutMode = 'grid' | 'single';
export type FilterType = 'all' | 'memorized' | 'toLearn' | 'review';

// Verse entity state
export interface VerseEntityState extends EntityState<BaseVerse> {
  selectedVerseIds: string[];
  memorizedVerseIds: string[];
  lastReviewDates: { [verseCode: string]: number };
}

// UI State
export interface FlowUIState {
  mode: FlowMode;
  fontSize: number;
  layoutMode: LayoutMode;
  showFullText: boolean;
  showVerseNumbers: boolean;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  contextMenu: {
    visible: boolean;
    position: { x: number; y: number } | null;
    verseCode: string | null;
  };
}

// Navigation State
export interface FlowNavigationState {
  currentBookId: number;
  currentBookName: string;
  currentChapter: number;
  totalChapters: number;
  totalVerses: number;
  availableBooks: Array<{ id: number; name: string; testament: string }>;
  navigationHistory: Array<{ bookId: number; chapter: number; timestamp: number }>;
}

// Filter State
export interface FlowFilterState {
  activeFilter: FilterType;
  searchTerm: string;
  showMemorizedOnly: boolean;
  showToLearnOnly: boolean;
  showReviewOnly: boolean;
  customFilters: Array<{
    id: string;
    name: string;
    predicate: string;
  }>;
}

// Study Session State
export interface FlowStudyState {
  isActive: boolean;
  sessionId: string | null;
  sessionType: 'learn' | 'review' | 'test';
  verseCodes: string[];
  currentIndex: number;
  correctAnswers: number;
  totalAttempts: number;
  startTime: number | null;
  endTime: number | null;
}

// Cross References State
export interface FlowCrossReferencesState {
  sourceVerseCode: string | null;
  references: CrossReferenceVerse[];
  loadingReferences: boolean;
  selectedReferenceCode: string | null;
  confidenceThreshold: number;
}

// Topical State
export interface FlowTopicalState {
  currentTopicId: string | null;
  currentTopicName: string | null;
  topicalVerses: TopicalVerse[];
  loadingTopical: boolean;
  availableTopics: Array<{ id: string; name: string; count: number }>;
  relevanceThreshold: number;
}

// Deck State
export interface FlowDeckState {
  decks: Array<{
    id: string;
    name: string;
    verseCount: number;
    lastStudied: number | null;
  }>;
  activeDeckId: string | null;
  pendingAdditions: string[];
}

// Settings State
export interface FlowSettingsState {
  defaultTranslation: string;
  autoAdvanceDelay: number;
  hideMemorizedByDefault: boolean;
  enableKeyboardShortcuts: boolean;
  enableSwipeGestures: boolean;
  confirmBeforeDelete: boolean;
  studyRepetitions: number;
  theme: 'light' | 'dark' | 'auto';
}

// Complete Flow State
export interface FlowState {
  verses: VerseEntityState;
  ui: FlowUIState;
  navigation: FlowNavigationState;
  filters: FlowFilterState;
  study: FlowStudyState;
  crossReferences: FlowCrossReferencesState;
  topical: FlowTopicalState;
  decks: FlowDeckState;
  settings: FlowSettingsState;
}

// Entity adapter for verses
export const verseAdapter = createEntityAdapter<BaseVerse>({
  selectId: (verse) => verse.verseCode,
  sortComparer: (a, b) => a.verseCode.localeCompare(b.verseCode)
});

// Initial states
export const initialVerseState: VerseEntityState = verseAdapter.getInitialState({
  selectedVerseIds: [],
  memorizedVerseIds: [],
  lastReviewDates: {}
});

export const initialUIState: FlowUIState = {
  mode: 'memorization',
  fontSize: 16,
  layoutMode: 'grid',
  showFullText: false,
  showVerseNumbers: true,
  isLoading: false,
  loadingMessage: '',
  error: null,
  contextMenu: {
    visible: false,
    position: null,
    verseCode: null
  }
};

export const initialNavigationState: FlowNavigationState = {
  currentBookId: 1,
  currentBookName: 'Genesis',
  currentChapter: 1,
  totalChapters: 50,
  totalVerses: 0,
  availableBooks: [],
  navigationHistory: []
};

export const initialFilterState: FlowFilterState = {
  activeFilter: 'all',
  searchTerm: '',
  showMemorizedOnly: false,
  showToLearnOnly: false,
  showReviewOnly: false,
  customFilters: []
};

export const initialStudyState: FlowStudyState = {
  isActive: false,
  sessionId: null,
  sessionType: 'learn',
  verseCodes: [],
  currentIndex: 0,
  correctAnswers: 0,
  totalAttempts: 0,
  startTime: null,
  endTime: null
};

export const initialCrossReferencesState: FlowCrossReferencesState = {
  sourceVerseCode: null,
  references: [],
  loadingReferences: false,
  selectedReferenceCode: null,
  confidenceThreshold: 0.5
};

export const initialTopicalState: FlowTopicalState = {
  currentTopicId: null,
  currentTopicName: null,
  topicalVerses: [],
  loadingTopical: false,
  availableTopics: [],
  relevanceThreshold: 0.7
};

export const initialDeckState: FlowDeckState = {
  decks: [],
  activeDeckId: null,
  pendingAdditions: []
};

export const initialSettingsState: FlowSettingsState = {
  defaultTranslation: 'ESV',
  autoAdvanceDelay: 3000,
  hideMemorizedByDefault: false,
  enableKeyboardShortcuts: true,
  enableSwipeGestures: false,
  confirmBeforeDelete: true,
  studyRepetitions: 3,
  theme: 'light'
};

export const initialFlowState: FlowState = {
  verses: initialVerseState,
  ui: initialUIState,
  navigation: initialNavigationState,
  filters: initialFilterState,
  study: initialStudyState,
  crossReferences: initialCrossReferencesState,
  topical: initialTopicalState,
  decks: initialDeckState,
  settings: initialSettingsState
};