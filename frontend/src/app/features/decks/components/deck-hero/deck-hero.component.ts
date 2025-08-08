import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NextDeck {
  deck_id: number;
  name: string;
  progress: number;
}

@Component({
  selector: 'app-deck-hero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './deck-hero.component.html',
  styleUrls: ['./deck-hero.component.scss']
})
export class DeckHeroComponent {
  @Input() nextDeck: NextDeck | null = null;
  @Input() streakDays: number = 0;
  @Output() continueStudy = new EventEmitter<number>();

  onContinueClick() {
    if (this.nextDeck) {
      this.continueStudy.emit(this.nextDeck.deck_id);
    }
  }
}
