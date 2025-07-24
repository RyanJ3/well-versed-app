import { BibleBook, BibleTestament, BibleGroup } from '../../../core/models/bible';

// Main state structure
export interface BibleMemorizationState {
  memorization: MemorizationProgressState;
  statistics: MemorizationStatisticsState;
  preferences: UserPreferencesState;
  ui: BibleTrackerUIState;
}

// Memorization data from API
export interface MemorizationProgressState {
  verses: UserVerseDetail[];  // Raw data from API
  loading: boolean;
  loaded: boolean;
  error: string | null;
  lastFetch: string | null;
  staleTime: number;  // milliseconds before data is considered stale
}

// User preferences that affect data display
export interface UserPreferencesState {
  includeApocrypha: boolean;
  progressViewMode: 'testament' | 'groups';
  userId: number;  // Current user ID
}

// Statistics calculated from memorization data
export interface MemorizationStatisticsState {
  totalVersesMemorized: number;
  percentageComplete: number;
  progressSegments: ProgressSegment[];
  lastCalculated: string | null;
}

// UI state for navigation and display
export interface BibleTrackerUIState {
  selectedBookId: number | null;
  selectedChapter: number | null;
  viewMode: 'grid' | 'list';
  isSavingBulk: boolean;  // Shows loading state for bulk operations
}

// Progress segment for visual display
export interface ProgressSegment {
  name: string;
  shortName: string;
  percent: number;
  color: string;
  verses: number;
}

// API request/response types
export interface ToggleVerseRequest {
  userId: number;
  bookId: number;
  chapterNumber: number;
  verseNumber: number;
}

export interface BulkVerseOperation {
  userId: number;
  bookId: number;
  chapterNumber?: number;  // If not provided, applies to whole book
  operation: 'memorize' | 'clear';
}

// For verse details from API
export interface UserVerseDetail {
  verse: {
    verse_id: string;
    book_id: number;
    chapter_number: number;
    verse_number: number;
    isApocryphal: boolean;
  };
  practice_count: number;
  last_practiced?: Date;
  created_at: Date;
  updated_at?: Date;
}
