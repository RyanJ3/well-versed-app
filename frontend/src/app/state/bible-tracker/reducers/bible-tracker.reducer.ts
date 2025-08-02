// @ts-nocheck
import { createReducer, on } from '@ngrx/store';
import {
  BibleTrackerState,
  BibleStatisticsState,
} from '../models/bible-tracker.model';
import { BibleBook } from '../../../models/bible';
import { BibleTrackerActions } from '../actions/bible-tracker.actions';

// Here's the complete correct initialState:
export const initialState: BibleTrackerState = {
  readingProgress: {
    books: {},
    loading: false,
    loaded: false,
    error: null,
    lastSync: null,
  },
  statistics: {
    overview: {
      totalBooks: 66,
      booksCompleted: 0,
      totalChapters: 1189,
      chaptersCompleted: 0,
      totalVerses: 31102,
      versesRead: 0,
      overallPercentage: 0,
      lastUpdated: null,
    }, // <-- Make sure overview closes here
    streaks: { // <-- streaks starts here, as a sibling
      currentStreak: 0,
      longestStreak: 0,
      lastReadDate: null,
      streakHistory: [],
    },
    loading: false,
    error: null,
  },
  ui: {
    selectedBook: null,
    selectedChapter: null,
    viewMode: 'grid',
    showCompletedOnly: false,
    highlightToday: true,
  },
};

export const bibleTrackerReducer = createReducer(
  initialState,
  on(BibleTrackerActions.loadReadingProgress, (state: BibleTrackerState) => ({
    ...state,
    readingProgress: {
      ...state.readingProgress,
      loading: true,
      error: null,
    },
  })),
  on(
    BibleTrackerActions.loadReadingProgressSuccess,
    (state: BibleTrackerState, { books }: { books: { [bookId: string]: BibleBook } }) => ({
      ...state,
      readingProgress: {
        ...state.readingProgress,
        books,
        loading: false,
        loaded: true,
        error: null,
        lastSync: new Date().toISOString(),
      },
    })
  ),
  on(
    BibleTrackerActions.loadReadingProgressFailure,
    (state: BibleTrackerState, { error }: { error: string }) => ({
      ...state,
      readingProgress: {
        ...state.readingProgress,
        loading: false,
        error,
      },
    })
  ),
  on(
    BibleTrackerActions.markVersesAsRead,
    (
      state: BibleTrackerState,
      { bookId, chapter, verses }: { bookId: string; chapter: number; verses: number[] }
    ) => {
      const book = state.readingProgress.books[bookId];
      if (!book) return state;

      const chapterProgress = book.chapters[chapter] || {
        chapterNumber: chapter,
        totalVerses: 0,
        versesRead: [],
        percentComplete: 0,
        completedDate: null,
        notes: null,
      };

      const updatedVersesRead = Array.from(new Set([...chapterProgress.versesRead, ...verses]));
      const percentComplete = (updatedVersesRead.length / chapterProgress.totalVerses) * 100;

      return {
        ...state,
        readingProgress: {
          ...state.readingProgress,
          books: {
            ...state.readingProgress.books,
            [bookId]: {
              ...book,
              chapters: {
                ...book.chapters,
                [chapter]: {
                  ...chapterProgress,
                  versesRead: updatedVersesRead,
                  percentComplete,
                  completedDate: percentComplete === 100 ? new Date().toISOString() : null,
                },
              },
              lastRead: new Date().toISOString(),
            },
          },
        },
      };
    }
  ),
  on(
    BibleTrackerActions.selectBook,
    (state: BibleTrackerState, { bookId }: { bookId: string | null }) => ({
      ...state,
      ui: {
        ...state.ui,
        selectedBook: bookId,
        selectedChapter: null,
      },
    })
  ),
  on(
    BibleTrackerActions.selectChapter,
    (state: BibleTrackerState, { chapter }: { chapter: number | null }) => ({
      ...state,
      ui: {
        ...state.ui,
        selectedChapter: chapter,
      },
    })
  ),
  on(
    BibleTrackerActions.setViewMode,
    (state: BibleTrackerState, { viewMode }: { viewMode: 'grid' | 'list' | 'reading' }) => ({
      ...state,
      ui: {
        ...state.ui,
        viewMode,
      },
    })
  ),
  on(BibleTrackerActions.toggleCompletedFilter, (state: BibleTrackerState) => ({
    ...state,
    ui: {
      ...state.ui,
      showCompletedOnly: !state.ui.showCompletedOnly,
    },
  })),
  on(
    BibleTrackerActions.loadStatisticsSuccess,
    (
      state: BibleTrackerState,
      { statistics }: { statistics: BibleStatisticsState }
    ) => ({
      ...state,
      statistics: {
    overview: {
      totalBooks: 66,
      booksCompleted: 0,
      totalChapters: 1189,
      chaptersCompleted: 0,
      totalVerses: 31102,
      versesRead: 0,
      overallPercentage: 0,
      lastUpdated: null,
    },
    streaks: {
      currentStreak: 0,
      longestStreak: 0,
      lastReadDate: null,
      streakHistory: [],
    },
    loading: false,
    error: null,
  },
    })
  )
);
