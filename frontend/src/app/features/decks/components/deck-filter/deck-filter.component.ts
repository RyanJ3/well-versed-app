// frontend/src/app/features/decks/components/deck-filter/deck-filter.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-deck-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deck-filter.component.html',
  styleUrls: ['./deck-filter.component.scss']
})
export class DeckFilterComponent {
  @Input() allTags: string[] = [];
  @Input() selectedTags: string[] = [];
  @Input() tagCounts: Map<string, number> = new Map();
  
  @Output() tagToggled = new EventEmitter<string>();
  @Output() clearFilters = new EventEmitter<void>();

  onTagClick(tag: string) {
    this.tagToggled.emit(tag);
  }

  onClearFilters() {
    this.clearFilters.emit();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  getTagCount(tag: string): number {
    return this.tagCounts.get(tag) || 0;
  }

  formatTag(tag: string): string {
    // Format tag for display (e.g., "daily-devotion" -> "Daily Devotion")
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}