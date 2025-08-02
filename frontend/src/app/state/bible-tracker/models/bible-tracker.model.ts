export interface BibleTrackerState {
  readingProgress: ReadingProgressState;
  statistics: BibleStatisticsState;
  ui: BibleTrackerUIState;
}

import { BibleBook } from '../../../models/bible';

export interface ReadingProgressState {
  books: { [bookId: string]: BibleBook };
  loading: boolean;
  loaded: boolean;
  error: string | null;
  lastSync: string | null;
}

export interface BibleStatisticsState {
  overview: StatisticsOverview;
  streaks: StreakStatistics;
  loading: boolean;
  error: string | null;
}

export interface StatisticsOverview {
  totalBooks: number;
  booksCompleted: number;
  totalChapters: number;
  chaptersCompleted: number;
  totalVerses: number;
  versesRead: number;
  overallPercentage: number;
  lastUpdated: string | null;
}

export interface StreakStatistics {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string | null;
  streakHistory: StreakEntry[];
}

export interface StreakEntry {
  date: string;
  versesRead: number;
  chaptersCompleted: number;
}

export interface BibleTrackerUIState {
  selectedBook: string | null;
  selectedChapter: number | null;
  viewMode: 'grid' | 'list' | 'reading';
  showCompletedOnly: boolean;
  highlightToday: boolean;
}

// API Models
export interface MarkVersesReadRequest {
  bookId: string;
  chapter: number;
  verses: number[];
}

export interface MarkChapterCompleteRequest {
  bookId: string;
  chapter: number;
}

export interface BulkUpdateRequest {
  updates: MarkVersesReadRequest[];
}
