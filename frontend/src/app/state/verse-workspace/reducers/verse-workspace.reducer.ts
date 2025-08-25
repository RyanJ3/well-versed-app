import { createReducer, on } from '@ngrx/store';
import { initialVerseWorkspaceState, VerseWorkspaceState } from '../models/verse-workspace.state';
import * as VerseWorkspaceActions from '../actions/verse-workspace.actions';
import { WorkspaceVerseUtils } from '@features/verse-workspace/utils/workspace-verse.utils';

export const verseWorkspaceReducer = createReducer(
  initialVerseWorkspaceState,
  
  // Load Chapter
  on(VerseWorkspaceActions.loadChapter, (state) => ({
    ...state,
    loading: { ...state.loading, verses: true },
    errors: { ...state.errors, loadVerses: null }
  })),
  
  on(VerseWorkspaceActions.loadChapterSuccess, (state, { book, chapter, bibleChapter, verses }) => ({
    ...state,
    currentBook: book,
    currentChapter: chapter,
    currentBibleChapter: bibleChapter,
    verses,
    filteredVerses: applyCurrentFilter(verses, state.ui.activeFilter, state.memorization.verseReviewData),
    loading: { ...state.loading, verses: false },
    errors: { ...state.errors, loadVerses: null }
  })),
  
  on(VerseWorkspaceActions.loadChapterFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, verses: false },
    errors: { ...state.errors, loadVerses: error }
  })),
  
  // Toggle Memorization
  on(VerseWorkspaceActions.toggleVerseMemorized, (state, { verse }) => ({
    ...state,
    memorization: {
      ...state.memorization,
      isSaving: { ...state.memorization.isSaving, [verse.verseCode]: true }
    }
  })),
  
  on(VerseWorkspaceActions.toggleVerseMemorizedSuccess, (state, { verseCode, isMemorized }) => {
    const updatedVerses = state.verses.map(v => 
      v.verseCode === verseCode ? { ...v, isMemorized, isSaving: false } : v
    );
    
    const updatedCrossRefs = state.crossReferences.verses.map(v =>
      v.verseCode === verseCode ? { ...v, isMemorized, isSaving: false } : v
    );
    
    const updatedTopical = state.topical.verses.map(v =>
      v.verseCode === verseCode ? { ...v, isMemorized, isSaving: false } : v
    );
    
    return {
      ...state,
      verses: updatedVerses,
      filteredVerses: applyCurrentFilter(updatedVerses, state.ui.activeFilter, state.memorization.verseReviewData),
      crossReferences: { ...state.crossReferences, verses: updatedCrossRefs },
      topical: { ...state.topical, verses: updatedTopical },
      memorization: {
        ...state.memorization,
        isSaving: { ...state.memorization.isSaving, [verseCode]: false }
      }
    };
  }),
  
  // Selection
  on(VerseWorkspaceActions.selectVerse, (state, { verseCode, clearPrevious }) => ({
    ...state,
    selection: {
      ...state.selection,
      selectedVerses: clearPrevious 
        ? [verseCode]
        : state.selection.selectedVerses.includes(verseCode)
          ? state.selection.selectedVerses.filter(v => v !== verseCode)
          : [...state.selection.selectedVerses, verseCode]
    }
  })),
  
  on(VerseWorkspaceActions.selectVerseRange, (state, { startIndex, endIndex, verses }) => {
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    const rangeVerses = verses.slice(start, end + 1).map(v => v.verseCode);
    
    return {
      ...state,
      selection: {
        ...state.selection,
        selectedVerses: rangeVerses,
        lastClickedIndex: endIndex
      }
    };
  }),
  
  on(VerseWorkspaceActions.clearSelection, (state) => ({
    ...state,
    selection: {
      ...state.selection,
      selectedVerses: [],
      lastClickedIndex: null
    }
  })),
  
  on(VerseWorkspaceActions.startDragging, (state, { startIndex }) => ({
    ...state,
    selection: {
      ...state.selection,
      isDragging: true,
      dragStart: startIndex,
      dragEnd: startIndex
    }
  })),
  
  on(VerseWorkspaceActions.updateDragSelection, (state, { currentIndex, verses }) => {
    if (!state.selection.isDragging || state.selection.dragStart === null) {
      return state;
    }
    
    const start = Math.min(state.selection.dragStart, currentIndex);
    const end = Math.max(state.selection.dragStart, currentIndex);
    const selectedVerses = verses.slice(start, end + 1).map(v => v.verseCode);
    
    return {
      ...state,
      selection: {
        ...state.selection,
        dragEnd: currentIndex,
        selectedVerses
      }
    };
  }),
  
  on(VerseWorkspaceActions.endDragging, (state) => ({
    ...state,
    selection: {
      ...state.selection,
      isDragging: false,
      dragStart: null,
      dragEnd: null
    }
  })),
  
  // Cross References
  on(VerseWorkspaceActions.loadCrossReferences, (state) => ({
    ...state,
    crossReferences: {
      ...state.crossReferences,
      isLoading: true
    },
    errors: { ...state.errors, loadCrossReferences: null }
  })),
  
  on(VerseWorkspaceActions.loadCrossReferencesSuccess, (state, { verses, selection }) => ({
    ...state,
    crossReferences: {
      verses,
      selectedVerse: selection,
      isLoading: false
    },
    errors: { ...state.errors, loadCrossReferences: null }
  })),
  
  on(VerseWorkspaceActions.loadCrossReferencesFailure, (state, { error }) => ({
    ...state,
    crossReferences: {
      ...state.crossReferences,
      isLoading: false
    },
    errors: { ...state.errors, loadCrossReferences: error }
  })),
  
  // Topical Verses
  on(VerseWorkspaceActions.loadTopicalVerses, (state) => ({
    ...state,
    topical: {
      ...state.topical,
      isLoading: true
    },
    errors: { ...state.errors, loadTopicalVerses: null }
  })),
  
  on(VerseWorkspaceActions.loadTopicalVersesSuccess, (state, { verses, topic }) => ({
    ...state,
    topical: {
      ...state.topical,
      verses,
      selectedTopic: topic,
      isLoading: false
    },
    errors: { ...state.errors, loadTopicalVerses: null }
  })),
  
  on(VerseWorkspaceActions.loadTopicalVersesFailure, (state, { error }) => ({
    ...state,
    topical: {
      ...state.topical,
      isLoading: false
    },
    errors: { ...state.errors, loadTopicalVerses: error }
  })),
  
  on(VerseWorkspaceActions.loadAvailableTopicsSuccess, (state, { topics }) => ({
    ...state,
    topical: {
      ...state.topical,
      availableTopics: topics
    }
  })),
  
  // UI Actions
  on(VerseWorkspaceActions.setMode, (state, { mode }) => ({
    ...state,
    ui: { ...state.ui, mode },
    selection: { ...initialVerseWorkspaceState.selection } // Clear selection on mode change
  })),
  
  on(VerseWorkspaceActions.toggleFullText, (state) => ({
    ...state,
    ui: { ...state.ui, showFullText: !state.ui.showFullText }
  })),
  
  on(VerseWorkspaceActions.setFontSize, (state, { fontSize }) => ({
    ...state,
    ui: { ...state.ui, fontSize: Math.min(Math.max(fontSize, 12), 24) }
  })),
  
  on(VerseWorkspaceActions.setLayoutMode, (state, { layoutMode }) => ({
    ...state,
    ui: { ...state.ui, layoutMode }
  })),
  
  on(VerseWorkspaceActions.setActiveFilter, (state, { filter }) => {
    const versesToFilter = getVersesForCurrentMode(state);
    const filteredVerses = applyCurrentFilter(versesToFilter, filter, state.memorization.verseReviewData);
    
    return {
      ...state,
      ui: { ...state.ui, activeFilter: filter },
      filteredVerses
    };
  }),
  
  on(VerseWorkspaceActions.toggleSettings, (state) => ({
    ...state,
    ui: { ...state.ui, showSettings: !state.ui.showSettings }
  })),
  
  on(VerseWorkspaceActions.showContextMenu, (state, { x, y, verseId, selectedCount }) => ({
    ...state,
    ui: {
      ...state.ui,
      contextMenu: { show: true, x, y, verseId, selectedCount }
    }
  })),
  
  on(VerseWorkspaceActions.hideContextMenu, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      contextMenu: { ...state.ui.contextMenu, show: false }
    }
  })),
  
  // Modal Actions
  on(VerseWorkspaceActions.openMemorizationModal, (state, { verses, chapterName }) => ({
    ...state,
    memorization: { ...state.memorization, modalVerses: verses },
    ui: {
      ...state.ui,
      showModal: true,
      modalChapterName: chapterName
    }
  })),
  
  on(VerseWorkspaceActions.closeMemorizationModal, (state) => ({
    ...state,
    memorization: { ...state.memorization, modalVerses: [] },
    ui: {
      ...state.ui,
      showModal: false,
      modalChapterName: ''
    }
  })),
  
  // Review Data
  on(VerseWorkspaceActions.updateReviewData, (state, { verseCode, reviewData }) => ({
    ...state,
    memorization: {
      ...state.memorization,
      verseReviewData: {
        ...state.memorization.verseReviewData,
        [verseCode]: reviewData
      }
    }
  })),
  
  on(VerseWorkspaceActions.initializeReviewData, (state, { reviewData }) => ({
    ...state,
    memorization: {
      ...state.memorization,
      verseReviewData: reviewData
    }
  })),
  
  // Encouragement
  on(VerseWorkspaceActions.showEncouragement, (state, { message, duration = 3000 }) => ({
    ...state,
    ui: {
      ...state.ui,
      showEncouragement: message,
      encouragementTimeout: duration
    }
  })),
  
  on(VerseWorkspaceActions.hideEncouragement, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      showEncouragement: '',
      encouragementTimeout: null
    }
  })),
  
  // Navigation
  on(VerseWorkspaceActions.setTargetVerse, (state, { verseNumber }) => ({
    ...state,
    ui: {
      ...state.ui,
      targetVerseAfterLoad: verseNumber
    }
  }))
);

// Helper functions
function applyCurrentFilter(
  verses: any[],
  filter: 'all' | 'unmemorized' | 'needsReview',
  reviewData: Record<string, any>
): any[] {
  if (!verses || verses.length === 0) return [];
  
  switch (filter) {
    case 'unmemorized':
      return verses.filter(v => !v.isMemorized);
    case 'needsReview':
      return verses.filter(v => {
        if (!v.isMemorized) return false;
        return WorkspaceVerseUtils.needsReview(v.verseCode, reviewData);
      });
    default:
      return verses;
  }
}

function getVersesForCurrentMode(state: VerseWorkspaceState): any[] {
  switch (state.ui.mode) {
    case 'crossReferences':
      return state.crossReferences.verses;
    case 'topical':
      return state.topical.verses;
    default:
      return state.verses;
  }
}