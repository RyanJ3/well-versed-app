import {
  selectDecksState,
  selectDecks,
  selectDeckById,
  selectDecksLoading,
  selectFilter,
  selectSort,
  selectSelectedDeckId,
  selectFilteredDecks,
  selectDeckStatistics
} from '@app/state/decks/selectors/deck.selectors';
import { DecksState, Deck, DeckCategory } from '@app/state/decks/models/deck.model';

describe('DeckSelectors', () => {
  const mockDecks: Deck[] = [
    {
      id: 1,
      name: 'Genesis Verses',
      description: 'Key verses from Genesis',
      category: DeckCategory.BIBLE_VERSES,
      cardCount: 20,
      newCardsCount: 5,
      dueCardsCount: 8,
      isPublic: true,
      isFavorite: true,
      lastStudied: new Date('2024-01-15'),
      created: new Date('2024-01-01'),
      updated: new Date('2024-01-15'),
      masteryScore: 75,
      studyStreak: 5,
      tags: ['genesis', 'old-testament']
    },
    {
      id: 2,
      name: 'Psalms for Prayer',
      description: 'Comforting Psalms',
      category: DeckCategory.BIBLE_VERSES,
      cardCount: 15,
      newCardsCount: 0,
      dueCardsCount: 0,
      isPublic: false,
      isFavorite: false,
      lastStudied: null,
      created: new Date('2024-01-10'),
      updated: new Date('2024-01-10'),
      masteryScore: 25,
      studyStreak: 0,
      tags: ['psalms', 'prayer']
    },
    {
      id: 3,
      name: 'Westminster Catechism',
      description: 'Q&A format',
      category: DeckCategory.CATECHISM,
      cardCount: 30,
      newCardsCount: 30,
      dueCardsCount: 0,
      isPublic: true,
      isFavorite: false,
      lastStudied: null,
      created: new Date('2024-01-05'),
      updated: new Date('2024-01-05'),
      masteryScore: 0,
      studyStreak: 0,
      tags: ['catechism', 'theology']
    }
  ];

  const mockState: DecksState = {
    decks: {
      ids: [1, 2, 3],
      entities: {
        1: mockDecks[0],
        2: mockDecks[1],
        3: mockDecks[2]
      },
      loaded: true,
      loading: false,
      error: null
    },
    cards: {
      ids: [],
      entities: {},
      loaded: false,
      loading: false,
      error: null
    },
    filter: {
      searchTerm: '',
      categories: [],
      showOnlyDue: false,
      showOnlyFavorites: false,
      showPublic: false,
      tags: []
    },
    sort: {
      field: 'name',
      direction: 'asc'
    },
    ui: {
      selectedDeckId: 1,
      selectedCardIds: [],
      viewMode: 'grid',
      isCreating: false,
      isImporting: false
    },
    sync: {
      isSyncing: false,
      lastSync: null,
      pendingChanges: 0,
      syncError: null
    }
  };

  const rootState = { decks: mockState };

  describe('Basic selectors', () => {
    it('should select decks state', () => {
      const result = selectDecksState(rootState);
      expect(result).toBe(mockState);
    });

    it('should select all decks as array', () => {
      const result = selectDecks(rootState);
      expect(result.length).toBe(3);
      expect(result[0]).toEqual(mockDecks[0]);
    });

    it('should select deck by id', () => {
      const selector = selectDeckById(1);
      const result = selector(rootState);
      expect(result?.name).toBe('Genesis Verses');
    });

    it('should return undefined for non-existent deck', () => {
      const selector = selectDeckById(999);
      const result = selector(rootState);
      expect(result).toBeUndefined();
    });

    it('should select loading state', () => {
      const result = selectDecksLoading(rootState);
      expect(result).toBe(false);
    });

    it('should select filter', () => {
      const result = selectFilter(rootState);
      expect(result).toEqual(mockState.filter);
    });

    it('should select sort', () => {
      const result = selectSort(rootState);
      expect(result).toEqual(mockState.sort);
    });

    it('should select selected deck id', () => {
      const result = selectSelectedDeckId(rootState);
      expect(result).toBe(1);
    });
  });

  describe('Statistics selector', () => {
    it('should calculate deck statistics', () => {
      const stats = selectDeckStatistics(rootState);
      
      expect(stats.totalDecks).toBe(3);
      expect(stats.totalCards).toBe(65); // 20 + 15 + 30
      expect(stats.totalDueCards).toBe(8); // 8 + 0 + 0
      expect(stats.averageMastery).toBeCloseTo(33.33, 1); // (75 + 25 + 0) / 3
      expect(stats.categoryCounts[DeckCategory.BIBLE_VERSES]).toBe(2);
      expect(stats.categoryCounts[DeckCategory.CATECHISM]).toBe(1);
    });
  });
});