import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@app/state';
import { DeckActions } from '@app/state/decks';
import { selectFilteredDecks, selectDecksLoading, selectFilter } from '@app/state/decks/selectors/deck.selectors';

@Component({
  selector: 'app-deck-manager-container',
  template: `
    <app-deck-list
      [decks]="decks$ | async"
      [loading]="loading$ | async"
      [filter]="filter$ | async"
      (filterChanged)="onFilterChanged($event)"
      (deckSelected)="onDeckSelected($event)"
      (deckDeleted)="onDeckDeleted($event)">
    </app-deck-list>
  `,
  standalone: true
})
export class DeckManagerContainerComponent {
  decks$ = this.store.select(selectFilteredDecks);
  loading$ = this.store.select(selectDecksLoading);
  filter$ = this.store.select(selectFilter);

  constructor(private store: Store<AppState>) {}

  onFilterChanged(filter: any): void {
    this.store.dispatch(DeckActions.setFilter({ filter }));
  }

  onDeckSelected(deckId: number): void {
    this.store.dispatch(DeckActions.selectDeck({ deckId }));
  }

  onDeckDeleted(deckId: number): void {
    this.store.dispatch(DeckActions.deleteDeck({ deckId }));
  }
}
