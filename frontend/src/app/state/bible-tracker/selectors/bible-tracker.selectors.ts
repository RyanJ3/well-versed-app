import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  BibleTrackerState,
  ReadingProgressState,
  BibleStatisticsState,
  StreakStatistics,
  BibleTrackerUIState,
} from '../models/bible-tracker.model';
import { BibleBook, BibleChapter } from '../../../core/models/bible';

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

export const selectProgressViewMode = createSelector(
  selectUI,
  (ui: BibleTrackerUIState) => ui.progressViewMode
);

export const selectIncludeApocrypha = createSelector(
  selectUI,
  (ui: BibleTrackerUIState) => ui.includeApocrypha
);

export const selectSelectedGroup = createSelector(
  selectSelectedBookDetails,
  (book: BibleBook | null) => book ? book.group : null
);

export const selectSelectedTestament = createSelector(
  selectSelectedBookDetails,
  (book: BibleBook | null) => book ? book.testament : null
);

export const selectSelectedChapterDetails = createSelector(
  selectSelectedBookDetails,
  selectSelectedChapter,
  (book: BibleBook | null, chapter: number | null) =>
    book && chapter ? book.chapters[chapter - 1] : null
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
    let filtered = books;
    if (!ui.includeApocrypha) {
      filtered = filtered.filter((b) => b.testament.name !== 'APOCRYPHA');
    }
    if (ui.showCompletedOnly) {
      filtered = filtered.filter((book) => book.percentComplete === 100);
    }
    return filtered;
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

export const selectProgressSegments = createSelector(
  selectAllBooks,
  selectProgressViewMode,
  selectIncludeApocrypha,
  (books: BibleBook[], mode: 'testament' | 'groups', includeApocrypha: boolean) => {
    const totalVerses = books.reduce((sum, b) => sum + b.totalVerses, 0);
    if (totalVerses === 0) return [];

    if (mode === 'testament') {
      const counts: Record<string, number> = { OLD: 0, NEW: 0, APOCRYPHA: 0 };
      books.forEach(b => counts[b.testament.name] = (counts[b.testament.name] || 0) + b.memorizedVerses);
      const ot = counts['OLD'];
      const nt = counts['NEW'];
      const apo = counts['APOCRYPHA'];
      const segments: any[] = [
        { name: 'Old Testament', shortName: 'OT', percent: Math.round((ot/totalVerses)*100), color: '#f59e0b', verses: ot },
        { name: 'New Testament', shortName: 'NT', percent: Math.round((nt/totalVerses)*100), color: '#6366f1', verses: nt }
      ];
      if (includeApocrypha) {
        segments.push({ name: 'Apocrypha', shortName: 'Apoc.', percent: Math.round((apo/totalVerses)*100), color: '#8b5cf6', verses: apo });
      }
      const remaining = totalVerses - ot - nt - (includeApocrypha ? apo : 0);
      segments.push({ name: 'Remaining', shortName: '', percent: Math.round((remaining/totalVerses)*100), color: '#e5e7eb', verses: remaining });
      return segments;
    }

    const groupMap: Record<string, number> = {};
    books.forEach(b => {
      if (!includeApocrypha && b.testament.name === 'APOCRYPHA') return;
      const name = b.group.name;
      groupMap[name] = (groupMap[name] || 0) + b.memorizedVerses;
    });
    const colors: Record<string, string> = {
      'Law': '#10b981',
      'History': '#3b82f6',
      'Wisdom': '#8b5cf6',
      'Major Prophets': '#f59e0b',
      'Minor Prophets': '#ef4444',
      'Gospels': '#10b981',
      'Acts': '#3b82f6',
      'Pauline Epistles': '#8b5cf6',
      'General Epistles': '#f59e0b',
      'Revelation': '#ef4444'
    };
    const segments = Object.keys(groupMap).map(g => ({
      name: g,
      shortName: g,
      percent: Math.round((groupMap[g]/totalVerses)*100),
      color: colors[g] || '#6b7280',
      verses: groupMap[g]
    }));
    const totalMemorized = Object.values(groupMap).reduce((a,b)=>a+b,0);
    const remaining = totalVerses - totalMemorized;
    segments.push({ name:'Remaining', shortName:'', percent: Math.round((remaining/totalVerses)*100), color:'#e5e7eb', verses: remaining });
    return segments;
  }
);
