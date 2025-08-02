import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter, Update } from '@ngrx/entity';
import { DecksState, Deck, Card } from '@models/deck.model';
import { DeckActions, CardActions } from '../actions/deck.actions';

// Entity Adapters
export const deckAdapter: EntityAdapter<Deck> = createEntityAdapter<Deck>({
  selectId: (deck: Deck) => deck.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export const cardAdapter: EntityAdapter<Card> = createEntityAdapter<Card>({
  selectId: (card: Card) => card.id,
  sortComparer: false, // No default sort for cards
});

// Initial State
export const initialState: DecksState = {
  decks: deckAdapter.getInitialState({
    loaded: false,
    loading: false,
    error: null,
  }),
  cards: cardAdapter.getInitialState({
    loaded: false,
    loading: false,
    error: null,
  }),
  filter: {
    searchTerm: '',
    categories: [],
    showOnlyDue: false,
    showOnlyFavorites: false,
    showPublic: false,
    tags: [],
  },
  sort: {
    field: 'name',
    direction: 'asc',
  },
  ui: {
    selectedDeckId: null,
    selectedCardIds: [],
    viewMode: 'grid',
    isCreating: false,
    isImporting: false,
  },
  sync: {
    isSyncing: false,
    lastSync: null,
    pendingChanges: 0,
    syncError: null,
  },
};

export const decksReducer = createReducer(
  initialState,
  
  // Load Decks
  on(DeckActions.loadDecks, (state) => ({
    ...state,
    decks: {
      ...state.decks,
      loading: true,
      error: null,
    },
  })),
  
  on(DeckActions.loadDecksSuccess, (state, { decks }) => ({
    ...state,
    decks: deckAdapter.setAll(decks, {
      ...state.decks,
      loaded: true,
      loading: false,
      error: null,
    }),
  })),
  
  on(DeckActions.loadDecksFailure, (state, { error }) => ({
    ...state,
    decks: {
      ...state.decks,
      loading: false,
      error,
    },
  })),
  
  // Create Deck
  on(DeckActions.createDeckSuccess, (state, { deck }) => ({
    ...state,
    decks: deckAdapter.addOne(deck, state.decks),
    ui: {
      ...state.ui,
      isCreating: false,
      selectedDeckId: deck.id,
    },
  })),
  
  // Update Deck
  on(DeckActions.updateDeckSuccess, (state, { deck }) => ({
    ...state,
    decks: deckAdapter.updateOne(deck, state.decks),
  })),
  
  // Delete Deck
  on(DeckActions.deleteDeckSuccess, (state, { deckId }) => ({
    ...state,
    decks: deckAdapter.removeOne(deckId, state.decks),
    cards: cardAdapter.removeMany(
      state.cards.ids.filter(id => {
        const card = state.cards.entities[id];
        return card?.deckId === deckId;
      }) as number[],
      state.cards
    ),
    ui: {
      ...state.ui,
      selectedDeckId: state.ui.selectedDeckId === deckId ? null : state.ui.selectedDeckId,
    },
  })),
  
  // Toggle Favorite
  on(DeckActions.toggleFavoriteSuccess, (state, { deckId, isFavorite }) => ({
    ...state,
    decks: deckAdapter.updateOne(
      { id: deckId, changes: { isFavorite } },
      state.decks
    ),
  })),
  
  // Filter & Sort
  on(DeckActions.setFilter, (state, { filter }) => ({
    ...state,
    filter: {
      ...state.filter,
      ...filter,
    },
  })),
  
  on(DeckActions.clearFilter, (state) => ({
    ...state,
    filter: initialState.filter,
  })),
  
  on(DeckActions.setSort, (state, { sort }) => ({
    ...state,
    sort,
  })),
  
  // UI Actions
  on(DeckActions.selectDeck, (state, { deckId }) => ({
    ...state,
    ui: {
      ...state.ui,
      selectedDeckId: deckId,
    },
  })),
  
  on(DeckActions.setViewMode, (state, { viewMode }) => ({
    ...state,
    ui: {
      ...state.ui,
      viewMode,
    },
  })),
  
  on(DeckActions.toggleCreating, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      isCreating: !state.ui.isCreating,
    },
  })),
  
  // Cards - Load
  on(CardActions.loadCardsSuccess, (state, { cards }) => ({
    ...state,
    cards: cardAdapter.setMany(cards, {
      ...state.cards,
      loaded: true,
      loading: false,
      error: null,
    }),
  })),
  
  // Cards - Create
  on(CardActions.createCardSuccess, (state, { card }) => ({
    ...state,
    cards: cardAdapter.addOne(card, state.cards),
    decks: deckAdapter.updateOne(
      {
        id: card.deckId,
        changes: {
          cardCount: (state.decks.entities[card.deckId]?.cardCount || 0) + 1,
          updated: new Date(),
        },
      },
      state.decks
    ),
  })),
  
  // Cards - Delete
  on(CardActions.deleteCardSuccess, (state, { cardId }) => {
    const card = state.cards.entities[cardId];
    if (!card) return state;
    
    return {
      ...state,
      cards: cardAdapter.removeOne(cardId, state.cards),
      decks: deckAdapter.updateOne(
        {
          id: card.deckId,
          changes: {
            cardCount: Math.max(0, (state.decks.entities[card.deckId]?.cardCount || 0) - 1),
            updated: new Date(),
          },
        },
        state.decks
      ),
    };
  }),
  
  // Card Selection
  on(CardActions.selectCards, (state, { cardIds }) => ({
    ...state,
    ui: {
      ...state.ui,
      selectedCardIds: cardIds,
    },
  })),
  
  on(CardActions.clearSelection, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      selectedCardIds: [],
    },
  })),
  
  on(CardActions.toggleCardSelection, (state, { cardId }) => ({
    ...state,
    ui: {
      ...state.ui,
      selectedCardIds: state.ui.selectedCardIds.includes(cardId)
        ? state.ui.selectedCardIds.filter(id => id !== cardId)
        : [...state.ui.selectedCardIds, cardId],
    },
  })),
  
  // Study Session
  on(DeckActions.completeStudySessionSuccess, (state, { deckId, updates }) => ({
    ...state,
    decks: deckAdapter.updateOne(
      { id: deckId, changes: updates },
      state.decks
    ),
  })),
  
  // Sync
  on(DeckActions.syncDecks, (state) => ({
    ...state,
    sync: {
      ...state.sync,
      isSyncing: true,
      syncError: null,
    },
  })),
  
  on(DeckActions.syncDecksSuccess, (state, { timestamp }) => ({
    ...state,
    sync: {
      ...state.sync,
      isSyncing: false,
      lastSync: timestamp,
      pendingChanges: 0,
      syncError: null,
    },
  })),
);
