import { createReducer, on } from '@ngrx/store';
import { BibleTrackerActions } from '../actions/bible-tracker.actions';
import { BibleTrackerState } from '../models/bible-tracker.model';

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
  
  // Loading Progress
  on(BibleTrackerActions.loadReadingProgress, (state) => ({
    ...state,
    readingProgress: {
      ...state.readingProgress,
      loading: true,
      error: null,
    },
  })),
  
  on(BibleTrackerActions.loadReadingProgressSuccess, (state, { books }) => ({
    ...state,
    readingProgress: {
      ...state.readingProgress,
      books,
      loading: false,
      loaded: true,
      error: null,
      lastSync: new Date(),
    },
  })),
  
  on(BibleTrackerActions.loadReadingProgressFailure, (state, { error }) => ({
    ...state,
    readingProgress: {
      ...state.readingProgress,
      loading: false,
      error,
    },
  })),
  
  // Mark Verses as Read
  on(BibleTrackerActions.markVersesAsRead, (state, { bookId, chapter, verses }) => {
    const book = state.readingProgress.books[bookId];
    if (!book) return state;
    
    const chapterProgress = book.chapters[chapter] || {
      chapterNumber: chapter,
      totalVerses: 0, // Will be updated from backend
      versesRead: [],
      percentComplete: 0,
      completedDate: null,
      notes: null,
    };
    
    // Merge new verses with existing ones (avoid duplicates)
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
                completedDate: percentComplete === 100 ? new Date() : null,
              },
            },
            lastRead: new Date(),
          },
        },
      },
    };
  }),
  
  // UI Actions
  on(BibleTrackerActions.selectBook, (state, { bookId }) => ({
    ...state,
    ui: {
      ...state.ui,
      selectedBook: bookId,
      selectedChapter: null, // Reset chapter when book changes
    },
  })),
  
  on(BibleTrackerActions.selectChapter, (state, { chapter }) => ({
    ...state,
    ui: {
      ...state.ui,
      selectedChapter: chapter,
    },
  })),
  
  on(BibleTrackerActions.setViewMode, (state, { viewMode }) => ({
    ...state,
    ui: {
      ...state.ui,
      viewMode,
    },
  })),
  
  on(BibleTrackerActions.toggleCompletedFilter, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      showCompletedOnly: !state.ui.showCompletedOnly,
    },
  })),
  
  // Statistics
  on(BibleTrackerActions.loadStatisticsSuccess, (state, { statistics }) => ({
    ...state,
    statistics: {
      ...statistics,
      loading: false,
      error: null,
    },
  })),
);
