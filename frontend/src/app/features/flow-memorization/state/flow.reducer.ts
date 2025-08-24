import { createReducer, on, Action } from '@ngrx/store';
import { 
  FlowState, 
  initialFlowState, 
  verseAdapter,
  initialVerseState,
  initialUIState,
  initialNavigationState,
  initialFilterState,
  initialStudyState,
  initialCrossReferencesState,
  initialTopicalState,
  initialDeckState,
  initialSettingsState
} from './flow.state';
import * as FlowActions from './flow.actions';

// Verse Reducer
const verseReducer = createReducer(
  initialVerseState,
  
  on(FlowActions.loadChapterSuccess, (state, { verses }) =>
    verseAdapter.setAll(verses, state)
  ),
  
  on(FlowActions.selectVerse, (state, { verseCode, multiSelect }) => ({
    ...state,
    selectedVerseIds: multiSelect && state.selectedVerseIds.includes(verseCode)
      ? state.selectedVerseIds.filter(id => id !== verseCode)
      : multiSelect
      ? [...state.selectedVerseIds, verseCode]
      : [verseCode]
  })),
  
  on(FlowActions.deselectVerse, (state, { verseCode }) => ({
    ...state,
    selectedVerseIds: state.selectedVerseIds.filter(id => id !== verseCode)
  })),
  
  on(FlowActions.selectVerseRange, (state, { startCode, endCode }) => {
    const allIds = state.ids as string[];
    const startIndex = allIds.indexOf(startCode);
    const endIndex = allIds.indexOf(endCode);
    
    if (startIndex === -1 || endIndex === -1) return state;
    
    const [from, to] = startIndex < endIndex 
      ? [startIndex, endIndex] 
      : [endIndex, startIndex];
    
    const selectedVerseIds = allIds.slice(from, to + 1);
    
    return { ...state, selectedVerseIds };
  }),
  
  on(FlowActions.clearSelection, (state) => ({
    ...state,
    selectedVerseIds: []
  })),
  
  on(FlowActions.selectAll, (state) => ({
    ...state,
    selectedVerseIds: state.ids as string[]
  })),
  
  on(FlowActions.toggleMemorized, (state, { verseCode }) => ({
    ...state,
    memorizedVerseIds: state.memorizedVerseIds.includes(verseCode)
      ? state.memorizedVerseIds.filter(id => id !== verseCode)
      : [...state.memorizedVerseIds, verseCode],
    lastReviewDates: {
      ...state.lastReviewDates,
      [verseCode]: Date.now()
    }
  })),
  
  on(FlowActions.markAsMemorized, (state, { verseCodes }) => ({
    ...state,
    memorizedVerseIds: [...new Set([...state.memorizedVerseIds, ...verseCodes])],
    lastReviewDates: verseCodes.reduce((acc, code) => ({
      ...acc,
      [code]: Date.now()
    }), state.lastReviewDates)
  })),
  
  on(FlowActions.markAsNotMemorized, (state, { verseCodes }) => ({
    ...state,
    memorizedVerseIds: state.memorizedVerseIds.filter(id => !verseCodes.includes(id))
  })),
  
  on(FlowActions.batchToggleMemorized, (state, { verseCodes }) => {
    const toAdd = verseCodes.filter(code => !state.memorizedVerseIds.includes(code));
    const toRemove = verseCodes.filter(code => state.memorizedVerseIds.includes(code));
    
    return {
      ...state,
      memorizedVerseIds: [
        ...state.memorizedVerseIds.filter(id => !toRemove.includes(id)),
        ...toAdd
      ],
      lastReviewDates: toAdd.reduce((acc, code) => ({
        ...acc,
        [code]: Date.now()
      }), state.lastReviewDates)
    };
  })
);

