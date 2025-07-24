import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  BibleTrackerState,
  BibleTrackerUIState,
  ReadingFilters
} from '../models/bible-tracker.model';
import { selectAllBooks as selectAllBooksAdapter } from '../reducers/bible-tracker.reducer';
import { BibleBook } from '../../../core/models/bible';

export const selectBibleTrackerState = createFeatureSelector<BibleTrackerState>('bibleTracker');
export const selectBooksState = createSelector(selectBibleTrackerState, (state) => state.books);
export const selectStreak = createSelector(selectBibleTrackerState, (state) => state.dailyStreak);
export const selectUI = createSelector(selectBibleTrackerState, (state) => state.ui);

export const selectAllBooksArray = createSelector(
  selectBooksState,
  selectAllBooksAdapter
);

export const selectSelectedBookId = createSelector(
  selectUI,
  (ui: BibleTrackerUIState) => ui.selectedBookId
);
export const selectSelectedChapter = createSelector(
  selectUI,
  (ui: BibleTrackerUIState) => ui.selectedChapter
);
export const selectViewMode = createSelector(selectUI, (ui: BibleTrackerUIState) => ui.viewMode);
export const selectFilters = createSelector(selectUI, (ui: BibleTrackerUIState) => ui.filters);

export const selectSelectedBook = createSelector(
  selectAllBooksArray,
  selectSelectedBookId,
  (books: BibleBook[], id: string | null) =>
    books.find((b) => b.id === (id ? parseInt(id, 10) : -1)) || null
);

export const selectBibleTrackerLoading = createSelector(
  selectBibleTrackerState,
  (s) => s.loading
);

// Aliases for backwards compatibility
export const selectAllBooks: typeof selectAllBooksArray = selectAllBooksArray;

export const selectBookById = (id: string) =>
  createSelector(selectBooksState, (state) => state.entities[id] || null);

export const selectFilteredBooks = createSelector(
  selectAllBooksArray,
  selectFilters,
  (books: BibleBook[], filters) =>
    filters.showCompleted ? books.filter((b: any) => b.percentComplete === 100) : books
);

export const selectIsAnyLoading = createSelector(
  selectBibleTrackerLoading,
  (l) => Object.values(l).some(Boolean)
);

export const selectSelectedBookDetails = createSelector(
  selectSelectedBookId,
  selectBooksState,
  (id, state) => (id ? state.entities[id] || null : null)
);
