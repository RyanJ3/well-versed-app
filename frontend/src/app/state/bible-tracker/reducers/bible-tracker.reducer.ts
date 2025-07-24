import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  BibleTrackerState,
  StreakData,
  ReadingStatistics,
  BibleTrackerUIState,
  ReadingFilters
} from '../models/bible-tracker.model';
import { BibleBook as Book } from '../../../core/models/bible';
import { BibleTrackerActions } from '../actions/bible-tracker.actions';


// Adapters
const booksAdapter: EntityAdapter<Book> = createEntityAdapter<Book>({
  selectId: (book) => book.id
});

// Initial State
const defaultUI: BibleTrackerUIState = {
  selectedBookId: null,
  selectedChapter: null,
  viewMode: 'grid',
  filters: { showCompleted: false, highlightToday: true }
};

export const initialState: BibleTrackerState = {
  books: booksAdapter.getInitialState(),
  readingProgress: { lastSync: null },
  dailyStreak: { current: 0, longest: 0, lastReadDate: null },
  readingStatistics: {
    totalVerses: 0,
    versesRead: 0,
    chaptersCompleted: 0,
    booksCompleted: 0,
    lastUpdated: null
  },
  ui: defaultUI,
  loading: { books: false, progress: false, statistics: false },
  errors: { books: null, progress: null, statistics: null }
};


export const bibleTrackerReducer = createReducer(
  initialState,
  // Loading & error slices
  on(BibleTrackerActions.loadReadingProgress, (state) => ({
    ...state,
    loading: { ...state.loading, books: true },
    errors: { ...state.errors, books: null }
  })),
  on(BibleTrackerActions.loadReadingProgressSuccess, (state, { books }) => ({
    ...state,
    books: booksAdapter.setAll(books, state.books),
    loading: { ...state.loading, books: false },
    errors: { ...state.errors, books: null },
    readingProgress: { lastSync: new Date().toISOString() }
  })),
  on(BibleTrackerActions.loadReadingProgressFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, books: false },
    errors: { ...state.errors, books: error }
  })),
  // Statistics
  on(BibleTrackerActions.loadStatistics, (state) => ({
    ...state,
    loading: { ...state.loading, statistics: true },
    errors: { ...state.errors, statistics: null }
  })),
  on(BibleTrackerActions.loadStatisticsSuccess, (state, { statistics }) => ({
    ...state,
    readingStatistics: statistics,
    loading: { ...state.loading, statistics: false },
    errors: { ...state.errors, statistics: null }
  })),
  on(BibleTrackerActions.loadStatisticsFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, statistics: false },
    errors: { ...state.errors, statistics: error }
  })),
  // Streak update
  on(BibleTrackerActions.updateStreak, (state, { streak }) => ({
    ...state,
    dailyStreak: streak
  })),
  // UI interactions
  on(BibleTrackerActions.selectBook, (state, { bookId }) => ({
    ...state,
    ui: { ...state.ui, selectedBookId: bookId, selectedChapter: null }
  })),
  on(BibleTrackerActions.selectChapter, (state, { chapter }) => ({
    ...state,
    ui: { ...state.ui, selectedChapter: chapter }
  })),
  on(BibleTrackerActions.setViewMode, (state, { viewMode }) => ({
    ...state,
    ui: { ...state.ui, viewMode }
  })),
  on(BibleTrackerActions.setFilters, (state, { filters }) => ({
    ...state,
    ui: { ...state.ui, filters }
  }))
);

export const {
  selectAll: selectAllBooks
} = booksAdapter.getSelectors();

