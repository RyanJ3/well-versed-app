import { createAction, props } from '@ngrx/store';
import { BibleBook, BibleChapter } from '@models/bible';
import { VerseData, WorkspaceSettings, MemorizationSession } from './verse-workspace.state';

// ============= VERSE ACTIONS =============
export const loadVerses = createAction(
  '[Verse Workspace] Load Verses',
  props<{ bookId: number; chapterNumber: number }>()
);

export const loadVersesSuccess = createAction(
  '[Verse Workspace] Load Verses Success',
  props<{ verses: VerseData[]; book: BibleBook; chapter: BibleChapter }>()
);

export const loadVersesFailure = createAction(
  '[Verse Workspace] Load Verses Failure',
  props<{ error: string }>()
);

export const loadTopicalVerses = createAction(
  '[Verse Workspace] Load Topical Verses',
  props<{ topic: string }>()
);

export const loadTopicalVersesSuccess = createAction(
  '[Verse Workspace] Load Topical Verses Success',
  props<{ verses: VerseData[]; topic: string }>()
);

// ============= MEMORIZATION ACTIONS =============
export const markVerseMemorized = createAction(
  '[Verse Workspace] Mark Verse Memorized',
  props<{ verseId: string; confidence: number }>()
);

export const markVerseMemorizedSuccess = createAction(
  '[Verse Workspace] Mark Verse Memorized Success',
  props<{ verseId: string }>()
);

export const updateVerseConfidence = createAction(
  '[Verse Workspace] Update Verse Confidence',
  props<{ verseId: string; confidence: number }>()
);

export const startMemorizationSession = createAction(
  '[Verse Workspace] Start Memorization Session',
  props<{ verses: string[]; mode: 'practice' | 'test' | 'review' }>()
);

export const endMemorizationSession = createAction(
  '[Verse Workspace] End Memorization Session',
  props<{ accuracy: number; timeSpent: number }>()
);

export const updateSessionProgress = createAction(
  '[Verse Workspace] Update Session Progress',
  props<{ currentIndex: number; mistakeCount?: number; hintsUsed?: number }>()
);

// ============= SELECTION ACTIONS =============
export const selectVerse = createAction(
  '[Verse Workspace] Select Verse',
  props<{ verseId: string; multiSelect?: boolean }>()
);

export const selectVerseRange = createAction(
  '[Verse Workspace] Select Verse Range',
  props<{ startId: string; endId: string }>()
);

export const clearSelection = createAction(
  '[Verse Workspace] Clear Selection'
);

export const toggleSelectionMode = createAction(
  '[Verse Workspace] Toggle Selection Mode'
);

// ============= UI ACTIONS =============
export const toggleViewType = createAction(
  '[Verse Workspace] Toggle View Type'
);

export const setMode = createAction(
  '[Verse Workspace] Set Mode',
  props<{ mode: 'chapter' | 'topical' | 'custom' }>()
);

export const toggleHeader = createAction(
  '[Verse Workspace] Toggle Header'
);

export const toggleFilters = createAction(
  '[Verse Workspace] Toggle Filters'
);

export const openModal = createAction(
  '[Verse Workspace] Open Modal',
  props<{ modal: 'memorization' | 'settings' | 'deck' }>()
);

export const closeModal = createAction(
  '[Verse Workspace] Close Modal'
);

export const showContextMenu = createAction(
  '[Verse Workspace] Show Context Menu',
  props<{ x: number; y: number; verseId: string }>()
);

export const hideContextMenu = createAction(
  '[Verse Workspace] Hide Context Menu'
);

export const setFontSize = createAction(
  '[Verse Workspace] Set Font Size',
  props<{ size: 'small' | 'medium' | 'large' }>()
);

// ============= SETTINGS ACTIONS =============
export const updateSettings = createAction(
  '[Verse Workspace] Update Settings',
  props<{ settings: Partial<WorkspaceSettings> }>()
);

export const loadSettings = createAction(
  '[Verse Workspace] Load Settings'
);

export const loadSettingsSuccess = createAction(
  '[Verse Workspace] Load Settings Success',
  props<{ settings: WorkspaceSettings }>()
);

// ============= NAVIGATION ACTIONS =============
export const navigateToChapter = createAction(
  '[Verse Workspace] Navigate To Chapter',
  props<{ bookId: number; chapterNumber: number }>()
);

export const navigateNext = createAction(
  '[Verse Workspace] Navigate Next'
);

export const navigatePrevious = createAction(
  '[Verse Workspace] Navigate Previous'
);

// ============= CROSS REFERENCES ACTIONS =============
export const loadCrossReferences = createAction(
  '[Verse Workspace] Load Cross References',
  props<{ verseId: string }>()
);

export const loadCrossReferencesSuccess = createAction(
  '[Verse Workspace] Load Cross References Success',
  props<{ verseId: string; references: any[] }>()
);

// ============= DECK ACTIONS =============
export const addToDeck = createAction(
  '[Verse Workspace] Add To Deck',
  props<{ verseIds: string[]; deckId: number }>()
);

export const addToDeckSuccess = createAction(
  '[Verse Workspace] Add To Deck Success',
  props<{ deckId: number }>()
);

export const createDeckFromSelection = createAction(
  '[Verse Workspace] Create Deck From Selection',
  props<{ name: string; description: string; verseIds: string[] }>()
);

// ============= FILTER ACTIONS =============
export const applyFilter = createAction(
  '[Verse Workspace] Apply Filter',
  props<{ filter: { hideMemorized?: boolean; section?: string; searchText?: string } }>()
);

export const clearFilters = createAction(
  '[Verse Workspace] Clear Filters'
);

// ============= BATCH ACTIONS =============
export const markMultipleVersesMemorized = createAction(
  '[Verse Workspace] Mark Multiple Verses Memorized',
  props<{ verseIds: string[] }>()
);

export const resetChapterProgress = createAction(
  '[Verse Workspace] Reset Chapter Progress'
);

// ============= ERROR ACTIONS =============
export const clearError = createAction(
  '[Verse Workspace] Clear Error'
);