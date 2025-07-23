import { bibleTrackerReducer, initialState } from './bible-tracker.reducer';
import { BibleTrackerActions } from '../actions/bible-tracker.actions';
import { BibleTrackerState } from '../models/bible-tracker.model';

describe('BibleTrackerReducer', () => {
  describe('unknown action', () => {
    it('should return the initial state', () => {
      const action = { type: 'Unknown' };
      const state = bibleTrackerReducer(initialState, action);

      expect(state).toBe(initialState);
    });
  });

  describe('loadReadingProgress action', () => {
    it('should set loading to true and clear error', () => {
      const action = BibleTrackerActions.loadReadingProgress();
      const state = bibleTrackerReducer(initialState, action);

      expect(state.readingProgress.loading).toBe(true);
      expect(state.readingProgress.error).toBeNull();
      expect(state.readingProgress.books).toEqual({});
    });
  });

  describe('selectBook action', () => {
    it('should update selected book and clear chapter selection', () => {
      // Start with a state that has a selected chapter
      const stateWithSelection: BibleTrackerState = {
        ...initialState,
        ui: {
          ...initialState.ui,
          selectedBook: 'genesis',
          selectedChapter: 5,
        }
      };

      const action = BibleTrackerActions.selectBook({ bookId: 'exodus' });
      const state = bibleTrackerReducer(stateWithSelection, action);

      expect(state.ui.selectedBook).toBe('exodus');
      expect(state.ui.selectedChapter).toBeNull();
    });
  });

  describe('loadReadingProgressSuccess action', () => {
    it('should update books and set loaded state', () => {
      const mockBooks = {
        'genesis': {
          bookId: 'genesis',
          bookName: 'Genesis',
          totalChapters: 50,
          totalVerses: 1533,
          chapters: {},
          percentComplete: 0,
          lastRead: null
        }
      };

      const action = BibleTrackerActions.loadReadingProgressSuccess({ books: mockBooks });
      const state = bibleTrackerReducer(initialState, action);

      expect(state.readingProgress.books).toEqual(mockBooks);
      expect(state.readingProgress.loading).toBe(false);
      expect(state.readingProgress.loaded).toBe(true);
      expect(state.readingProgress.error).toBeNull();
      expect(state.readingProgress.lastSync).toBeTruthy();
    });
  });

  describe('loadReadingProgressFailure action', () => {
    it('should set error and stop loading', () => {
      const error = 'Failed to load reading progress';
      const action = BibleTrackerActions.loadReadingProgressFailure({ error });
      const state = bibleTrackerReducer(initialState, action);

      expect(state.readingProgress.loading).toBe(false);
      expect(state.readingProgress.error).toBe(error);
      expect(state.readingProgress.loaded).toBe(false);
    });
  });

  describe('setViewMode action', () => {
    it('should update the view mode', () => {
      const action = BibleTrackerActions.setViewMode({ viewMode: 'list' });
      const state = bibleTrackerReducer(initialState, action);

      expect(state.ui.viewMode).toBe('list');
    });
  });

  describe('toggleCompletedFilter action', () => {
    it('should toggle the showCompletedOnly flag', () => {
      // First toggle - should be true
      let action = BibleTrackerActions.toggleCompletedFilter();
      let state = bibleTrackerReducer(initialState, action);
      expect(state.ui.showCompletedOnly).toBe(true);

      // Second toggle - should be false again
      action = BibleTrackerActions.toggleCompletedFilter();
      state = bibleTrackerReducer(state, action);
      expect(state.ui.showCompletedOnly).toBe(false);
    });
  });

  describe('markVersesAsRead action', () => {
    it('should return state unchanged if book does not exist', () => {
      const action = BibleTrackerActions.markVersesAsRead({
        bookId: 'nonexistent',
        chapter: 1,
        verses: [1, 2, 3]
      });
      const state = bibleTrackerReducer(initialState, action);

      expect(state).toEqual(initialState);
    });

    it('should add verses to a new chapter', () => {
      // Start with a state that has a book
      const stateWithBook: BibleTrackerState = {
        ...initialState,
        readingProgress: {
          ...initialState.readingProgress,
          books: {
            'genesis': {
              bookId: 'genesis',
              bookName: 'Genesis',
              totalChapters: 50,
              totalVerses: 1533,
              chapters: {},
              percentComplete: 0,
              lastRead: null
            }
          }
        }
      };

      const action = BibleTrackerActions.markVersesAsRead({
        bookId: 'genesis',
        chapter: 1,
        verses: [1, 2, 3]
      });
      const state = bibleTrackerReducer(stateWithBook, action);

      expect(state.readingProgress.books['genesis'].chapters[1]).toBeDefined();
      expect(state.readingProgress.books['genesis'].chapters[1].versesRead).toEqual([1, 2, 3]);
      expect(state.readingProgress.books['genesis'].chapters[1].chapterNumber).toBe(1);
      expect(state.readingProgress.books['genesis'].lastRead).toBeTruthy();
    });

    it('should merge verses with existing chapter and avoid duplicates', () => {
      // Start with a state that has some verses already read
      const stateWithProgress: BibleTrackerState = {
        ...initialState,
        readingProgress: {
          ...initialState.readingProgress,
          books: {
            'genesis': {
              bookId: 'genesis',
              bookName: 'Genesis',
              totalChapters: 50,
              totalVerses: 1533,
              chapters: {
                '1': {
                  chapterNumber: 1,
                  totalVerses: 31,
                  versesRead: [1, 2, 3],
                  percentComplete: 9.7, // 3/31
                  completedDate: null,
                  notes: null
                }
              },
              percentComplete: 0,
              lastRead: '2024-01-01'
            }
          }
        }
      };

      const action = BibleTrackerActions.markVersesAsRead({
        bookId: 'genesis',
        chapter: 1,
        verses: [3, 4, 5] // 3 is duplicate
      });
      const state = bibleTrackerReducer(stateWithProgress, action);

      expect(state.readingProgress.books['genesis'].chapters[1].versesRead).toEqual([1, 2, 3, 4, 5]);
      expect(state.readingProgress.books['genesis'].chapters[1].percentComplete).toBeCloseTo(16.13, 1); // 5/31
    });

    it('should mark chapter as completed when all verses are read', () => {
      const stateWithProgress: BibleTrackerState = {
        ...initialState,
        readingProgress: {
          ...initialState.readingProgress,
          books: {
            'genesis': {
              bookId: 'genesis',
              bookName: 'Genesis',
              totalChapters: 50,
              totalVerses: 1533,
              chapters: {
                '1': {
                  chapterNumber: 1,
                  totalVerses: 3, // Small chapter for testing
                  versesRead: [1, 2],
                  percentComplete: 66.67,
                  completedDate: null,
                  notes: null
                }
              },
              percentComplete: 0,
              lastRead: '2024-01-01'
            }
          }
        }
      };

      const action = BibleTrackerActions.markVersesAsRead({
        bookId: 'genesis',
        chapter: 1,
        verses: [3] // This completes the chapter
      });
      const state = bibleTrackerReducer(stateWithProgress, action);

      expect(state.readingProgress.books['genesis'].chapters[1].versesRead).toEqual([1, 2, 3]);
      expect(state.readingProgress.books['genesis'].chapters[1].percentComplete).toBe(100);
      expect(state.readingProgress.books['genesis'].chapters[1].completedDate).toBeTruthy();
    });
  });
});