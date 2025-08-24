import { createAction, props } from '@ngrx/store';
import { BaseVerse, MemorizationVerse, CrossReferenceVerse, TopicalVerse } from '../models/verse-types.model';
import { FlowMode, FilterType, LayoutMode } from './flow.state';

// Navigation Actions
export const loadChapter = createAction(
  '[Flow] Load Chapter',
  props<{ bookId: number; chapter: number }>()
);

export const loadChapterSuccess = createAction(
  '[Flow] Load Chapter Success',
  props<{ verses: BaseVerse[]; bookName: string; totalChapters: number }>()
);

export const loadChapterFailure = createAction(
  '[Flow] Load Chapter Failure',
  props<{ error: string }>()
);

export const changeBook = createAction(
  '[Flow] Change Book',
  props<{ bookId: number }>()
);

export const changeChapter = createAction(
  '[Flow] Change Chapter',
  props<{ chapter: number }>()
);

export const navigateToVerse = createAction(
  '[Flow] Navigate to Verse',
  props<{ verseCode: string }>()
);

// Mode Actions
export const setMode = createAction(
  '[Flow] Set Mode',
  props<{ mode: FlowMode }>()
);

export const switchToMemorization = createAction('[Flow] Switch to Memorization');
export const switchToCrossReferences = createAction('[Flow] Switch to Cross References');
export const switchToTopical = createAction('[Flow] Switch to Topical');

// Selection Actions
export const selectVerse = createAction(
  '[Flow] Select Verse',
  props<{ verseCode: string; multiSelect?: boolean }>()
);

export const deselectVerse = createAction(
  '[Flow] Deselect Verse',
  props<{ verseCode: string }>()
);

export const selectVerseRange = createAction(
  '[Flow] Select Verse Range',
  props<{ startCode: string; endCode: string }>()
);

export const clearSelection = createAction('[Flow] Clear Selection');

export const selectAll = createAction('[Flow] Select All');

// Memorization Actions
export const toggleMemorized = createAction(
  '[Flow] Toggle Memorized',
  props<{ verseCode: string }>()
);

export const markAsMemorized = createAction(
  '[Flow] Mark as Memorized',
  props<{ verseCodes: string[] }>()
);

export const markAsNotMemorized = createAction(
  '[Flow] Mark as Not Memorized',
  props<{ verseCodes: string[] }>()
);

export const batchToggleMemorized = createAction(
  '[Flow] Batch Toggle Memorized',
  props<{ verseCodes: string[] }>()
);

export const updateMemorizationStats = createAction(
  '[Flow] Update Memorization Stats',
  props<{ stats: { total: number; memorized: number; percentage: number } }>()
);

// Filter Actions
export const setSearchTerm = createAction(
  '[Flow] Set Search Term',
  props<{ searchTerm: string }>()
);

export const setFilter = createAction(
  '[Flow] Set Filter',
  props<{ filter: FilterType }>()
);

export const toggleFilter = createAction(
  '[Flow] Toggle Filter',
  props<{ filterType: 'memorized' | 'toLearn' | 'review' }>()
);

export const clearFilters = createAction('[Flow] Clear Filters');

export const addCustomFilter = createAction(
  '[Flow] Add Custom Filter',
  props<{ filter: { id: string; name: string; predicate: string } }>()
);

// UI Actions
export const setFontSize = createAction(
  '[Flow] Set Font Size',
  props<{ fontSize: number }>()
);

export const setLayoutMode = createAction(
  '[Flow] Set Layout Mode',
  props<{ layoutMode: LayoutMode }>()
);

export const toggleFullText = createAction('[Flow] Toggle Full Text');

export const toggleVerseNumbers = createAction('[Flow] Toggle Verse Numbers');

export const showContextMenu = createAction(
  '[Flow] Show Context Menu',
  props<{ verseCode: string; x: number; y: number }>()
);

export const hideContextMenu = createAction('[Flow] Hide Context Menu');

export const setLoading = createAction(
  '[Flow] Set Loading',
  props<{ isLoading: boolean; message?: string }>()
);

// Study Session Actions
export const startStudySession = createAction(
  '[Flow] Start Study Session',
  props<{ verseCodes: string[]; sessionType: 'learn' | 'review' | 'test' }>()
);

