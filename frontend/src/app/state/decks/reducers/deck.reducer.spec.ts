import { decksReducer, initialState } from './deck.reducer';
import { DeckActions, CardActions } from '../actions/deck.actions';
import { DecksState, Deck, DeckCategory } from '../models/deck.model';

describe('DecksReducer', () => {
    describe('unknown action', () => {
        it('should return the initial state', () => {
            const action = { type: 'Unknown' };
            const state = decksReducer(initialState, action);

            expect(state).toBe(initialState);
        });
    });

    describe('loadDecks action', () => {
        it('should set loading to true', () => {
            const action = DeckActions.loadDecks();
            const state = decksReducer(initialState, action);

            expect(state.decks.loading).toBe(true);
            expect(state.decks.error).toBeNull();
        });
    });

    describe('loadDecksSuccess action', () => {
        it('should add decks to the store', () => {
            const mockDecks: Deck[] = [
                {
                    id: 1,
                    name: 'Genesis Memory Verses',
                    description: 'Key verses from Genesis',
                    category: DeckCategory.BIBLE_VERSES,
                    cardCount: 10,
                    newCardsCount: 5,
                    dueCardsCount: 3,
                    isPublic: true,
                    isFavorite: false,
                    lastStudied: null,
                    created: new Date('2024-01-01'),
                    updated: new Date('2024-01-15'),
                    masteryScore: 45,
                    studyStreak: 3,
                    tags: ['genesis', 'memory']
                }
            ];

            const action = DeckActions.loadDecksSuccess({ decks: mockDecks });
            const state = decksReducer(initialState, action);

            expect(state.decks.loading).toBe(false);
            expect(state.decks.loaded).toBe(true);
            expect(state.decks.error).toBeNull();
            expect(state.decks.ids.length).toBe(1);
            expect(state.decks.entities[1]).toBeDefined();
            expect(state.decks.entities[1]?.name).toBe('Genesis Memory Verses');
        });
    });

    describe('UI actions', () => {
        it('should select a deck', () => {
            const action = DeckActions.selectDeck({ deckId: 5 });
            const state = decksReducer(initialState, action);

            expect(state.ui.selectedDeckId).toBe(5);
        });

        it('should toggle creating mode', () => {
            // First toggle
            let action = DeckActions.toggleCreating();
            let state = decksReducer(initialState, action);
            expect(state.ui.isCreating).toBe(true);

            // Second toggle
            action = DeckActions.toggleCreating();
            state = decksReducer(state, action);
            expect(state.ui.isCreating).toBe(false);
        });

        it('should set view mode', () => {
            const action = DeckActions.setViewMode({ viewMode: 'list' });
            const state = decksReducer(initialState, action);

            expect(state.ui.viewMode).toBe('list');
        });
    });
    describe('Deck CRUD operations', () => {
        const mockDeck: Deck = {
            id: 1,
            name: 'Test Deck',
            description: 'Test Description',
            category: DeckCategory.BIBLE_VERSES,
            cardCount: 0,
            newCardsCount: 0,
            dueCardsCount: 0,
            isPublic: false,
            isFavorite: false,
            lastStudied: null,
            created: new Date('2024-01-01'),
            updated: new Date('2024-01-01'),
            masteryScore: 0,
            studyStreak: 0,
            tags: []
        };

        it('should add a deck on createDeckSuccess', () => {
            const action = DeckActions.createDeckSuccess({ deck: mockDeck });
            const state = decksReducer(initialState, action);

            expect(state.decks.ids).toContain(1);
            expect(state.decks.entities[1]).toEqual(mockDeck);
            expect(state.ui.selectedDeckId).toBe(1); // Should select the new deck
            expect(state.ui.isCreating).toBe(false); // Should close create mode
        });

        it('should update a deck on updateDeckSuccess', () => {
            // Start with a deck in state
            const stateWithDeck = decksReducer(
                initialState,
                DeckActions.createDeckSuccess({ deck: mockDeck })
            );

            const update = {
                id: 1,
                changes: { name: 'Updated Deck Name', masteryScore: 75 }
            };
            const action = DeckActions.updateDeckSuccess({ deck: update });
            const state = decksReducer(stateWithDeck, action);

            expect(state.decks.entities[1]?.name).toBe('Updated Deck Name');
            expect(state.decks.entities[1]?.masteryScore).toBe(75);
            expect(state.decks.entities[1]?.description).toBe('Test Description'); // Unchanged
        });

        it('should remove a deck and its cards on deleteDeckSuccess', () => {
            // Create initial state with a deck and some cards
            let state = decksReducer(initialState, DeckActions.createDeckSuccess({ deck: mockDeck }));

            // Add some cards to the deck
            const mockCards = [
                { id: 1, deckId: 1, front: 'Card 1', back: 'Back 1' },
                { id: 2, deckId: 1, front: 'Card 2', back: 'Back 2' },
                { id: 3, deckId: 2, front: 'Card 3', back: 'Back 3' } // Different deck
            ];
            state = decksReducer(state, CardActions.loadCardsSuccess({ cards: mockCards as any }));

            // Delete deck 1
            const action = DeckActions.deleteDeckSuccess({ deckId: 1 });
            state = decksReducer(state, action);

            // Deck should be removed
            expect(state.decks.ids).not.toContain(1);
            expect(state.decks.entities[1]).toBeUndefined();

            // Cards from deck 1 should be removed
            expect(state.cards.ids).not.toContain(1);
            expect(state.cards.ids).not.toContain(2);
            // Card from deck 2 should remain
            expect(state.cards.ids).toContain(3);
        });

        it('should toggle favorite status', () => {
            // Start with a deck
            let state = decksReducer(
                initialState,
                DeckActions.createDeckSuccess({ deck: mockDeck })
            );

            const action = DeckActions.toggleFavoriteSuccess({ deckId: 1, isFavorite: true });
            state = decksReducer(state, action);

            expect(state.decks.entities[1]?.isFavorite).toBe(true);
        });
    });

    describe('Filter operations', () => {
        it('should update filter', () => {
            const filter = {
                searchTerm: 'genesis',
                showOnlyDue: true,
                categories: [DeckCategory.BIBLE_VERSES]
            };
            const action = DeckActions.setFilter({ filter });
            const state = decksReducer(initialState, action);

            expect(state.filter.searchTerm).toBe('genesis');
            expect(state.filter.showOnlyDue).toBe(true);
            expect(state.filter.categories).toEqual([DeckCategory.BIBLE_VERSES]);
            // Other filter properties should remain unchanged
            expect(state.filter.showOnlyFavorites).toBe(false);
        });

        it('should clear filter', () => {
            // First set a filter
            let state = decksReducer(
                initialState,
                DeckActions.setFilter({
                    filter: { searchTerm: 'test', showOnlyDue: true }
                })
            );

            // Then clear it
            const action = DeckActions.clearFilter();
            state = decksReducer(state, action);

            expect(state.filter).toEqual(initialState.filter);
        });

        it('should set sort', () => {
            const sort = { field: 'mastery' as const, direction: 'desc' as const };
            const action = DeckActions.setSort({ sort });
            const state = decksReducer(initialState, action);

            expect(state.sort.field).toBe('mastery');
            expect(state.sort.direction).toBe('desc');
        });
    });
});

