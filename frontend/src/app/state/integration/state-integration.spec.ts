// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Store, StoreModule } from '@ngrx/store';
import { ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { AppState } from '../app.state';
import { bibleTrackerReducer } from '../bible-tracker/reducers/bible-tracker.reducer';
import { decksReducer } from '../decks/reducers/deck.reducer';
import { BibleTrackerActions } from '../bible-tracker/actions/bible-tracker.actions';
import { DeckActions } from '../decks/actions/deck.actions';
import { selectSelectedBook } from '../bible-tracker/selectors/bible-tracker.selectors';
import { combineLatest } from 'rxjs';
import { DeckCategory } from '../decks/models/deck.model';
import { CardActions } from '../decks/actions/deck.actions';
import { 
  selectIsAnyLoading, 
  selectAllBooks, 
  selectTodaysProgress,
  selectSelectedBookDetails 
} from '../bible-tracker/selectors/bible-tracker.selectors';
import { 
  selectFilteredDecks, 
  selectDeckStatistics 
} from '../decks/selectors/deck.selectors';
import { BibleBook } from '../../core/models/bible';

describe('State Integration Tests', () => {
  let store: Store<AppState>;
  let actions$: ReplaySubject<any>;

  beforeEach(() => {
    // Initialize actions$ before using it
    actions$ = new ReplaySubject(1);

    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({
          bibleTracker: bibleTrackerReducer,
          decks: decksReducer
        })
      ],
      providers: [
        provideMockActions(() => actions$)
      ]
    });

    store = TestBed.inject(Store);
  });

  describe('Cross-state functionality', () => {
    it('should initialize both state slices with correct initial values', (done) => {
      // Get initial state from both slices
      store.select(state => state).pipe(take(1)).subscribe(state => {
        // Bible Tracker initial state
        expect(state.bibleTracker.readingProgress.loading).toBe(false);
        expect(state.bibleTracker.readingProgress.books).toEqual({});
        expect(state.bibleTracker.ui.viewMode).toBe('grid');
        
        // Decks initial state
        expect(state.decks.decks.loading).toBe(false);
        expect(state.decks.ui.viewMode).toBe('grid');
        expect(state.decks.filter.searchTerm).toBe('');
        
        done();
      });
    });

    it('should handle independent actions without affecting other state slices', (done) => {
      // Dispatch Bible Tracker action
      store.dispatch(BibleTrackerActions.selectBook({ bookId: 'genesis' }));
      
      // Dispatch Decks action
      store.dispatch(DeckActions.selectDeck({ deckId: 1 }));
      
      // Check state after dispatches
      store.select(state => state).pipe(take(1)).subscribe(state => {
        // Verify Bible Tracker state updated
        expect(state.bibleTracker.ui.selectedBook).toBe('genesis');
        
        // Verify Decks state updated
        expect(state.decks.ui.selectedDeckId).toBe(1);
        
        // Verify other state remains unchanged
        expect(state.bibleTracker.readingProgress.loading).toBe(false);
        expect(state.decks.decks.loading).toBe(false);
        
        done();
      });
    });

    it('should maintain state integrity when loading data concurrently', (done) => {
      // Start loading both features
      store.dispatch(BibleTrackerActions.loadReadingProgress());
      store.dispatch(DeckActions.loadDecks());
      
      // Check loading states after dispatch
      store.select(state => state).pipe(take(1)).subscribe(state => {
        expect(state.bibleTracker.readingProgress.loading).toBe(true);
        expect(state.decks.decks.loading).toBe(true);
      });
      
      // Simulate success for Bible Tracker
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
      store.dispatch(BibleTrackerActions.loadReadingProgressSuccess({ books: mockBooks }));
      
      // Verify state after success action
      store.select(state => state).pipe(take(1)).subscribe(state => {
        // Bible Tracker should be loaded
        expect(state.bibleTracker.readingProgress.loading).toBe(false);
        expect(state.bibleTracker.readingProgress.loaded).toBe(true);
        expect(Object.keys(state.bibleTracker.readingProgress.books).length).toBe(1);
        
        // Decks should still be loading
        expect(state.decks.decks.loading).toBe(true);
        expect(state.decks.decks.loaded).toBe(false);
        
        done();
      });
    });

    it('should verify action type uniqueness across all state slices', () => {
      // Collect all action types
      const bibleTrackerActionTypes = Object.values(BibleTrackerActions).map(action => action.type);
      const deckActionTypes = Object.values(DeckActions).map(action => action.type);
      const cardActionTypes = Object.values(CardActions).map(action => action.type);
      
      // Combine all action types
      const allActionTypes = [...bibleTrackerActionTypes, ...deckActionTypes, ...cardActionTypes];
      
      // Check for duplicates
      const uniqueActionTypes = new Set(allActionTypes);
      
      // Should have same length if all are unique
      expect(allActionTypes.length).toBe(uniqueActionTypes.size);
      
      // Verify no cross-contamination in action prefixes
      expect(bibleTrackerActionTypes.every(type => type.startsWith('[Bible Tracker]'))).toBe(true);
      expect(deckActionTypes.every(type => type.startsWith('[Deck]'))).toBe(true);
      expect(cardActionTypes.every(type => type.startsWith('[Card]'))).toBe(true);
    });

    it('should handle complex selector combinations without errors', (done) => {
      // Set up some state
      const mockDeck = {
        id: 1,
        name: 'Bible Verses',
        description: 'Test deck',
        category: DeckCategory.BIBLE_VERSES,
        cardCount: 10,
        newCardsCount: 5,
        dueCardsCount: 3,
        isPublic: true,
        isFavorite: false,
        lastStudied: null,
        created: new Date('2024-01-01'),
        updated: new Date('2024-01-01'),
        masteryScore: 50,
        studyStreak: 0,
        tags: ['test']
      };

      store.dispatch(DeckActions.loadDecksSuccess({ decks: [mockDeck] }));
      store.dispatch(BibleTrackerActions.selectBook({ bookId: 'genesis' }));
      store.dispatch(BibleTrackerActions.setViewMode({ viewMode: 'list' }));
      store.dispatch(DeckActions.setFilter({ filter: { searchTerm: 'bible' } }));

      // Test combined selectors
      combineLatest([
        store.select(selectSelectedBook),
        store.select(selectFilteredDecks),
        store.select(selectIsAnyLoading),
        store.select(selectDeckStatistics)
      ]).pipe(take(1)).subscribe(([selectedBook, filteredDecks, isLoading, stats]) => {
        expect(selectedBook).toBe('genesis');
        expect(filteredDecks.length).toBe(1);
        expect(filteredDecks[0].name).toBe('Bible Verses');
        expect(isLoading).toBe(false);
        expect(stats.totalDecks).toBe(1);
        expect(stats.totalCards).toBe(10);
        done();
      });
    });

    it('should handle large state updates without memory issues', (done) => {
      // Create large dataset
      const largeDeckSet = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Deck ${i + 1}`,
        description: `Description for deck ${i + 1}`,
        category: DeckCategory.BIBLE_VERSES,
        cardCount: Math.floor(Math.random() * 50),
        newCardsCount: Math.floor(Math.random() * 10),
        dueCardsCount: Math.floor(Math.random() * 20),
        isPublic: Math.random() > 0.5,
        isFavorite: Math.random() > 0.7,
        lastStudied: Math.random() > 0.5 ? new Date() : null,
        created: new Date('2024-01-01'),
        updated: new Date('2024-01-15'),
        masteryScore: Math.floor(Math.random() * 100),
        studyStreak: Math.floor(Math.random() * 30),
        tags: ['bulk-test', `group-${Math.floor(i / 10)}`]
      }));

      const largeBookSet: { [key: string]: BibleBook } = {};
      ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy'].forEach(bookId => {
        largeBookSet[bookId] = {} as BibleBook;
      });

      // Dispatch large updates
      store.dispatch(DeckActions.loadDecksSuccess({ decks: largeDeckSet }));
      store.dispatch(BibleTrackerActions.loadReadingProgressSuccess({ books: largeBookSet }));

      // Test that selectors still work efficiently
      const startTime = performance.now();
      
      Promise.all([
        store.select(selectFilteredDecks).pipe(take(1)).toPromise(),
        store.select(selectDeckStatistics).pipe(take(1)).toPromise(),
        store.select(selectAllBooks).pipe(take(1)).toPromise(),
        store.select(selectTodaysProgress).pipe(take(1)).toPromise()
      ]).then(([decks, stats, books, progress]) => {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        // Verify data integrity
        expect(decks?.length).toBe(100);
        expect(stats?.totalDecks).toBe(100);
        expect(books?.length).toBe(5);
        
        // Performance check - selectors should execute quickly even with large data
        expect(executionTime).toBeLessThan(100); // Should complete in under 100ms
        
        done();
      });
    });

    it('should maintain consistency when actions affect multiple parts of state', (done) => {
      // Set up initial decks with Bible-related content
      const bibleDeck = {
        id: 1,
        name: 'Genesis Memory Verses',
        description: 'Key verses from Genesis',
        category: DeckCategory.BIBLE_VERSES,
        cardCount: 25,
        newCardsCount: 10,
        dueCardsCount: 5,
        isPublic: true,
        isFavorite: true,
        lastStudied: new Date('2024-01-20'),
        created: new Date('2024-01-01'),
        updated: new Date('2024-01-20'),
        masteryScore: 75,
        studyStreak: 7,
        tags: ['genesis', 'old-testament']
      };

      store.dispatch(DeckActions.loadDecksSuccess({ decks: [bibleDeck] }));
      
      // Load Bible progress that corresponds to the deck
      const genesisProgress = {
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
              percentComplete: 9.7,
              completedDate: null,
              notes: null
            }
          },
          percentComplete: 0.2,
          lastRead: new Date().toISOString()
        }
      };
      
      store.dispatch(BibleTrackerActions.loadReadingProgressSuccess({ books: genesisProgress }));

      // Select Genesis in Bible tracker
      store.dispatch(BibleTrackerActions.selectBook({ bookId: 'genesis' }));
      
      // Filter decks by genesis tag
      store.dispatch(DeckActions.setFilter({ filter: { tags: ['genesis'] } }));

      // Verify coordinated state
      combineLatest([
        store.select(selectSelectedBookDetails),
        store.select(selectFilteredDecks),
        store.select(state => state.decks.filter)
      ]).pipe(take(1)).subscribe(([selectedBook, filteredDecks, filter]) => {
        // Both features should show Genesis-related content
        expect(selectedBook?.bookId).toBe('genesis');
        expect(filteredDecks.length).toBe(1);
        expect(filteredDecks[0].tags).toContain('genesis');
        expect(filter.tags).toContain('genesis');
        
        done();
      });
    });
  });
});