export const endStudySession = createAction(
  '[Flow] End Study Session',
  props<{ completed: boolean }>()
);

export const nextStudyVerse = createAction('[Flow] Next Study Verse');

export const previousStudyVerse = createAction('[Flow] Previous Study Verse');

export const recordStudyAttempt = createAction(
  '[Flow] Record Study Attempt',
  props<{ verseCode: string; correct: boolean }>()
);

// Cross References Actions
export const loadCrossReferences = createAction(
  '[Flow] Load Cross References',
  props<{ verseCode: string }>()
);

export const loadCrossReferencesSuccess = createAction(
  '[Flow] Load Cross References Success',
  props<{ references: CrossReferenceVerse[] }>()
);

export const loadCrossReferencesFailure = createAction(
  '[Flow] Load Cross References Failure',
  props<{ error: string }>()
);

export const selectCrossReference = createAction(
  '[Flow] Select Cross Reference',
  props<{ verseCode: string }>()
);

export const setCrossReferenceConfidenceThreshold = createAction(
  '[Flow] Set Cross Reference Confidence Threshold',
  props<{ threshold: number }>()
);

// Topical Actions
export const loadTopicalVerses = createAction(
  '[Flow] Load Topical Verses',
  props<{ topicId: string; topicName: string }>()
);

export const loadTopicalVersesSuccess = createAction(
  '[Flow] Load Topical Verses Success',
  props<{ verses: TopicalVerse[] }>()
);

export const loadTopicalVersesFailure = createAction(
  '[Flow] Load Topical Verses Failure',
  props<{ error: string }>()
);

export const setTopicalRelevanceThreshold = createAction(
  '[Flow] Set Topical Relevance Threshold',
  props<{ threshold: number }>()
);

export const loadAvailableTopics = createAction('[Flow] Load Available Topics');

export const loadAvailableTopicsSuccess = createAction(
  '[Flow] Load Available Topics Success',
  props<{ topics: Array<{ id: string; name: string; count: number }> }>()
);

// Deck Actions
export const createDeck = createAction(
  '[Flow] Create Deck',
  props<{ name: string; description?: string }>()
);

export const addToDeck = createAction(
  '[Flow] Add to Deck',
  props<{ deckId: string; verseCodes: string[] }>()
);

export const removeFromDeck = createAction(
  '[Flow] Remove from Deck',
  props<{ deckId: string; verseCodes: string[] }>()
);

export const setActiveDeck = createAction(
  '[Flow] Set Active Deck',
  props<{ deckId: string | null }>()
);

export const loadDecks = createAction('[Flow] Load Decks');

export const loadDecksSuccess = createAction(
  '[Flow] Load Decks Success',
  props<{ decks: Array<{ id: string; name: string; verseCount: number; lastStudied: number | null }> }>()
);

// Settings Actions
export const updateSettings = createAction(
  '[Flow] Update Settings',
  props<{ settings: Partial<{
    defaultTranslation: string;
    autoAdvanceDelay: number;
    hideMemorizedByDefault: boolean;
    enableKeyboardShortcuts: boolean;
    enableSwipeGestures: boolean;
    confirmBeforeDelete: boolean;
    studyRepetitions: number;
    theme: 'light' | 'dark' | 'auto';
  }> }>()
);

export const loadSettings = createAction('[Flow] Load Settings');

export const saveSettings = createAction('[Flow] Save Settings');

// Batch Actions
export const batchUpdateVerses = createAction(
  '[Flow] Batch Update Verses',
  props<{ updates: Array<{ verseCode: string; changes: Partial<BaseVerse> }> }>()
);

export const clearAllData = createAction('[Flow] Clear All Data');

export const resetToDefaults = createAction('[Flow] Reset to Defaults');

// Performance Actions
export const optimizePerformance = createAction('[Flow] Optimize Performance');

export const enableVirtualScrolling = createAction(
  '[Flow] Enable Virtual Scrolling',
  props<{ enabled: boolean }>()
);

// Error Actions
export const handleError = createAction(
  '[Flow] Handle Error',
  props<{ error: Error; context: string; recoverable: boolean }>()
);

export const clearError = createAction('[Flow] Clear Error');

// Persistence Actions
export const saveState = createAction('[Flow] Save State');

export const loadState = createAction('[Flow] Load State');

export const syncWithBackend = createAction('[Flow] Sync with Backend');