describe('Card operations', () => {
  const mockDeck: Deck = {
    id: 1,
    name: 'Test Deck',
    description: 'Test Description',
    category: DeckCategory.BIBLE_VERSES,
    cardCount: 0,
    newCardsCount: 0,
    dueCardsCount: 0,
    isPublic: false,
    isFavorite: false,
    lastStudied: null,
    created: new Date('2024-01-01'),
    updated: new Date('2024-01-01'),
    masteryScore: 0,
    studyStreak: 0,
    tags: []
  };

  it('should add a card and update deck count', () => {
    // Start with a deck
    let state = decksReducer(
      initialState,
      DeckActions.createDeckSuccess({ deck: mockDeck })
    );

    const mockCard = {
      id: 1,
      deckId: 1,
      front: 'What is the first verse of the Bible?',
      back: 'In the beginning God created the heaven and the earth.',
      hint: 'Genesis 1:1',
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      lapses: 0,
      lastReviewed: null,
      nextReview: null,
      studyCount: 0,
      averageResponseTime: 0,
      status: 'new' as any,
      created: new Date('2024-01-01'),
      updated: new Date('2024-01-01')
    };

    const action = CardActions.createCardSuccess({ card: mockCard });
    state = decksReducer(state, action);

    // Card should be added
    expect(state.cards.ids).toContain(1);
    expect(state.cards.entities[1]).toEqual(mockCard);
    
    // Deck card count should increment
    expect(state.decks.entities[1]?.cardCount).toBe(1);
    expect(state.decks.entities[1]?.updated).toBeDefined();
  });

  it('should remove a card and update deck count', () => {
    // Start with a deck and card
    let state = decksReducer(
      initialState,
      DeckActions.createDeckSuccess({ deck: { ...mockDeck, cardCount: 1 } })
    );
    state = decksReducer(
      state,
      CardActions.loadCardsSuccess({ 
        cards: [{ id: 1, deckId: 1, front: 'Test', back: 'Test' } as any] 
      })
    );

    const action = CardActions.deleteCardSuccess({ cardId: 1 });
    state = decksReducer(state, action);

    // Card should be removed
    expect(state.cards.ids).not.toContain(1);
    
    // Deck card count should decrement
    expect(state.decks.entities[1]?.cardCount).toBe(0);
  });

  it('should handle card selection', () => {
    const action = CardActions.selectCards({ cardIds: [1, 2, 3] });
    const state = decksReducer(initialState, action);

    expect(state.ui.selectedCardIds).toEqual([1, 2, 3]);
  });

  it('should toggle card selection', () => {
    // Start with some cards selected
    let state = decksReducer(
      initialState,
      CardActions.selectCards({ cardIds: [1, 2, 3] })
    );

    // Toggle card 2 (should remove it)
    state = decksReducer(
      state,
      CardActions.toggleCardSelection({ cardId: 2 })
    );
    expect(state.ui.selectedCardIds).toEqual([1, 3]);

    // Toggle card 4 (should add it)
    state = decksReducer(
      state,
      CardActions.toggleCardSelection({ cardId: 4 })
    );
    expect(state.ui.selectedCardIds).toEqual([1, 3, 4]);
  });

  it('should clear card selection', () => {
    // Start with cards selected
    let state = decksReducer(
      initialState,
      CardActions.selectCards({ cardIds: [1, 2, 3] })
    );

    const action = CardActions.clearSelection();
    state = decksReducer(state, action);

    expect(state.ui.selectedCardIds).toEqual([]);
  });
});

