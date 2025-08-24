import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FlowState, verseAdapter } from './flow.state';
import { BaseVerse } from '../models/verse-types.model';

// Feature selector
export const selectFlowState = createFeatureSelector<FlowState>('flow');

// Sub-state selectors
export const selectVersesState = createSelector(
  selectFlowState,
  (state) => state.verses
);

export const selectUIState = createSelector(
  selectFlowState,
  (state) => state.ui
);

export const selectNavigationState = createSelector(
  selectFlowState,
  (state) => state.navigation
);

export const selectFilterState = createSelector(
  selectFlowState,
  (state) => state.filters
);

export const selectStudyState = createSelector(
  selectFlowState,
  (state) => state.study
);

export const selectCrossReferencesState = createSelector(
  selectFlowState,
  (state) => state.crossReferences
);

export const selectTopicalState = createSelector(
  selectFlowState,
  (state) => state.topical
);

export const selectDeckState = createSelector(
  selectFlowState,
  (state) => state.decks
);

export const selectSettingsState = createSelector(
  selectFlowState,
  (state) => state.settings
);

// Entity selectors
const { selectIds, selectEntities, selectAll, selectTotal } = verseAdapter.getSelectors();

export const selectVerseIds = createSelector(selectVersesState, selectIds);
export const selectVerseEntities = createSelector(selectVersesState, selectEntities);
export const selectAllVerses = createSelector(selectVersesState, selectAll);
export const selectVersesTotal = createSelector(selectVersesState, selectTotal);

// Selected verses
export const selectSelectedVerseIds = createSelector(
  selectVersesState,
  (state) => state.selectedVerseIds
);

export const selectSelectedVerses = createSelector(
  selectAllVerses,
  selectSelectedVerseIds,
  (verses, selectedIds) => verses.filter(v => selectedIds.includes(v.verseCode))
);

export const selectSelectionCount = createSelector(
  selectSelectedVerseIds,
  (ids) => ids.length
);

export const selectHasSelection = createSelector(
  selectSelectionCount,
  (count) => count > 0
);

// Memorized verses
export const selectMemorizedVerseIds = createSelector(
  selectVersesState,
  (state) => state.memorizedVerseIds
);

export const selectMemorizedVerses = createSelector(
  selectAllVerses,
  selectMemorizedVerseIds,
  (verses, memorizedIds) => verses.filter(v => memorizedIds.includes(v.verseCode))
);

export const selectMemorizedCount = createSelector(
  selectMemorizedVerseIds,
  (ids) => ids.length
);

export const selectMemorizationProgress = createSelector(
  selectVersesTotal,
  selectMemorizedCount,
  (total, memorized) => ({
    total,
    memorized,
    remaining: total - memorized,
    percentage: total > 0 ? Math.round((memorized / total) * 100) : 0
  })
);

// UI selectors
export const selectMode = createSelector(
  selectUIState,
  (state) => state.mode
);

export const selectFontSize = createSelector(
  selectUIState,
  (state) => state.fontSize
);

export const selectLayoutMode = createSelector(
  selectUIState,
  (state) => state.layoutMode
);

export const selectShowFullText = createSelector(
  selectUIState,
  (state) => state.showFullText
);

export const selectIsLoading = createSelector(
  selectUIState,
  (state) => state.isLoading
);

export const selectLoadingMessage = createSelector(
  selectUIState,
  (state) => state.loadingMessage
);

export const selectError = createSelector(
  selectUIState,
  (state) => state.error
);

export const selectContextMenu = createSelector(
  selectUIState,
  (state) => state.contextMenu
);

// Navigation selectors
export const selectCurrentBook = createSelector(
  selectNavigationState,
  (state) => ({
    id: state.currentBookId,
    name: state.currentBookName
  })
);

export const selectCurrentChapter = createSelector(
  selectNavigationState,
  (state) => state.currentChapter
);

export const selectCurrentLocation = createSelector(
  selectNavigationState,
  (state) => ({
    bookId: state.currentBookId,
    bookName: state.currentBookName,
    chapter: state.currentChapter
  })
);

export const selectNavigationHistory = createSelector(
  selectNavigationState,
  (state) => state.navigationHistory
);

// Filter selectors
export const selectSearchTerm = createSelector(
  selectFilterState,
  (state) => state.searchTerm
);

export const selectActiveFilter = createSelector(
  selectFilterState,
  (state) => state.activeFilter
);

export const selectFilterFlags = createSelector(
  selectFilterState,
  (state) => ({
    showMemorizedOnly: state.showMemorizedOnly,
    showToLearnOnly: state.showToLearnOnly,
    showReviewOnly: state.showReviewOnly
  })
);

// Filtered verses selector (complex)
export const selectFilteredVerses = createSelector(
  selectAllVerses,
  selectMemorizedVerseIds,
  selectFilterState,
  selectVersesState,
  (verses, memorizedIds, filters, verseState) => {
    let filtered = [...verses];
    
    // Apply search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.text.toLowerCase().includes(term) ||
        v.reference.toLowerCase().includes(term)
      );
    }
    
    // Apply memorization filters
    if (filters.showMemorizedOnly) {
      filtered = filtered.filter(v => memorizedIds.includes(v.verseCode));
    } else if (filters.showToLearnOnly) {
      filtered = filtered.filter(v => !memorizedIds.includes(v.verseCode));
    } else if (filters.showReviewOnly) {
      filtered = filtered.filter(v => {
        if (!memorizedIds.includes(v.verseCode)) return false;
        
        const lastReview = verseState.lastReviewDates[v.verseCode];
        if (!lastReview) return true;
        
        const daysSinceReview = (Date.now() - lastReview) / (1000 * 60 * 60 * 24);
        return daysSinceReview >= 3; // Review after 3 days
      });
    }
    
    return filtered;
  }
);

