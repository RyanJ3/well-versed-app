import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Metric {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
}

@Component({
  selector: 'app-deck-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deck-metrics.component.html',
  styleUrls: ['./deck-metrics.component.scss']
})
export class DeckMetricsComponent {
  @Input() totalDecks: number = 0;
  @Input() totalCards: number = 0;
  @Input() totalMemorized: number = 0;
  @Input() averageProgress: number = 0;

  get metrics(): Metric[] {
    return [
      { label: 'Decks', value: this.totalDecks, color: 'blue' },
      { label: 'Cards', value: this.totalCards, color: 'teal' },
      { label: 'Memorized', value: this.totalMemorized, color: 'emerald' },
      { label: 'Avg Progress', value: `${this.averageProgress}%`, color: 'sky' }
    ];
  }
}
