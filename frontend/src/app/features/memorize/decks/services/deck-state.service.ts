import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DeckWithCounts } from '../models/deck.types';

@Injectable({ providedIn: 'root' })
export class DeckStateService {
  private decksSubject = new BehaviorSubject<DeckWithCounts[]>([]);
  decks$ = this.decksSubject.asObservable();

  setDecks(decks: DeckWithCounts[]) {
    this.decksSubject.next(decks);
  }
}
