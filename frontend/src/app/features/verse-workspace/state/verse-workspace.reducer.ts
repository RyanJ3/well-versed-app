import { createReducer, on } from '@ngrx/store';
import { initialVerseWorkspaceState, VerseWorkspaceState } from './verse-workspace.state';
import * as WorkspaceActions from './verse-workspace.actions';

export const verseWorkspaceReducer = createReducer(
  initialVerseWorkspaceState,
  
  // ============= VERSE REDUCERS =============
  on(WorkspaceActions.loadVerses, (state) => ({
    ...state,
    loading: { ...state.loading, verses: true },
    errors: { message: null, code: null, timestamp: null }
  })),
  
  on(WorkspaceActions.loadVersesSuccess, (state, { verses, book, chapter }) => ({
    ...state,
    verses,
    currentBook: book,
    currentChapter: chapter,
    loading: { ...state.loading, verses: false }
  })),
  
  on(WorkspaceActions.loadVersesFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, verses: false },
    errors: { message: error, code: 'LOAD_VERSES_ERROR', timestamp: new Date() }
  })),
  
  // ============= MEMORIZATION REDUCERS =============
  on(WorkspaceActions.markVerseMemorized, (state) => ({
    ...state,
    loading: { ...state.loading, saving: true }
  })),
  
  on(WorkspaceActions.markVerseMemorizedSuccess, (state, { verseId }) => ({
    ...state,
    verses: state.verses.map(v => 
      v.id === verseId 
        ? { ...v, isMemorized: true, practiceCount: v.practiceCount + 1, lastPracticed: new Date() }
        : v
    ),
    memorization: {
      ...state.memorization,
      totalVersesMemorized: state.memorization.totalVersesMemorized + 1,
      dailyProgress: state.memorization.dailyProgress + 1
    },
    loading: { ...state.loading, saving: false }
  })),
  
  on(WorkspaceActions.updateVerseConfidence, (state, { verseId, confidence }) => ({
    ...state,
    verses: state.verses.map(v => 
      v.id === verseId ? { ...v, confidence } : v
    )
  })),
  
  on(WorkspaceActions.startMemorizationSession, (state, { verses, mode }) => ({
    ...state,
    memorization: {
      ...state.memorization,
      activeSession: {
        id: Date.now().toString(),
        startTime: new Date(),
        verses,
        currentIndex: 0,
        mode,
        difficulty: state.settings.defaultDifficulty,
        mistakeCount: 0,
        hintsUsed: 0,
        completed: false
      }
    }
  })),
  
  on(WorkspaceActions.endMemorizationSession, (state, { accuracy, timeSpent }) => {
    const session = state.memorization.activeSession;
    if (!session) return state;
    
    return {
      ...state,
      memorization: {
        ...state.memorization,
        activeSession: null,
        history: [
          ...state.memorization.history,
          {
            sessionId: session.id,
            date: new Date(),
            versesStudied: session.verses.length,
            accuracy,
            timeSpent
          }
        ]
      }
    };
  }),
  
  on(WorkspaceActions.updateSessionProgress, (state, { currentIndex, mistakeCount, hintsUsed }) => ({
    ...state,
    memorization: {
      ...state.memorization,
      activeSession: state.memorization.activeSession ? {
        ...state.memorization.activeSession,
        currentIndex,
        mistakeCount: mistakeCount ?? state.memorization.activeSession.mistakeCount,
        hintsUsed: hintsUsed ?? state.memorization.activeSession.hintsUsed
      } : null
    }
  })),
  
  // ============= SELECTION REDUCERS =============
  on(WorkspaceActions.selectVerse, (state, { verseId, multiSelect }) => {
    const isSelected = state.selection.selectedVerses.includes(verseId);
    let selectedVerses: string[];
    
    if (multiSelect) {
      selectedVerses = isSelected
        ? state.selection.selectedVerses.filter(id => id !== verseId)
        : [...state.selection.selectedVerses, verseId];
    } else {
      selectedVerses = isSelected ? [] : [verseId];
    }
    
    return {
      ...state,
      selection: {
        ...state.selection,
        selectedVerses,
        lastSelectedIndex: state.verses.findIndex(v => v.id === verseId)
      },
      verses: state.verses.map(v => ({
        ...v,
        isSelected: selectedVerses.includes(v.id)
      }))
    };
  }),
  
  on(WorkspaceActions.selectVerseRange, (state, { startId, endId }) => {
    const startIndex = state.verses.findIndex(v => v.id === startId);
    const endIndex = state.verses.findIndex(v => v.id === endId);
    const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
    
    const selectedVerses = state.verses
      .slice(from, to + 1)
      .map(v => v.id);
    
    return {
      ...state,
      selection: {
        ...state.selection,
        selectedVerses,
        rangeStart: startId,
        rangeEnd: endId
      },
      verses: state.verses.map(v => ({
        ...v,
        isSelected: selectedVerses.includes(v.id)
      }))
    };
  }),
  
  on(WorkspaceActions.clearSelection, (state) => ({
    ...state,
    selection: {
      ...state.selection,
      selectedVerses: [],
      rangeStart: null,
      rangeEnd: null,
      lastSelectedIndex: null
    },
    verses: state.verses.map(v => ({ ...v, isSelected: false }))
  })),
  
  on(WorkspaceActions.toggleSelectionMode, (state) => ({
    ...state,
    selection: {
      ...state.selection,
      selectionMode: !state.selection.selectionMode
    }
  })),
  
  // ============= UI REDUCERS =============
  on(WorkspaceActions.toggleViewType, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      viewType: state.ui.viewType === 'grid' ? 'list' : 'grid'
    }
  })),
  
  on(WorkspaceActions.setMode, (state, { mode }) => ({
    ...state,
    ui: { ...state.ui, mode }
  })),
  
  on(WorkspaceActions.toggleHeader, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      isHeaderExpanded: !state.ui.isHeaderExpanded
    }
  })),
  
  on(WorkspaceActions.toggleFilters, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      showFilters: !state.ui.showFilters
    }
  })),
  
  on(WorkspaceActions.openModal, (state, { modal }) => ({
    ...state,
    ui: { ...state.ui, activeModal: modal }
  })),
  
  on(WorkspaceActions.closeModal, (state) => ({
    ...state,
    ui: { ...state.ui, activeModal: null }
  })),
  
  on(WorkspaceActions.showContextMenu, (state, { x, y }) => ({
    ...state,
    ui: {
      ...state.ui,
      showContextMenu: true,
      contextMenuPosition: { x, y }
    }
  })),
  
  on(WorkspaceActions.hideContextMenu, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      showContextMenu: false,
      contextMenuPosition: null
    }
  })),
  
  on(WorkspaceActions.setFontSize, (state, { size }) => ({
    ...state,
    ui: { ...state.ui, fontSize: size }
  })),
  
  // ============= SETTINGS REDUCERS =============
  on(WorkspaceActions.updateSettings, (state, { settings }) => ({
    ...state,
    settings: { ...state.settings, ...settings }
  })),
  
  on(WorkspaceActions.loadSettingsSuccess, (state, { settings }) => ({
    ...state,
    settings
  })),
  
  // ============= FILTER REDUCERS =============
  on(WorkspaceActions.applyFilter, (state, { filter }) => {
    let filteredVerses = [...state.verses];
    
    if (filter.hideMemorized) {
      filteredVerses = filteredVerses.map(v => ({
        ...v,
        isHighlighted: !v.isMemorized
      }));
    }
    
    return {
      ...state,
      verses: filteredVerses
    };
  }),
  
  on(WorkspaceActions.clearFilters, (state) => ({
    ...state,
    verses: state.verses.map(v => ({ ...v, isHighlighted: false }))
  })),
  
  // ============= BATCH REDUCERS =============
  on(WorkspaceActions.markMultipleVersesMemorized, (state, { verseIds }) => ({
    ...state,
    verses: state.verses.map(v => 
      verseIds.includes(v.id)
        ? { ...v, isMemorized: true, lastPracticed: new Date() }
        : v
    ),
    memorization: {
      ...state.memorization,
      totalVersesMemorized: state.memorization.totalVersesMemorized + verseIds.length,
      dailyProgress: state.memorization.dailyProgress + verseIds.length
    }
  })),
  
  on(WorkspaceActions.resetChapterProgress, (state) => ({
    ...state,
    verses: state.verses.map(v => ({
      ...v,
      isMemorized: false,
      confidence: 0,
      practiceCount: 0,
      lastPracticed: null
    })),
    memorization: {
      ...state.memorization,
      dailyProgress: 0
    }
  })),
  
  // ============= ERROR REDUCERS =============
  on(WorkspaceActions.clearError, (state) => ({
    ...state,
    errors: { message: null, code: null, timestamp: null }
  }))
);