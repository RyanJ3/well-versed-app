import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  BibleTrackerState,
  ReadingProgressState,
  BibleStatisticsState,
  StreakStatistics,
  BibleTrackerUIState,
} from '../models/bible-tracker.model';
import { BibleBook, BibleChapter } from '../../core/models/bible';

// Feature selector
export const selectBibleTrackerState = createFeatureSelector<BibleTrackerState>('bibleTracker');

// Reading Progress selectors
export const selectReadingProgress = createSelector(
  selectBibleTrackerState,
  (state: BibleTrackerState) => state.readingProgress
);

export const selectAllBooks = createSelector(
  selectReadingProgress,
  (progress: ReadingProgressState) => Object.values(progress.books)
);

export const selectBookById = (bookId: string) =>
  createSelector(
    selectReadingProgress,
    (progress: ReadingProgressState) => progress.books[bookId]
  );

export const selectChapter = (bookId: string, chapter: number) =>
  createSelector(
    selectBookById(bookId),
    (book: BibleBook | undefined) => book?.chapters[chapter - 1] || null
  );

export const selectIsBookComplete = (bookId: string) =>
  createSelector(selectBookById(bookId), (book: BibleBook | undefined) => {
    if (!book) return false;
    return book.percentComplete === 100;
  });

// Statistics selectors
export const selectStatistics = createSelector(
  selectBibleTrackerState,
  (state: BibleTrackerState) => state.statistics
);

export const selectStatisticsOverview = createSelector(
  selectStatistics,
  (stats: BibleStatisticsState) => stats.overview
);

export const selectStreaks = createSelector(
  selectStatistics,
  (stats: BibleStatisticsState) => stats.streaks
);

export const selectCurrentStreak = createSelector(
  selectStreaks,
  (streaks: StreakStatistics) => streaks.currentStreak
);

// UI selectors
export const selectUI = createSelector(
  selectBibleTrackerState,
  (state: BibleTrackerState) => state.ui
);

export const selectSelectedBook = createSelector(
  selectUI,
  (ui: BibleTrackerUIState) => ui.selectedBook
);

export const selectSelectedChapter = createSelector(
  selectUI,
  (ui: BibleTrackerUIState) => ui.selectedChapter
);

export const selectViewMode = createSelector(
  selectUI,
  (ui: BibleTrackerUIState) => ui.viewMode
);

// Combined selectors
export const selectSelectedBookDetails = createSelector(
  selectReadingProgress,
  selectSelectedBook,
  (
    progress: ReadingProgressState,
    selectedBookId: string | null
  ) =>
    selectedBookId ? progress.books[selectedBookId] : null
);

export const selectFilteredBooks = createSelector(
  selectAllBooks,
  selectUI,
  (books: BibleBook[], ui: BibleTrackerUIState) => {
    if (!ui.showCompletedOnly) {
      return books;
    }
    return books.filter((book) => book.percentComplete === 100);
  }
);

// Loading states
export const selectIsLoadingProgress = createSelector(
  selectReadingProgress,
  (progress: ReadingProgressState) => progress.loading
);

export const selectIsLoadingStatistics = createSelector(
  selectStatistics,
  (stats: BibleStatisticsState) => stats.loading
);

export const selectIsAnyLoading = createSelector(
  selectIsLoadingProgress,
  selectIsLoadingStatistics,
  (
    progressLoading: boolean,
    statsLoading: boolean
  ) => progressLoading || statsLoading
);

// Error states
export const selectProgressError = createSelector(
  selectReadingProgress,
  (progress: ReadingProgressState) => progress.error
);

export const selectStatisticsError = createSelector(
  selectStatistics,
  (stats: BibleStatisticsState) => stats.error
);

// Helper to convert lastSync string to Date
export const selectLastSyncDate = createSelector(
  selectReadingProgress,
  (progress: ReadingProgressState) =>
    progress.lastSync ? new Date(progress.lastSync) : null
);

// Progress calculations
export const selectTodaysProgress = createSelector(
  selectAllBooks,
  (books: BibleBook[]) => {
    const today = new Date().toDateString();
    let versesReadToday = 0;
    let chaptersCompletedToday = 0;

    books.forEach((book: BibleBook) => {
      book.chapters.forEach((chapter: BibleChapter) => {
        if (chapter.completedDate &&
            new Date(chapter.completedDate).toDateString() === today) {
          chaptersCompletedToday++;
          versesReadToday += chapter.versesRead.length;
        }
      });
    });

    return { versesReadToday, chaptersCompletedToday };
  }
);
