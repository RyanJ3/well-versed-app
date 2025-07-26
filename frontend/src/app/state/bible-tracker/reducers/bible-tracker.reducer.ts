// @ts-nocheck
import { createReducer, on } from '@ngrx/store';
import {
  BibleTrackerState,
  BibleStatisticsState,
} from '../models/bible-tracker.model';
import { BibleBook } from '../../../core/models/bible';
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
    progressViewMode: 'testament',
    showCompletedOnly: false,
    highlightToday: true,
    includeApocrypha: false,
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
    BibleTrackerActions.resetProgress,
    (
      state: BibleTrackerState,
      { bookId, chapter, verses }: { bookId: string; chapter: number; verses: number[] }
    ) => {
      const book = state.readingProgress.books[bookId];
      if (!book) return state;

      const chapterProgress = book.chapters[chapter];
      if (!chapterProgress) return state;

      const updatedVerses = chapterProgress.versesRead.filter(v => !verses.includes(v));
      const percentComplete = (updatedVerses.length / chapterProgress.totalVerses) * 100;

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
                  versesRead: updatedVerses,
                  percentComplete,
                  completedDate: percentComplete === 100 ? chapterProgress.completedDate : null,
                },
              },
            },
          },
        },
      };
    }
  ),
  on(BibleTrackerActions.clearChapter, (state: BibleTrackerState, { bookId, chapter }) => {
    const book = state.readingProgress.books[bookId];
    if (!book || !book.chapters[chapter]) return state;

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
                ...book.chapters[chapter],
                versesRead: [],
                percentComplete: 0,
                completedDate: null,
              },
            },
          },
        },
      },
    };
  }),
  on(BibleTrackerActions.clearBook, (state: BibleTrackerState, { bookId }) => {
    const book = state.readingProgress.books[bookId];
    if (!book) return state;
    const cleared: any = {};
    Object.keys(book.chapters).forEach((ch) => {
      cleared[ch] = {
        ...book.chapters[ch],
        versesRead: [],
        percentComplete: 0,
        completedDate: null,
      };
    });
    return {
      ...state,
      readingProgress: {
        ...state.readingProgress,
        books: {
          ...state.readingProgress.books,
          [bookId]: { ...book, chapters: cleared },
        },
      },
    };
  }),
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
  on(BibleTrackerActions.toggleApocrypha, (state: BibleTrackerState) => ({
    ...state,
    ui: {
      ...state.ui,
      includeApocrypha: !state.ui.includeApocrypha,
    },
  })),
  on(
    BibleTrackerActions.setProgressViewMode,
    (state: BibleTrackerState, { viewMode }: { viewMode: 'testament' | 'groups' }) => ({
      ...state,
      ui: {
        ...state.ui,
        progressViewMode: viewMode,
      },
    })
  ),
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
