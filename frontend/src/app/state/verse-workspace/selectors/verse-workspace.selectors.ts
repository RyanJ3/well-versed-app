import { createFeatureSelector, createSelector } from '@ngrx/store';
import { VerseWorkspaceState } from '../models/verse-workspace.state';
import { WorkspaceVerseUtils } from '@features/verse-workspace/utils/workspace-verse.utils';

export const selectVerseWorkspaceState = createFeatureSelector<VerseWorkspaceState>('verseWorkspace');

// Core selectors
export const selectCurrentBook = createSelector(
  selectVerseWorkspaceState,
  (state) => state.currentBook
);

export const selectCurrentChapter = createSelector(
  selectVerseWorkspaceState,
  (state) => state.currentChapter
);

export const selectCurrentBibleChapter = createSelector(
  selectVerseWorkspaceState,
  (state) => state.currentBibleChapter
);

export const selectVerses = createSelector(
  selectVerseWorkspaceState,
  (state) => state.verses
);

export const selectFilteredVerses = createSelector(
  selectVerseWorkspaceState,
  (state) => state.filteredVerses
);

// Cross References selectors
export const selectCrossReferences = createSelector(
  selectVerseWorkspaceState,
  (state) => state.crossReferences
);

export const selectCrossReferenceVerses = createSelector(
  selectCrossReferences,
  (crossRefs) => crossRefs.verses
);

export const selectSelectedCrossRefVerse = createSelector(
  selectCrossReferences,
  (crossRefs) => crossRefs.selectedVerse
);

export const selectCrossReferencesLoading = createSelector(
  selectCrossReferences,
  (crossRefs) => crossRefs.isLoading
);

// Topical selectors
export const selectTopical = createSelector(
  selectVerseWorkspaceState,
  (state) => state.topical
);

export const selectTopicalVerses = createSelector(
  selectTopical,
  (topical) => topical.verses
);

export const selectSelectedTopic = createSelector(
  selectTopical,
  (topical) => topical.selectedTopic
);

export const selectAvailableTopics = createSelector(
  selectTopical,
  (topical) => topical.availableTopics
);

export const selectTopicalLoading = createSelector(
  selectTopical,
  (topical) => topical.isLoading
);

// Selection selectors
export const selectSelection = createSelector(
  selectVerseWorkspaceState,
  (state) => state.selection
);

export const selectSelectedVerses = createSelector(
  selectSelection,
  (selection) => new Set(selection.selectedVerses)
);

export const selectSelectedVersesCount = createSelector(
  selectSelection,
  (selection) => selection.selectedVerses.length
);

export const selectIsDragging = createSelector(
  selectSelection,
  (selection) => selection.isDragging
);

// Memorization selectors
export const selectMemorization = createSelector(
  selectVerseWorkspaceState,
  (state) => state.memorization
);

export const selectModalVerses = createSelector(
  selectMemorization,
  (memorization) => memorization.modalVerses
);

export const selectVerseReviewData = createSelector(
  selectMemorization,
  (memorization) => memorization.verseReviewData
);

export const selectIsSavingVerse = createSelector(
  selectMemorization,
  (memorization) => (verseCode: string) => memorization.isSaving[verseCode] || false
);

// UI selectors
export const selectUI = createSelector(
  selectVerseWorkspaceState,
  (state) => state.ui
);

export const selectMode = createSelector(
  selectUI,
  (ui) => ui.mode
);

export const selectShowFullText = createSelector(
  selectUI,
  (ui) => ui.showFullText
);

export const selectFontSize = createSelector(
  selectUI,
  (ui) => ui.fontSize
);

export const selectLayoutMode = createSelector(
  selectUI,
  (ui) => ui.layoutMode
);

export const selectActiveFilter = createSelector(
  selectUI,
  (ui) => ui.activeFilter
);

export const selectShowSettings = createSelector(
  selectUI,
  (ui) => ui.showSettings
);

export const selectShowModal = createSelector(
  selectUI,
  (ui) => ui.showModal
);

export const selectModalChapterName = createSelector(
  selectUI,
  (ui) => ui.modalChapterName
);

export const selectContextMenu = createSelector(
  selectUI,
  (ui) => ui.contextMenu
);

export const selectShowEncouragement = createSelector(
  selectUI,
  (ui) => ui.showEncouragement
);

export const selectTargetVerseAfterLoad = createSelector(
  selectUI,
  (ui) => ui.targetVerseAfterLoad
);

// Loading selectors
export const selectLoading = createSelector(
  selectVerseWorkspaceState,
  (state) => state.loading
);

