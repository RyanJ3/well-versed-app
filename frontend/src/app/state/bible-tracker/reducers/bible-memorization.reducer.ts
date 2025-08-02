import { createReducer, on } from '@ngrx/store';
import { BibleMemorizationState } from '@models/bible-memorization.model';
import { BibleMemorizationActions } from '../actions/bible-memorization.actions';

export const initialState: BibleMemorizationState = {
  memorization: {
    verses: [],
    loading: false,
    loaded: false,
    error: null,
    lastFetch: null,
    staleTime: 5 * 60 * 1000 // 5 minutes
  },
  statistics: {
    totalVersesMemorized: 0,
    percentageComplete: 0,
    progressSegments: [],
    lastCalculated: null
  },
  preferences: {
    includeApocrypha: false,
    progressViewMode: 'testament',
    userId: 1 // Default, should be set from auth
  },
  ui: {
    selectedBookId: null,
    selectedChapter: null,
    viewMode: 'grid',
    isSavingBulk: false
  }
};

export const bibleMemorizationReducer = createReducer(
  initialState,
  
  // Initialization
  on(BibleMemorizationActions.initialize, state => ({
    ...state,
    memorization: {
      ...state.memorization,
      loading: true,
      error: null
    }
  })),

  on(BibleMemorizationActions.initializeFailure, (state, { error }) => ({
    ...state,
    memorization: {
      ...state.memorization,
      loading: false,
      error
    }
  })),
  
  // Load memorization progress
  on(BibleMemorizationActions.loadMemorizationProgress, state => ({
    ...state,
    memorization: {
      ...state.memorization,
      loading: true,
      error: null
    }
  })),
  
  on(BibleMemorizationActions.loadMemorizationProgressSuccess, (state, { verses }) => ({
    ...state,
    memorization: {
      ...state.memorization,
      verses,
      loading: false,
      loaded: true,
      error: null,
      lastFetch: new Date().toISOString()
    }
  })),
  
  on(BibleMemorizationActions.loadMemorizationProgressFailure, (state, { error }) => ({
    ...state,
    memorization: {
      ...state.memorization,
      loading: false,
      error
    }
  })),
  
  // Toggle verse memorization - optimistic update
  on(BibleMemorizationActions.toggleVerseMemorization, (state, request) => {
    // Find and toggle the verse in our local state
    const updatedVerses = state.memorization.verses.map(verseDetail => {
      if (verseDetail.verse.book_id === request.bookId &&
          verseDetail.verse.chapter_number === request.chapterNumber &&
          verseDetail.verse.verse_number === request.verseNumber) {
        // Toggle the memorization status
        return {
          ...verseDetail,
          practice_count: verseDetail.practice_count > 0 ? 0 : 1,
          last_practiced: verseDetail.practice_count > 0 ? undefined : new Date()
        };
      }
      return verseDetail;
    });
    
    // If verse doesn't exist, add it
    const verseExists = updatedVerses.some(v => 
      v.verse.book_id === request.bookId &&
      v.verse.chapter_number === request.chapterNumber &&
      v.verse.verse_number === request.verseNumber
    );
    
    if (!verseExists) {
      updatedVerses.push({
        verse: {
          verse_id: `${request.bookId}-${request.chapterNumber}-${request.verseNumber}`,
          book_id: request.bookId,
          chapter_number: request.chapterNumber,
          verse_number: request.verseNumber,
          isApocryphal: false // Will be updated from server response
        },
        practice_count: 1,
        last_practiced: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    return {
      ...state,
      memorization: {
        ...state.memorization,
        verses: updatedVerses
      }
    };
  }),
  
  // Revert on failure
  on(BibleMemorizationActions.toggleVerseMemorizationFailure, (state, { request }) => {
    // Revert the optimistic update
    const revertedVerses = state.memorization.verses.map(verseDetail => {
      if (verseDetail.verse.book_id === request.bookId &&
          verseDetail.verse.chapter_number === request.chapterNumber &&
          verseDetail.verse.verse_number === request.verseNumber) {
        // Toggle back
        return {
          ...verseDetail,
          practice_count: verseDetail.practice_count > 0 ? 0 : 1,
          last_practiced: verseDetail.practice_count > 0 ? undefined : new Date()
        };
      }
      return verseDetail;
    });
    
    return {
      ...state,
      memorization: {
        ...state.memorization,
        verses: revertedVerses,
        error: 'Failed to save verse. Please try again.'
      }
    };
  }),
  
  // Bulk operations
  on(BibleMemorizationActions.memorizeAllChapterVerses, 
     BibleMemorizationActions.clearAllChapterVerses,
     BibleMemorizationActions.memorizeAllBookVerses,
     BibleMemorizationActions.clearAllBookVerses,
     state => ({
    ...state,
    ui: {
      ...state.ui,
      isSavingBulk: true
    }
  })),
  
  on(BibleMemorizationActions.memorizeAllChapterVersesSuccess,
     BibleMemorizationActions.clearAllChapterVersesSuccess,
     BibleMemorizationActions.memorizeAllBookVersesSuccess,
     BibleMemorizationActions.clearAllBookVersesSuccess,
     state => ({
    ...state,
    ui: {
      ...state.ui,
      isSavingBulk: false
    }
  })),
  
  on(BibleMemorizationActions.memorizeAllChapterVersesFailure,
     BibleMemorizationActions.clearAllChapterVersesFailure,
     BibleMemorizationActions.memorizeAllBookVersesFailure,
     BibleMemorizationActions.clearAllBookVersesFailure,
     (state, { error }) => ({
    ...state,
    ui: {
      ...state.ui,
      isSavingBulk: false
    },
    memorization: {
      ...state.memorization,
      error
    }
  })),
  
  // Preferences
  on(BibleMemorizationActions.updateApocryphaPreference, (state, { includeApocrypha }) => ({
    ...state,
    preferences: {
      ...state.preferences,
      includeApocrypha
    }
  })),
  
  on(BibleMemorizationActions.toggleProgressViewMode, state => ({
    ...state,
    preferences: {
      ...state.preferences,
      progressViewMode: state.preferences.progressViewMode === 'testament'
        ? ('groups' as const)
        : ('testament' as const)
    }
  })),
  
  // Statistics
  on(BibleMemorizationActions.calculateStatisticsSuccess, (state, { totalVersesMemorized, percentageComplete, progressSegments }) => ({
    ...state,
    statistics: {
      totalVersesMemorized,
      percentageComplete,
      progressSegments,
      lastCalculated: new Date().toISOString()
    }
  })),
  
  // UI State
  on(BibleMemorizationActions.selectBook, (state, { bookId }) => ({
    ...state,
    ui: {
      ...state.ui,
      selectedBookId: bookId,
      selectedChapter: null // Reset chapter when book changes
    }
  })),
  
  on(BibleMemorizationActions.selectChapter, (state, { chapterNumber }) => ({
    ...state,
    ui: {
      ...state.ui,
      selectedChapter: chapterNumber
    }
  })),
  
  on(BibleMemorizationActions.setViewMode, (state, { viewMode }) => ({
    ...state,
    ui: {
      ...state.ui,
      viewMode
    }
  }))
);
