export interface BibleTrackerState {
  readingProgress: ReadingProgressState;
  statistics: BibleStatisticsState;
  ui: BibleTrackerUIState;
}

export interface ReadingProgressState {
  books: { [bookId: string]: BookProgress };
  loading: boolean;
  loaded: boolean;
  error: string | null;
  lastSync: Date | null;
}

export interface BookProgress {
  bookId: string;
  bookName: string;
  totalChapters: number;
  totalVerses: number;
  chapters: { [chapterNumber: string]: ChapterProgress };
  percentComplete: number;
  lastRead: Date | null;
}

export interface ChapterProgress {
  chapterNumber: number;
  totalVerses: number;
  versesRead: number[];
  percentComplete: number;
  completedDate: Date | null;
  notes: string | null;
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
  lastUpdated: Date | null;
}

export interface StreakStatistics {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: Date | null;
  streakHistory: StreakEntry[];
}

export interface StreakEntry {
  date: Date;
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