describe('Study session', () => {
  it('should update deck after study session', () => {
    // Start with a deck
    let state = decksReducer(
      initialState,
      DeckActions.createDeckSuccess({ 
        deck: {
          id: 1,
          name: 'Test Deck',
          description: 'Test',
          category: DeckCategory.BIBLE_VERSES,
          cardCount: 10,
          newCardsCount: 5,
          dueCardsCount: 3,
          isPublic: false,
          isFavorite: false,
          lastStudied: null,
          created: new Date('2024-01-01'),
          updated: new Date('2024-01-01'),
          masteryScore: 50,
          studyStreak: 5,
          tags: []
        }
      })
    );

    const updates = {
      masteryScore: 65,
      studyStreak: 6,
      lastStudied: new Date('2024-01-20'),
      dueCardsCount: 1
    };

    const action = DeckActions.completeStudySessionSuccess({ 
      deckId: 1, 
      updates 
    });
    state = decksReducer(state, action);

    expect(state.decks.entities[1]?.masteryScore).toBe(65);
    expect(state.decks.entities[1]?.studyStreak).toBe(6);
    expect(state.decks.entities[1]?.dueCardsCount).toBe(1);
    expect(state.decks.entities[1]?.lastStudied).toEqual(new Date('2024-01-20'));
  });
});