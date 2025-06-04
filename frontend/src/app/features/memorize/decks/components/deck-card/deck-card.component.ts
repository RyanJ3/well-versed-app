// frontend/src/app/features/memorize/decks/components/deck-card/deck-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface DeckWithCounts {
  deck_id: number;
  creator_id: number;
  name: string;
  description?: string;
  is_public: boolean;
  card_count: number;
  verse_count?: number;
  save_count?: number;
  memorized_count?: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  is_saved?: boolean;
  loading_counts?: boolean;
  saving?: boolean;
}

@Component({
  selector: 'app-deck-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './deck-card.component.html',
  styleUrls: ['./deck-card.component.scss']
})
export class DeckCardComponent {
  @Input() deck!: DeckWithCounts;
  @Input() viewMode: 'my-decks' | 'public' | 'saved' = 'my-decks';
  @Input() animationDelay: number = 0;
  
  @Output() tagClicked = new EventEmitter<string>();
  @Output() deleteClicked = new EventEmitter<number>();
  @Output() saveClicked = new EventEmitter<DeckWithCounts>();
  @Output() unsaveClicked = new EventEmitter<DeckWithCounts>();

  getCountDisplay(): { cards: number; verses: number | string } {
    return {
      cards: this.deck.card_count,
      verses: this.deck.loading_counts ? '...' : (this.deck.verse_count ?? this.deck.card_count)
    };
  }

  formatTag(tag: string): string {
    // Format tag for display (e.g., "daily-devotion" -> "Daily Devotion")
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  onTagClick(tag: string, event: Event) {
    event.stopPropagation();
    this.tagClicked.emit(tag);
  }

  onDelete() {
    this.deleteClicked.emit(this.deck.deck_id);
  }

  onSave() {
    this.saveClicked.emit(this.deck);
  }

  onUnsave() {
    this.unsaveClicked.emit(this.deck);
  }
}