import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  BibleTrackerState,
  StreakData,
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
  dailyStreak: { current: 0, longest: 0, lastReadDate: null },
  ui: defaultUI,
  loading: { books: false },
  errors: { books: null }
};


export const bibleTrackerReducer = createReducer(
  initialState,
  // Loading & error slices
  on(BibleTrackerActions.init, (state) => ({
    ...state,
    loading: { ...state.loading, books: true },
    errors: { ...state.errors, books: null }
  })),
  // Streak update
  on(BibleTrackerActions.updateStreak, (state, { streak }) => ({
    ...state,
    dailyStreak: streak,
    loading: { ...state.loading, books: false }
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

