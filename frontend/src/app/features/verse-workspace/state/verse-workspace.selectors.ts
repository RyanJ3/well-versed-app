import { createFeatureSelector, createSelector } from '@ngrx/store';
import { VerseWorkspaceState, VerseData } from './verse-workspace.state';

// Feature Selector
export const selectVerseWorkspaceState = createFeatureSelector<VerseWorkspaceState>('verseWorkspace');

// ============= VERSE SELECTORS =============
export const selectAllVerses = createSelector(
  selectVerseWorkspaceState,
  (state) => state.verses
);

export const selectCurrentBook = createSelector(
  selectVerseWorkspaceState,
  (state) => state.currentBook
);

export const selectCurrentChapter = createSelector(
  selectVerseWorkspaceState,
  (state) => state.currentChapter
);

export const selectMemorizedVerses = createSelector(
  selectAllVerses,
  (verses) => verses.filter(v => v.isMemorized)
);

export const selectUnmemorizedVerses = createSelector(
  selectAllVerses,
  (verses) => verses.filter(v => !v.isMemorized)
);

export const selectVersesBySection = createSelector(
  selectAllVerses,
  (verses) => {
    const sections: { [key: string]: VerseData[] } = {};
    verses.forEach(verse => {
      const section = `${verse.bookId}-${verse.chapterNumber}`;
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(verse);
    });
    return sections;
  }
);

// ============= UI SELECTORS =============
export const selectUIState = createSelector(
  selectVerseWorkspaceState,
  (state) => state.ui
);

export const selectViewType = createSelector(
  selectUIState,
  (ui) => ui.viewType
);

export const selectMode = createSelector(
  selectUIState,
  (ui) => ui.mode
);

export const selectActiveModal = createSelector(
  selectUIState,
  (ui) => ui.activeModal
);

export const selectIsHeaderExpanded = createSelector(
  selectUIState,
  (ui) => ui.isHeaderExpanded
);

export const selectShowFilters = createSelector(
  selectUIState,
  (ui) => ui.showFilters
);

export const selectFontSize = createSelector(
  selectUIState,
  (ui) => ui.fontSize
);

// ============= SELECTION SELECTORS =============
export const selectSelectionState = createSelector(
  selectVerseWorkspaceState,
  (state) => state.selection
);

export const selectSelectedVerses = createSelector(
  selectSelectionState,
  selectAllVerses,
  (selection, verses) => verses.filter(v => selection.selectedVerses.includes(v.id))
);

export const selectSelectedVerseIds = createSelector(
  selectSelectionState,
  (selection) => selection.selectedVerses
);

export const selectIsSelectionMode = createSelector(
  selectSelectionState,
  (selection) => selection.selectionMode
);

export const selectHasSelection = createSelector(
  selectSelectionState,
  (selection) => selection.selectedVerses.length > 0
);

// ============= MEMORIZATION SELECTORS =============
export const selectMemorizationState = createSelector(
  selectVerseWorkspaceState,
  (state) => state.memorization
);

export const selectActiveSession = createSelector(
  selectMemorizationState,
  (memorization) => memorization.activeSession
);

export const selectMemorizationHistory = createSelector(
  selectMemorizationState,
  (memorization) => memorization.history
);

export const selectMemorizationStats = createSelector(
  selectMemorizationState,
  (memorization) => ({
    streakDays: memorization.streakDays,
    totalVersesMemorized: memorization.totalVersesMemorized,
    dailyGoal: memorization.dailyGoal,
    dailyProgress: memorization.dailyProgress,
    percentComplete: (memorization.dailyProgress / memorization.dailyGoal) * 100
  })
);

export const selectCurrentSessionProgress = createSelector(
  selectActiveSession,
  (session) => session ? {
    currentVerse: session.currentIndex + 1,
    totalVerses: session.verses.length,
    percentComplete: ((session.currentIndex + 1) / session.verses.length) * 100,
    mistakeCount: session.mistakeCount,
    hintsUsed: session.hintsUsed
  } : null
);

// ============= SETTINGS SELECTORS =============
export const selectSettings = createSelector(
  selectVerseWorkspaceState,
  (state) => state.settings
);

export const selectAutoAdvance = createSelector(
  selectSettings,
  (settings) => settings.autoAdvance
);

export const selectShowVerseNumbers = createSelector(
  selectSettings,
  (settings) => settings.showVerseNumbers
);

export const selectHideMemorizedVerses = createSelector(
  selectSettings,
  (settings) => settings.hideMemorizedVerses
);

// ============= LOADING SELECTORS =============
export const selectLoadingState = createSelector(
  selectVerseWorkspaceState,
  (state) => state.loading
);

export const selectIsLoadingVerses = createSelector(
  selectLoadingState,
  (loading) => loading.verses
);

export const selectIsSaving = createSelector(
  selectLoadingState,
  (loading) => loading.saving
);

// ============= ERROR SELECTORS =============
export const selectError = createSelector(
  selectVerseWorkspaceState,
  (state) => state.errors
);

export const selectHasError = createSelector(
  selectError,
  (error) => error.message !== null
);

// ============= COMPUTED SELECTORS =============
export const selectMemorizationProgress = createSelector(
  selectAllVerses,
  (verses) => {
    const total = verses.length;
    const memorized = verses.filter(v => v.isMemorized).length;
    return {
      memorized,
      total,
      percentage: total > 0 ? (memorized / total) * 100 : 0
    };
  }
);

export const selectFilteredVerses = createSelector(
  selectAllVerses,
  selectSettings,
  (verses, settings) => {
    let filtered = [...verses];
    
    if (settings.hideMemorizedVerses) {
      filtered = filtered.filter(v => !v.isMemorized);
    }
    
    return filtered;
  }
);

export const selectVerseById = (verseId: string) => createSelector(
  selectAllVerses,
  (verses) => verses.find(v => v.id === verseId)
);

export const selectChapterNavigation = createSelector(
  selectCurrentBook,
  selectCurrentChapter,
  (book, chapter) => {
    if (!book || !chapter) return null;
    
    return {
      canGoNext: chapter.chapterNumber < book.totalChapters,
      canGoPrevious: chapter.chapterNumber > 1,
      currentChapter: chapter.chapterNumber,
      totalChapters: book.totalChapters,
      bookName: book.name
    };
  }
);

export const selectDailyStats = createSelector(
  selectMemorizationStats,
  selectMemorizationHistory,
  (stats, history) => {
    const today = new Date().toDateString();
    const todaySessions = history.filter(h => new Date(h.date).toDateString() === today);
    
    return {
      ...stats,
      sessionsToday: todaySessions.length,
      timeSpentToday: todaySessions.reduce((acc, s) => acc + s.timeSpent, 0),
      averageAccuracy: todaySessions.length > 0
        ? todaySessions.reduce((acc, s) => acc + s.accuracy, 0) / todaySessions.length
        : 0
    };
  }
);