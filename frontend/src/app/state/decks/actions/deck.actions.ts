import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  Deck,
  Card,
  CreateDeckRequest,
  UpdateDeckRequest,
  DeckFilter,
  DeckSort,
  StudySessionResult,
  ImportDeckRequest
} from '../models/deck.model';
import { Update } from '@ngrx/entity';

export const DeckActions = createActionGroup({
  source: 'Deck',
  events: {
    // Initialize
    'Init': emptyProps(),

    // Load Decks
    'Load Decks': emptyProps(),
    'Load Decks Success': props<{ decks: Deck[] }>(),
    'Load Decks Failure': props<{ error: string }>(),

    // Load Single Deck
    'Load Deck': props<{ deckId: number }>(),
    'Load Deck Success': props<{ deck: Deck }>(),
    'Load Deck Failure': props<{ error: string }>(),

    // Create Deck
    'Create Deck': props<{ request: CreateDeckRequest }>(),
    'Create Deck Success': props<{ deck: Deck }>(),
    'Create Deck Failure': props<{ error: string }>(),

    // Update Deck
    'Update Deck': props<{ deckId: number; changes: UpdateDeckRequest }>(),
    'Update Deck Success': props<{ deck: Update<Deck> }>(),
    'Update Deck Failure': props<{ error: string }>(),

    // Delete Deck
    'Delete Deck': props<{ deckId: number }>(),
    'Delete Deck Success': props<{ deckId: number }>(),
    'Delete Deck Failure': props<{ error: string }>(),

    // Favorites
    'Toggle Favorite': props<{ deckId: number }>(),
    'Toggle Favorite Success': props<{ deckId: number; isFavorite: boolean }>(),
    'Toggle Favorite Failure': props<{ error: string }>(),

    // Import/Export
    'Import Deck': props<{ request: ImportDeckRequest }>(),
    'Import Deck Success': props<{ deck: Deck; cardsImported: number }>(),
    'Import Deck Failure': props<{ error: string }>(),
    'Export Deck': props<{ deckId: number; format: 'csv' | 'json' | 'anki' }>(),

    // Study Session
    'Complete Study Session': props<{ result: StudySessionResult }>(),
    'Complete Study Session Success': props<{ deckId: number; updates: Partial<Deck> }>(),
    'Complete Study Session Failure': props<{ error: string }>(),

    // Filter & Sort
    'Set Filter': props<{ filter: Partial<DeckFilter> }>(),
    'Clear Filter': emptyProps(),
    'Set Sort': props<{ sort: DeckSort }>(),

    // UI Actions
    'Select Deck': props<{ deckId: number | null }>(),
    'Set View Mode': props<{ viewMode: 'grid' | 'list' | 'compact' }>(),
    'Toggle Creating': emptyProps(),

    // Sync
    'Sync Decks': emptyProps(),
    'Sync Decks Success': props<{ timestamp: Date }>(),
    'Sync Decks Failure': props<{ error: string }>(),
  }
});

export const CardActions = createActionGroup({
  source: 'Card',
  events: {
    // Load Cards
    'Load Cards': props<{ deckId: number }>(),
    'Load Cards Success': props<{ cards: Card[] }>(),
    'Load Cards Failure': props<{ error: string }>(),

    // Create Card
    'Create Card': props<{ deckId: number; card: CreateCardRequest }>(),
    'Create Card Success': props<{ card: Card }>(),
    'Create Card Failure': props<{ error: string }>(),

    // Update Card
    'Update Card': props<{ cardId: number; changes: Partial<Card> }>(),
    'Update Card Success': props<{ card: Update<Card> }>(),
    'Update Card Failure': props<{ error: string }>(),

    // Delete Card
    'Delete Card': props<{ cardId: number }>(),
    'Delete Card Success': props<{ cardId: number }>(),
    'Delete Card Failure': props<{ error: string }>(),

    // Bulk Operations
    'Delete Cards': props<{ cardIds: number[] }>(),
    'Delete Cards Success': props<{ cardIds: number[] }>(),
    'Delete Cards Failure': props<{ error: string }>(),

    'Move Cards': props<{ cardIds: number[]; targetDeckId: number }>(),
    'Move Cards Success': props<{ cardIds: number[]; targetDeckId: number }>(),
    'Move Cards Failure': props<{ error: string }>(),

    // Selection
    'Select Cards': props<{ cardIds: number[] }>(),
    'Clear Selection': emptyProps(),
    'Toggle Card Selection': props<{ cardId: number }>(),
  }
});
