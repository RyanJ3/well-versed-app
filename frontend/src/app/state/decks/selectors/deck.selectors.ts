import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DecksState, Deck, Card, DeckCategory } from '@models/deck.model';
import { deckAdapter, cardAdapter } from '../reducers/deck.reducer';

// Feature Selector
export const selectDecksState = createFeatureSelector<DecksState>('decks');

// Entity Selectors
const { selectIds: selectDeckIds, selectEntities: selectDeckEntities, selectAll: selectAllDecks } =
  deckAdapter.getSelectors();

const { selectIds: selectCardIds, selectEntities: selectCardEntities, selectAll: selectAllCards } =
  cardAdapter.getSelectors();

// Deck Selectors
export const selectDeckState = createSelector(
  selectDecksState,
  (state) => state.decks
);

export const selectDecks = createSelector(
  selectDeckState,
  selectAllDecks
);

export const selectDeckById = (deckId: number) =>
  createSelector(selectDeckState, (state) => state.entities[deckId]);

export const selectDecksLoading = createSelector(
  selectDeckState,
  (state) => state.loading
);

export const selectDecksLoaded = createSelector(
  selectDeckState,
  (state) => state.loaded
);

// Card Selectors
export const selectCardState = createSelector(
  selectDecksState,
  (state) => state.cards
);

export const selectCards = createSelector(
  selectCardState,
  selectAllCards
);

export const selectCardsByDeckId = (deckId: number) =>
  createSelector(selectCards, (cards) => cards.filter((card) => card.deckId === deckId));

export const selectCardById = (cardId: number) =>
  createSelector(selectCardState, (state) => state.entities[cardId]);

// Filter & Sort Selectors
export const selectFilter = createSelector(
  selectDecksState,
  (state) => state.filter
);

export const selectSort = createSelector(
  selectDecksState,
  (state) => state.sort
);

// UI Selectors
export const selectUI = createSelector(
  selectDecksState,
  (state) => state.ui
);

export const selectSelectedDeckId = createSelector(
  selectUI,
  (ui) => ui.selectedDeckId
);

export const selectSelectedDeck = createSelector(
  selectDeckState,
  selectSelectedDeckId,
  (deckState, selectedId) => (selectedId ? deckState.entities[selectedId] : null)
);

export const selectSelectedDeckCards = createSelector(
  selectCards,
  selectSelectedDeckId,
  (cards, deckId) => (deckId ? cards.filter((card) => card.deckId === deckId) : [])
);

export const selectSelectedCardIds = createSelector(
  selectUI,
  (ui) => ui.selectedCardIds
);

export const selectViewMode = createSelector(
  selectUI,
  (ui) => ui.viewMode
);

// Filtered Decks
export const selectFilteredDecks = createSelector(
  selectDecks,
  selectFilter,
  selectSort,
  (decks, filter, sort) => {
    let filtered = [...decks];

    // Apply filters
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (deck) =>
          deck.name.toLowerCase().includes(term) ||
          deck.description.toLowerCase().includes(term) ||
          deck.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    if (filter.categories.length > 0) {
      filtered = filtered.filter((deck) => filter.categories.includes(deck.category));
    }

    if (filter.showOnlyDue) {
      filtered = filtered.filter((deck) => deck.dueCardsCount > 0);
    }

    if (filter.showOnlyFavorites) {
      filtered = filtered.filter((deck) => deck.isFavorite);
    }

    if (filter.tags.length > 0) {
      filtered = filtered.filter((deck) =>
        filter.tags.some((tag) => deck.tags.includes(tag))
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updated).getTime() - new Date(b.updated).getTime();
          break;
        case 'dueCards':
          comparison = a.dueCardsCount - b.dueCardsCount;
          break;
        case 'mastery':
          comparison = a.masteryScore - b.masteryScore;
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }
);

// Statistics Selectors
export const selectDeckStatistics = createSelector(selectDecks, (decks) => {
  const stats = {
    totalDecks: decks.length,
    totalCards: decks.reduce((sum, deck) => sum + deck.cardCount, 0),
    totalDueCards: decks.reduce((sum, deck) => sum + deck.dueCardsCount, 0),
    averageMastery: decks.length
      ? decks.reduce((sum, deck) => sum + deck.masteryScore, 0) / decks.length
      : 0,
    categoryCounts: {} as Record<DeckCategory, number>,
  };

  decks.forEach((deck) => {
    stats.categoryCounts[deck.category] = (stats.categoryCounts[deck.category] || 0) + 1;
  });

  return stats;
});

// Sync Selectors
export const selectSyncState = createSelector(
  selectDecksState,
  (state) => state.sync
);

export const selectIsSyncing = createSelector(
  selectSyncState,
  (sync) => sync.isSyncing
);

export const selectLastSync = createSelector(
  selectSyncState,
  (sync) => sync.lastSync
);

// Due Cards Summary
export const selectDueCardsSummary = createSelector(
  selectDecks,
  selectCards,
  (decks, cards) => {
    const now = new Date();
    const dueCards = cards.filter(
      (card) => card.nextReview && new Date(card.nextReview) <= now
    );

    return {
      totalDue: dueCards.length,
      byDeck: decks.map((deck) => ({
        deckId: deck.id,
        deckName: deck.name,
        dueCount: dueCards.filter((card) => card.deckId === deck.id).length,
      })).filter(item => item.dueCount > 0),
      urgentCards: dueCards.filter(
        (card) => card.nextReview && new Date(card.nextReview) < new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ).length,
    };
  }
);