// Study session selectors
export const selectIsStudyActive = createSelector(
  selectStudyState,
  (state) => state.isActive
);

export const selectStudySessionId = createSelector(
  selectStudyState,
  (state) => state.sessionId
);

export const selectStudyProgress = createSelector(
  selectStudyState,
  (state) => ({
    current: state.currentIndex + 1,
    total: state.verseCodes.length,
    percentage: state.verseCodes.length > 0 
      ? Math.round(((state.currentIndex + 1) / state.verseCodes.length) * 100)
      : 0
  })
);

export const selectStudyStats = createSelector(
  selectStudyState,
  (state) => ({
    correct: state.correctAnswers,
    attempts: state.totalAttempts,
    accuracy: state.totalAttempts > 0 
      ? Math.round((state.correctAnswers / state.totalAttempts) * 100)
      : 0,
    duration: state.startTime && state.endTime 
      ? state.endTime - state.startTime
      : state.startTime 
      ? Date.now() - state.startTime
      : 0
  })
);

export const selectCurrentStudyVerse = createSelector(
  selectStudyState,
  selectVerseEntities,
  (study, entities) => {
    if (!study.isActive || study.currentIndex >= study.verseCodes.length) {
      return null;
    }
    const verseCode = study.verseCodes[study.currentIndex];
    return entities[verseCode] || null;
  }
);

// Cross references selectors
export const selectCrossReferences = createSelector(
  selectCrossReferencesState,
  (state) => state.references
);

export const selectFilteredCrossReferences = createSelector(
  selectCrossReferences,
  selectCrossReferencesState,
  (references, state) => references.filter(r => r.crossRefConfidence >= state.confidenceThreshold)
);

export const selectCrossReferencesLoading = createSelector(
  selectCrossReferencesState,
  (state) => state.loadingReferences
);

// Topical selectors
export const selectTopicalVerses = createSelector(
  selectTopicalState,
  (state) => state.topicalVerses
);

export const selectFilteredTopicalVerses = createSelector(
  selectTopicalVerses,
  selectTopicalState,
  (verses, state) => verses.filter(v => v.topicRelevance >= state.relevanceThreshold)
);

export const selectCurrentTopic = createSelector(
  selectTopicalState,
  (state) => ({
    id: state.currentTopicId,
    name: state.currentTopicName
  })
);

export const selectAvailableTopics = createSelector(
  selectTopicalState,
  (state) => state.availableTopics
);

// Deck selectors
export const selectDecks = createSelector(
  selectDeckState,
  (state) => state.decks
);

export const selectActiveDeck = createSelector(
  selectDeckState,
  (state) => state.decks.find(d => d.id === state.activeDeckId) || null
);

// Settings selectors
export const selectDefaultTranslation = createSelector(
  selectSettingsState,
  (state) => state.defaultTranslation
);

export const selectKeyboardShortcutsEnabled = createSelector(
  selectSettingsState,
  (state) => state.enableKeyboardShortcuts
);

export const selectTheme = createSelector(
  selectSettingsState,
  (state) => state.theme
);

// Combined selectors for specific views
export const selectMemorizationViewData = createSelector(
  selectFilteredVerses,
  selectMemorizedVerseIds,
  selectSelectedVerseIds,
  selectMemorizationProgress,
  selectIsLoading,
  (verses, memorizedIds, selectedIds, progress, isLoading) => ({
    verses: verses.map(v => ({
      ...v,
      isMemorized: memorizedIds.includes(v.verseCode),
      isSelected: selectedIds.includes(v.verseCode)
    })),
    progress,
    isLoading
  })
);

export const selectCrossReferencesViewData = createSelector(
  selectFilteredCrossReferences,
  selectCrossReferencesState,
  selectIsLoading,
  (references, state, isLoading) => ({
    sourceVerseCode: state.sourceVerseCode,
    references,
    selectedReferenceCode: state.selectedReferenceCode,
    isLoading: isLoading || state.loadingReferences
  })
);

export const selectTopicalViewData = createSelector(
  selectFilteredTopicalVerses,
  selectCurrentTopic,
  selectAvailableTopics,
  selectIsLoading,
  selectTopicalState,
  (verses, currentTopic, topics, isLoading, state) => ({
    verses,
    currentTopic,
    availableTopics: topics,
    isLoading: isLoading || state.loadingTopical
  })
);

// Performance selectors (memoized computations)
export const selectVersesForVirtualScroll = createSelector(
  selectFilteredVerses,
  selectMemorizedVerseIds,
  selectSelectedVerseIds,
  (verses, memorizedIds, selectedIds) => {
    // Pre-compute all properties for virtual scrolling
    return verses.map(v => ({
      ...v,
      isMemorized: memorizedIds.includes(v.verseCode),
      isSelected: selectedIds.includes(v.verseCode),
      displayClasses: [
        memorizedIds.includes(v.verseCode) ? 'memorized' : '',
        selectedIds.includes(v.verseCode) ? 'selected' : ''
      ].filter(Boolean).join(' ')
    }));
  }
);

// Statistics selectors
export const selectStatistics = createSelector(
  selectVersesTotal,
  selectMemorizedCount,
  selectSelectionCount,
  selectStudyState,
  selectNavigationHistory,
  (total, memorized, selected, study, history) => ({
    totalVerses: total,
    memorizedVerses: memorized,
    selectedVerses: selected,
    studySessions: study.sessionId ? 1 : 0,
    chaptersVisited: new Set(history.map(h => `${h.bookId}-${h.chapter}`)).size,
    lastActivity: history[history.length - 1]?.timestamp || null
  })
);