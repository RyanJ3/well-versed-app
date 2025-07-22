import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BibleTrackerState, BookProgress } from '../models/bible-tracker.model';

// Feature selector
export const selectBibleTrackerState = createFeatureSelector<BibleTrackerState>('bibleTracker');

// Reading Progress selectors
export const selectReadingProgress = createSelector(
  selectBibleTrackerState,
  (state) => state.readingProgress
);

export const selectAllBooks = createSelector(
  selectReadingProgress,
  (progress) => Object.values(progress.books)
);

export const selectBookById = (bookId: string) =>
  createSelector(selectReadingProgress, (progress) => progress.books[bookId]);

export const selectChapterProgress = (bookId: string, chapter: number) =>
  createSelector(
    selectBookById(bookId),
    (book) => book?.chapters[chapter] || null
  );

export const selectIsBookComplete = (bookId: string) =>
  createSelector(selectBookById(bookId), (book) => {
    if (!book) return false;
    return book.percentComplete === 100;
  });

// Statistics selectors
export const selectStatistics = createSelector(
  selectBibleTrackerState,
  (state) => state.statistics
);

export const selectStatisticsOverview = createSelector(
  selectStatistics,
  (stats) => stats.overview
);

export const selectStreaks = createSelector(
  selectStatistics,
  (stats) => stats.streaks
);

export const selectCurrentStreak = createSelector(
  selectStreaks,
  (streaks) => streaks.currentStreak
);

// UI selectors
export const selectUI = createSelector(
  selectBibleTrackerState,
  (state) => state.ui
);

export const selectSelectedBook = createSelector(
  selectUI,
  (ui) => ui.selectedBook
);

export const selectSelectedChapter = createSelector(
  selectUI,
  (ui) => ui.selectedChapter
);

export const selectViewMode = createSelector(
  selectUI,
  (ui) => ui.viewMode
);

// Combined selectors
export const selectSelectedBookDetails = createSelector(
  selectReadingProgress,
  selectSelectedBook,
  (progress, selectedBookId) =>
    selectedBookId ? progress.books[selectedBookId] : null
);

export const selectFilteredBooks = createSelector(
  selectAllBooks,
  selectUI,
  (books, ui) => {
    if (!ui.showCompletedOnly) {
      return books;
    }
    return books.filter((book) => book.percentComplete === 100);
  }
);

// Loading states
export const selectIsLoadingProgress = createSelector(
  selectReadingProgress,
  (progress) => progress.loading
);

export const selectIsLoadingStatistics = createSelector(
  selectStatistics,
  (stats) => stats.loading
);

export const selectIsAnyLoading = createSelector(
  selectIsLoadingProgress,
  selectIsLoadingStatistics,
  (progressLoading, statsLoading) => progressLoading || statsLoading
);

// Error states
export const selectProgressError = createSelector(
  selectReadingProgress,
  (progress) => progress.error
);

export const selectStatisticsError = createSelector(
  selectStatistics,
  (stats) => stats.error
);

// Progress calculations
export const selectTodaysProgress = createSelector(
  selectAllBooks,
  (books) => {
    const today = new Date().toDateString();
    let versesReadToday = 0;
    let chaptersCompletedToday = 0;

    books.forEach((book) => {
      Object.values(book.chapters).forEach((chapter) => {
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
