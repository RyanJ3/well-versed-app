import { createAction, props } from '@ngrx/store';
import { WorkspaceVerse, ModalVerse } from '@features/verse-workspace/models/workspace.models';
import { BibleBook, BibleChapter } from '@models/bible';
import { WorkspaceFilterMode } from '@features/verse-workspace/models/workspace-filter-mode.enum';
import { CrossReferenceSelection, Topic, ReviewData, ContextMenuState } from '../models/verse-workspace.state';

// Load Chapter Actions
export const loadChapter = createAction(
  '[Verse Workspace] Load Chapter',
  props<{ bookId: number; chapter: number; userId: number }>()
);

export const loadChapterSuccess = createAction(
  '[Verse Workspace] Load Chapter Success',
  props<{ 
    book: BibleBook;
    chapter: number;
    bibleChapter: BibleChapter;
    verses: WorkspaceVerse[];
  }>()
);

export const loadChapterFailure = createAction(
  '[Verse Workspace] Load Chapter Failure',
  props<{ error: string }>()
);

// Verse Memorization Actions
export const toggleVerseMemorized = createAction(
  '[Verse Workspace] Toggle Verse Memorized',
  props<{ verse: WorkspaceVerse; userId: number }>()
);

export const toggleVerseMemorizedSuccess = createAction(
  '[Verse Workspace] Toggle Verse Memorized Success',
  props<{ verseCode: string; isMemorized: boolean }>()
);

export const toggleVerseMemorizedFailure = createAction(
  '[Verse Workspace] Toggle Verse Memorized Failure',
  props<{ verseCode: string; error: string }>()
);

export const markMultipleVersesMemorized = createAction(
  '[Verse Workspace] Mark Multiple Verses Memorized',
  props<{ verseCodes: string[]; isMemorized: boolean; userId: number }>()
);

// Selection Actions
export const selectVerse = createAction(
  '[Verse Workspace] Select Verse',
  props<{ verseCode: string; clearPrevious?: boolean }>()
);

export const selectVerseRange = createAction(
  '[Verse Workspace] Select Verse Range',
  props<{ startIndex: number; endIndex: number; verses: WorkspaceVerse[] }>()
);

export const clearSelection = createAction(
  '[Verse Workspace] Clear Selection'
);

export const startDragging = createAction(
  '[Verse Workspace] Start Dragging',
  props<{ startIndex: number }>()
);

export const updateDragSelection = createAction(
  '[Verse Workspace] Update Drag Selection',
  props<{ currentIndex: number; verses: WorkspaceVerse[] }>()
);

export const endDragging = createAction(
  '[Verse Workspace] End Dragging'
);

// Cross References Actions
export const loadCrossReferences = createAction(
  '[Verse Workspace] Load Cross References',
  props<{ selection: CrossReferenceSelection; userId: number }>()
);

export const loadCrossReferencesSuccess = createAction(
  '[Verse Workspace] Load Cross References Success',
  props<{ verses: WorkspaceVerse[]; selection: CrossReferenceSelection }>()
);

export const loadCrossReferencesFailure = createAction(
  '[Verse Workspace] Load Cross References Failure',
  props<{ error: string }>()
);

// Topical Verses Actions
export const loadTopicalVerses = createAction(
  '[Verse Workspace] Load Topical Verses',
  props<{ topic: Topic; userId: number }>()
);

export const loadTopicalVersesSuccess = createAction(
  '[Verse Workspace] Load Topical Verses Success',
  props<{ verses: WorkspaceVerse[]; topic: Topic }>()
);

export const loadTopicalVersesFailure = createAction(
  '[Verse Workspace] Load Topical Verses Failure',
  props<{ error: string }>()
);

export const loadAvailableTopics = createAction(
  '[Verse Workspace] Load Available Topics'
);

export const loadAvailableTopicsSuccess = createAction(
  '[Verse Workspace] Load Available Topics Success',
  props<{ topics: Topic[] }>()
);

// UI Actions
export const setMode = createAction(
  '[Verse Workspace] Set Mode',
  props<{ mode: 'memorization' | 'crossReferences' | 'topical' }>()
);

export const toggleFullText = createAction(
  '[Verse Workspace] Toggle Full Text'
);

export const setFontSize = createAction(
  '[Verse Workspace] Set Font Size',
  props<{ fontSize: number }>()
);

export const setLayoutMode = createAction(
  '[Verse Workspace] Set Layout Mode',
  props<{ layoutMode: 'grid' | 'single' }>()
);

export const setActiveFilter = createAction(
  '[Verse Workspace] Set Active Filter',
  props<{ filter: WorkspaceFilterMode }>()
);

export const toggleSettings = createAction(
  '[Verse Workspace] Toggle Settings'
);

export const showContextMenu = createAction(
  '[Verse Workspace] Show Context Menu',
  props<{ x: number; y: number; verseId: string; selectedCount: number }>()
);

export const hideContextMenu = createAction(
  '[Verse Workspace] Hide Context Menu'
);

// Modal Actions
export const openMemorizationModal = createAction(
  '[Verse Workspace] Open Memorization Modal',
  props<{ verses: ModalVerse[]; chapterName: string }>()
);

export const closeMemorizationModal = createAction(
  '[Verse Workspace] Close Memorization Modal'
);

// Review Data Actions
export const updateReviewData = createAction(
  '[Verse Workspace] Update Review Data',
  props<{ verseCode: string; reviewData: ReviewData }>()
);

export const initializeReviewData = createAction(
  '[Verse Workspace] Initialize Review Data',
  props<{ reviewData: Record<string, ReviewData> }>()
);

// Encouragement Actions
export const showEncouragement = createAction(
  '[Verse Workspace] Show Encouragement',
  props<{ message: string; duration?: number }>()
);

export const hideEncouragement = createAction(
  '[Verse Workspace] Hide Encouragement'
);

// Navigation Actions
export const navigateToVerse = createAction(
  '[Verse Workspace] Navigate To Verse',
  props<{ bookId: number; chapter: number; verse: number }>()
);

export const setTargetVerse = createAction(
  '[Verse Workspace] Set Target Verse',
  props<{ verseNumber: number | null }>()
);

// Filter Actions
export const applyFilter = createAction(
  '[Verse Workspace] Apply Filter'
);

// Deck Management Actions
export const addVersesToDeck = createAction(
  '[Verse Workspace] Add Verses To Deck',
  props<{ deckId: number; verseCodes: string[]; userId: number }>()
);

export const addVersesToDeckSuccess = createAction(
  '[Verse Workspace] Add Verses To Deck Success',
  props<{ deckId: number; verseCodes: string[] }>()
);

export const addVersesToDeckFailure = createAction(
  '[Verse Workspace] Add Verses To Deck Failure',
  props<{ error: string }>()
);