// UI Reducer
const uiReducer = createReducer(
  initialUIState,
  
  on(FlowActions.setMode, (state, { mode }) => ({
    ...state,
    mode
  })),
  
  on(FlowActions.switchToMemorization, (state) => ({
    ...state,
    mode: 'memorization'
  })),
  
  on(FlowActions.switchToCrossReferences, (state) => ({
    ...state,
    mode: 'crossReferences'
  })),
  
  on(FlowActions.switchToTopical, (state) => ({
    ...state,
    mode: 'topical'
  })),
  
  on(FlowActions.setFontSize, (state, { fontSize }) => ({
    ...state,
    fontSize
  })),
  
  on(FlowActions.setLayoutMode, (state, { layoutMode }) => ({
    ...state,
    layoutMode
  })),
  
  on(FlowActions.toggleFullText, (state) => ({
    ...state,
    showFullText: !state.showFullText
  })),
  
  on(FlowActions.toggleVerseNumbers, (state) => ({
    ...state,
    showVerseNumbers: !state.showVerseNumbers
  })),
  
  on(FlowActions.showContextMenu, (state, { verseCode, x, y }) => ({
    ...state,
    contextMenu: {
      visible: true,
      position: { x, y },
      verseCode
    }
  })),
  
  on(FlowActions.hideContextMenu, (state) => ({
    ...state,
    contextMenu: {
      visible: false,
      position: null,
      verseCode: null
    }
  })),
  
  on(FlowActions.setLoading, (state, { isLoading, message }) => ({
    ...state,
    isLoading,
    loadingMessage: message || ''
  })),
  
  on(FlowActions.loadChapter, (state) => ({
    ...state,
    isLoading: true,
    loadingMessage: 'Loading verses...',
    error: null
  })),
  
  on(FlowActions.loadChapterSuccess, (state) => ({
    ...state,
    isLoading: false,
    loadingMessage: '',
    error: null
  })),
  
  on(FlowActions.loadChapterFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    loadingMessage: '',
    error
  })),
  
  on(FlowActions.handleError, (state, { error }) => ({
    ...state,
    error: error.message
  })),
  
  on(FlowActions.clearError, (state) => ({
    ...state,
    error: null
  }))
);

// Navigation Reducer
const navigationReducer = createReducer(
  initialNavigationState,
  
  on(FlowActions.loadChapterSuccess, (state, { bookName, totalChapters }) => ({
    ...state,
    currentBookName: bookName,
    totalChapters,
    navigationHistory: [
      ...state.navigationHistory,
      {
        bookId: state.currentBookId,
        chapter: state.currentChapter,
        timestamp: Date.now()
      }
    ].slice(-20) // Keep last 20 entries
  })),
  
  on(FlowActions.changeBook, (state, { bookId }) => ({
    ...state,
    currentBookId: bookId,
    currentChapter: 1
  })),
  
  on(FlowActions.changeChapter, (state, { chapter }) => ({
    ...state,
    currentChapter: chapter
  })),
  
  on(FlowActions.navigateToVerse, (state, { verseCode }) => {
    // Parse verse code to get book and chapter
    const bookId = parseInt(verseCode.substring(0, 2));
    const chapter = parseInt(verseCode.substring(2, 5));
    
    return {
      ...state,
      currentBookId: bookId,
      currentChapter: chapter
    };
  })
);

// Filter Reducer
const filterReducer = createReducer(
  initialFilterState,
  
  on(FlowActions.setSearchTerm, (state, { searchTerm }) => ({
    ...state,
    searchTerm
  })),
  
  on(FlowActions.setFilter, (state, { filter }) => ({
    ...state,
    activeFilter: filter
  })),
  
  on(FlowActions.toggleFilter, (state, { filterType }) => {
    switch (filterType) {
      case 'memorized':
        return {
          ...state,
          showMemorizedOnly: !state.showMemorizedOnly,
          showToLearnOnly: false,
          showReviewOnly: false,
          activeFilter: !state.showMemorizedOnly ? 'memorized' : 'all'
        };
      case 'toLearn':
        return {
          ...state,
          showToLearnOnly: !state.showToLearnOnly,
          showMemorizedOnly: false,
          showReviewOnly: false,
          activeFilter: !state.showToLearnOnly ? 'toLearn' : 'all'
        };
      case 'review':
        return {
          ...state,
          showReviewOnly: !state.showReviewOnly,
          showMemorizedOnly: false,
          showToLearnOnly: false,
          activeFilter: !state.showReviewOnly ? 'review' : 'all'
        };
      default:
        return state;
    }
  }),
  
  on(FlowActions.clearFilters, () => initialFilterState),
  
  on(FlowActions.addCustomFilter, (state, { filter }) => ({
    ...state,
    customFilters: [...state.customFilters, filter]
  }))
);

// Study Session Reducer
const studyReducer = createReducer(
  initialStudyState,
  
  on(FlowActions.startStudySession, (state, { verseCodes, sessionType }) => ({
    ...state,
    isActive: true,
    sessionId: `session_${Date.now()}`,
    sessionType,
    verseCodes,
    currentIndex: 0,
    correctAnswers: 0,
    totalAttempts: 0,
    startTime: Date.now(),
    endTime: null
  })),
  
  on(FlowActions.endStudySession, (state) => ({
    ...state,
    isActive: false,
    endTime: Date.now()
  })),
  
  on(FlowActions.nextStudyVerse, (state) => ({
    ...state,
    currentIndex: Math.min(state.currentIndex + 1, state.verseCodes.length - 1)
  })),
  
  on(FlowActions.previousStudyVerse, (state) => ({
    ...state,
    currentIndex: Math.max(state.currentIndex - 1, 0)
  })),
  
  on(FlowActions.recordStudyAttempt, (state, { correct }) => ({
    ...state,
    correctAnswers: correct ? state.correctAnswers + 1 : state.correctAnswers,
    totalAttempts: state.totalAttempts + 1
  }))
);

