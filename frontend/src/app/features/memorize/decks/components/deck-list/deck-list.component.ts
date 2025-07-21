import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeckCardComponent } from '../deck-card/deck-card.component';
import { DeckWithCounts } from '../../models/deck.types';

@Component({
  selector: 'app-deck-list',
  standalone: true,
  imports: [CommonModule, DeckCardComponent],
  templateUrl: './deck-list.component.html',
  styleUrls: ['./deck-list.component.scss']
})
export class DeckListComponent {
  @Input() decks: DeckWithCounts[] = [];
  @Input() viewMode: 'my-decks' | 'public' | 'saved' = 'my-decks';

  @Output() delete = new EventEmitter<number>();
  @Output() save = new EventEmitter<DeckWithCounts>();
  @Output() unsave = new EventEmitter<DeckWithCounts>();
  @Output() tagClicked = new EventEmitter<string>();

  trackByDeckId(index: number, deck: DeckWithCounts) {
    return deck.deck_id;
  }
}