export const selectVersesLoading = createSelector(
  selectLoading,
  (loading) => loading.verses
);

// Error selectors
export const selectErrors = createSelector(
  selectVerseWorkspaceState,
  (state) => state.errors
);

// Computed selectors
export const selectMemorizedVersesCount = createSelector(
  selectVerses,
  (verses) => WorkspaceVerseUtils.getVerseCounts(verses).memorized
);

export const selectUnmemorizedVersesCount = createSelector(
  selectVerses,
  (verses) => WorkspaceVerseUtils.getVerseCounts(verses).unmemorized
);

export const selectNeedsReviewCount = createSelector(
  selectVerses,
  selectVerseReviewData,
  (verses, reviewData) => WorkspaceVerseUtils.getVerseCounts(verses, reviewData).needsReview
);

export const selectProgressPercentage = createSelector(
  selectCurrentBook,
  (book) => {
    if (!book) return 0;
    return WorkspaceVerseUtils.calculateProgress(
      book.memorizedVerses,
      book.totalVerses
    );
  }
);

export const selectProgressBarWidth = createSelector(
  selectMemorizedVersesCount,
  selectVerses,
  (memorizedCount, verses) => {
    if (verses.length === 0) return 0;
    return WorkspaceVerseUtils.calculateProgress(memorizedCount, verses.length);
  }
);

export const selectCurrentVerses = createSelector(
  selectMode,
  selectVerses,
  selectCrossReferenceVerses,
  selectTopicalVerses,
  (mode, verses, crossRefVerses, topicalVerses) => {
    switch (mode) {
      case 'crossReferences':
        return crossRefVerses;
      case 'topical':
        return topicalVerses;
      default:
        return verses;
    }
  }
);

export const selectFilteredCurrentVerses = createSelector(
  selectCurrentVerses,
  selectActiveFilter,
  selectVerseReviewData,
  (verses, filter, reviewData) => {
    return WorkspaceVerseUtils.filterVerses(verses, filter, reviewData);
  }
);

export const selectSelectedVerseIsMemorized = createSelector(
  selectContextMenu,
  selectCurrentVerses,
  (contextMenu, verses) => {
    if (!contextMenu.verseId) return false;
    const verse = verses.find(v => v.verseCode === contextMenu.verseId);
    return verse?.isMemorized || false;
  }
);

export const selectShouldShowMarkAsMemorized = createSelector(
  selectContextMenu,
  selectSelectedVerses,
  selectCurrentVerses,
  (contextMenu, selectedVerses, verses) => {
    if (contextMenu.selectedCount > 0) {
      return Array.from(selectedVerses).some(verseCode => {
        const verse = verses.find(v => v.verseCode === verseCode);
        return verse && !verse.isMemorized;
      });
    }
    const verse = verses.find(v => v.verseCode === contextMenu.verseId);
    return verse && !verse.isMemorized;
  }
);

export const selectShouldShowMarkAsUnmemorized = createSelector(
  selectContextMenu,
  selectSelectedVerses,
  selectCurrentVerses,
  (contextMenu, selectedVerses, verses) => {
    if (contextMenu.selectedCount > 0) {
      return Array.from(selectedVerses).some(verseCode => {
        const verse = verses.find(v => v.verseCode === verseCode);
        return verse && verse.isMemorized;
      });
    }
    const verse = verses.find(v => v.verseCode === contextMenu.verseId);
    return verse && verse.isMemorized;
  }
);

// Cross-reference specific computed selectors
export const selectCrossReferenceCount = createSelector(
  selectCrossReferenceVerses,
  (verses) => verses.length
);

export const selectUnmemorizedCrossRefCount = createSelector(
  selectCrossReferenceVerses,
  (verses) => verses.filter(v => !v.isMemorized).length
);

export const selectFilteredCrossReferences = createSelector(
  selectCrossReferenceVerses,
  selectActiveFilter,
  (verses, filter) => {
    if (filter === 'all') return verses;
    if (filter === 'unmemorized') return verses.filter(v => !v.isMemorized);
    return verses;
  }
);

// Topical specific computed selectors
export const selectTopicalVerseCount = createSelector(
  selectTopicalVerses,
  (verses) => verses.length
);

export const selectUnmemorizedTopicalCount = createSelector(
  selectTopicalVerses,
  (verses) => verses.filter(v => !v.isMemorized).length
);

export const selectFilteredTopicalVerses = createSelector(
  selectTopicalVerses,
  selectActiveFilter,
  (verses, filter) => {
    if (filter === 'all') return verses;
    if (filter === 'unmemorized') return verses.filter(v => !v.isMemorized);
    return verses;
  }
);