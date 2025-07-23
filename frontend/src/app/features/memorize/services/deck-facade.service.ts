import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@app/state';
import { DeckActions } from '@app/state/decks';
import {
  selectFilteredDecks,
  selectSelectedDeck,
} from '@app/state/decks/selectors/deck.selectors';

@Injectable({ providedIn: 'root' })
export class DeckFacade {
  decks$ = this.store.select(selectFilteredDecks);
  selectedDeck$ = this.store.select(selectSelectedDeck);

  private store = inject(Store<AppState>);

  loadDecks(): void {
    this.store.dispatch(DeckActions.loadDecks());
  }

  createDeck(name: string, description: string): void {
    this.store.dispatch(
      DeckActions.createDeck({
        request: {
          name,
          description,
          category: 'custom',
          isPublic: false,
          tags: [],
        },
      }),
    );
  }

  selectDeck(deckId: number): void {
    this.store.dispatch(DeckActions.selectDeck({ deckId }));
  }

  async studyDeck(deckId: number): Promise<void> {
    this.selectDeck(deckId);
    // Additional logic could be added here
  }
}