// Cross References Reducer
const crossReferencesReducer = createReducer(
  initialCrossReferencesState,
  
  on(FlowActions.loadCrossReferences, (state, { verseCode }) => ({
    ...state,
    sourceVerseCode: verseCode,
    loadingReferences: true
  })),
  
  on(FlowActions.loadCrossReferencesSuccess, (state, { references }) => ({
    ...state,
    references,
    loadingReferences: false
  })),
  
  on(FlowActions.loadCrossReferencesFailure, (state) => ({
    ...state,
    loadingReferences: false
  })),
  
  on(FlowActions.selectCrossReference, (state, { verseCode }) => ({
    ...state,
    selectedReferenceCode: verseCode
  })),
  
  on(FlowActions.setCrossReferenceConfidenceThreshold, (state, { threshold }) => ({
    ...state,
    confidenceThreshold: threshold
  }))
);

// Topical Reducer
const topicalReducer = createReducer(
  initialTopicalState,
  
  on(FlowActions.loadTopicalVerses, (state, { topicId, topicName }) => ({
    ...state,
    currentTopicId: topicId,
    currentTopicName: topicName,
    loadingTopical: true
  })),
  
  on(FlowActions.loadTopicalVersesSuccess, (state, { verses }) => ({
    ...state,
    topicalVerses: verses,
    loadingTopical: false
  })),
  
  on(FlowActions.loadTopicalVersesFailure, (state) => ({
    ...state,
    loadingTopical: false
  })),
  
  on(FlowActions.setTopicalRelevanceThreshold, (state, { threshold }) => ({
    ...state,
    relevanceThreshold: threshold
  })),
  
  on(FlowActions.loadAvailableTopicsSuccess, (state, { topics }) => ({
    ...state,
    availableTopics: topics
  }))
);

// Deck Reducer
const deckReducer = createReducer(
  initialDeckState,
  
  on(FlowActions.loadDecksSuccess, (state, { decks }) => ({
    ...state,
    decks
  })),
  
  on(FlowActions.createDeck, (state, { name }) => ({
    ...state,
    decks: [
      ...state.decks,
      {
        id: `deck_${Date.now()}`,
        name,
        verseCount: 0,
        lastStudied: null
      }
    ]
  })),
  
  on(FlowActions.setActiveDeck, (state, { deckId }) => ({
    ...state,
    activeDeckId: deckId
  })),
  
  on(FlowActions.addToDeck, (state, { deckId, verseCodes }) => ({
    ...state,
    decks: state.decks.map(deck =>
      deck.id === deckId
        ? { ...deck, verseCount: deck.verseCount + verseCodes.length }
        : deck
    )
  }))
);

// Settings Reducer
const settingsReducer = createReducer(
  initialSettingsState,
  
  on(FlowActions.updateSettings, (state, { settings }) => ({
    ...state,
    ...settings
  }))
);

// Main Flow Reducer
export const flowReducer = createReducer(
  initialFlowState,
  
  on(FlowActions.loadChapterSuccess, (state, action) => ({
    ...state,
    verses: verseReducer(state.verses, action),
    ui: uiReducer(state.ui, action),
    navigation: navigationReducer(state.navigation, action)
  })),
  
  // Apply all sub-reducers
  on(FlowActions.clearAllData, () => initialFlowState),
  
  on(FlowActions.resetToDefaults, (state) => ({
    ...initialFlowState,
    settings: state.settings // Keep user settings
  }))
);

// Export the reducer function
export function reducer(state: FlowState | undefined, action: Action) {
  // Apply individual reducers
  const newState = state || initialFlowState;
  
  return {
    verses: verseReducer(newState.verses, action),
    ui: uiReducer(newState.ui, action),
    navigation: navigationReducer(newState.navigation, action),
    filters: filterReducer(newState.filters, action),
    study: studyReducer(newState.study, action),
    crossReferences: crossReferencesReducer(newState.crossReferences, action),
    topical: topicalReducer(newState.topical, action),
    decks: deckReducer(newState.decks, action),
    settings: settingsReducer(newState.settings, action)
  };
}