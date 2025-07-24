import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  BibleTrackerState,
  BibleTrackerUIState,
  ReadingFilters,
  ReadingStatistics,
} from '../models/bible-tracker.model';
import {
  selectAllBooks as selectAllBooksAdapter,
  selectAllPlans as selectAllPlansAdapter,
} from '../reducers/bible-tracker.reducer';
import { BibleBook } from '../../../core/models/bible';

export const selectBibleTrackerState = createFeatureSelector<BibleTrackerState>('bibleTracker');
export const selectReadingProgress = createSelector(selectBibleTrackerState, (state) => ({
  books: state.books.entities,
  lastSync: state.readingProgress.lastSync,
}));

export const selectBooksState = createSelector(selectBibleTrackerState, (state) => state.books);
export const selectReadingPlansState = createSelector(selectBibleTrackerState, (state) => state.readingPlans);
export const selectStatistics = createSelector(selectBibleTrackerState, (state) => state.readingStatistics);
export const selectStreak = createSelector(selectBibleTrackerState, (state) => state.dailyStreak);
export const selectUI = createSelector(selectBibleTrackerState, (state) => state.ui);

export const selectAllBooksArray = createSelector(
  selectBooksState,
  selectAllBooksAdapter
);
export const selectAllPlansArray = createSelector(
  selectReadingPlansState,
  selectAllPlansAdapter
);

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

// Aliases for backwards compatibility
export const selectAllBooks: typeof selectAllBooksArray = selectAllBooksArray;

export const selectIsLoadingProgress = createSelector(
  selectBibleTrackerLoading,
  (loading) => loading.progress
);

export const selectBookById = (id: string) =>
  createSelector(selectBooksState, (state) => state.entities[id] || null);

export const selectFilteredBooks = createSelector(
  selectAllBooksArray,
  selectFilters,
  (books: BibleBook[], filters) =>
    filters.showCompleted ? books.filter((b: any) => b.percentComplete === 100) : books
);

export const selectStatisticsOverview = createSelector(
  selectReadingStatistics,
  (stats: ReadingStatistics) => stats
);

export const selectTodaysProgress = createSelector(selectAllBooksArray, (books: BibleBook[]) => {
  const today = new Date().toDateString();
  let versesReadToday = 0;
  let chaptersCompletedToday = 0;
  books.forEach((book: any) => {
    (book.chapters || []).forEach((chapter: any) => {
      if (chapter.completedDate && new Date(chapter.completedDate).toDateString() === today) {
        chaptersCompletedToday++;
        versesReadToday += chapter.versesRead.length;
      }
    });
  });
  return { versesReadToday, chaptersCompletedToday };
});

export const selectIsAnyLoading = createSelector(selectBibleTrackerLoading, (l) =>
  Object.values(l).some(Boolean)
);

export const selectSelectedBookDetails = createSelector(
  selectSelectedBookId,
  selectBooksState,
  (id, state) => (id ? state.entities[id] || null : null)
);
