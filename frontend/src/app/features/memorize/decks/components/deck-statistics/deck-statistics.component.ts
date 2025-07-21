import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeckWithCounts } from '../../models/deck.types';

@Component({
  selector: 'app-deck-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deck-statistics.component.html',
  styleUrls: ['./deck-statistics.component.scss']
})
export class DeckStatisticsComponent {
  @Input() deck!: DeckWithCounts;
}
