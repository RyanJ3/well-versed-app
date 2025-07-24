import { EntityState } from '@ngrx/entity';
import { BibleBook as Book } from '../../../core/models/bible';

export interface BibleTrackerState {
  books: EntityState<Book>;
  readingProgress: ReadingProgress;

  dailyStreak: StreakData;
  readingStatistics: ReadingStatistics;

  ui: BibleTrackerUIState;

  loading: {
    books: boolean;
    progress: boolean;
    statistics: boolean;
  };
  errors: {
    books: string | null;
    progress: string | null;
    statistics: string | null;
  };
}

export interface ReadingProgress {
  lastSync: string | null;
}

export interface StreakData {
  current: number;
  longest: number;
  lastReadDate: string | null;
}

export interface ReadingStatistics {
  totalVerses: number;
  versesRead: number;
  chaptersCompleted: number;
  booksCompleted: number;
  lastUpdated: string | null;
}

export interface ReadingFilters {
  showCompleted: boolean;
  highlightToday: boolean;
}

export interface BibleTrackerUIState {
  selectedBookId: string | null;
  selectedChapter: number | null;
  viewMode: 'grid' | 'list' | 'heatmap';
  filters: ReadingFilters;
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
