import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BibleTrackerState, BibleTrackerUIState, ReadingFilters } from '../models/bible-tracker.model';
import { selectAllBooks, selectAllPlans } from '../reducers/bible-tracker.reducer';
import { BibleBook } from '../../../core/models/bible';

export const selectBibleTrackerState = createFeatureSelector<BibleTrackerState>('bibleTracker');

export const selectBooksState = createSelector(selectBibleTrackerState, (state) => state.books);
export const selectReadingPlansState = createSelector(selectBibleTrackerState, (state) => state.readingPlans);
export const selectStatistics = createSelector(selectBibleTrackerState, (state) => state.readingStatistics);
export const selectStreak = createSelector(selectBibleTrackerState, (state) => state.dailyStreak);
export const selectUI = createSelector(selectBibleTrackerState, (state) => state.ui);

export const selectAllBooksArray = createSelector(selectBooksState, selectAllBooks);
export const selectAllPlansArray = createSelector(selectReadingPlansState, selectAllPlans);

export const selectSelectedBookId = createSelector(selectUI, (ui: BibleTrackerUIState) => ui.selectedBookId);
export const selectSelectedChapter = createSelector(selectUI, (ui: BibleTrackerUIState) => ui.selectedChapter);
export const selectViewMode = createSelector(selectUI, (ui: BibleTrackerUIState) => ui.viewMode);
export const selectFilters = createSelector(selectUI, (ui: BibleTrackerUIState) => ui.filters);

export const selectSelectedBook = createSelector(
  selectAllBooksArray,
  selectSelectedBookId,
  (books: BibleBook[], id: string | null) => books.find((b) => b.id === (id ? parseInt(id, 10) : -1)) || null
);

export const selectCompletionPercentage = createSelector(
  selectStatistics,
  (stats) => (stats.totalVerses ? Math.round((stats.versesRead / stats.totalVerses) * 100) : 0)
);

export const selectReadingStatistics = createSelector(selectStatistics, (s) => s);
export const selectBibleTrackerLoading = createSelector(selectBibleTrackerState, (s) => s.loading);
