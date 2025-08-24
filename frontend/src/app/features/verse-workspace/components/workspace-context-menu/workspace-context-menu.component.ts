import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContextMenuData } from '../../models/context-menu-data.model';

@Component({
  selector: 'app-workspace-context-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workspace-context-menu.component.html',
  styleUrls: ['./workspace-context-menu.component.scss']
})
export class WorkspaceContextMenuComponent {
  @Input() contextMenu!: ContextMenuData;
  @Input() flashcardDecks: string[] = [];
  @Input() selectedVerseIsMemorized = false;
  @Input() shouldShowMarkAsMemorized = false;
  @Input() shouldShowMarkAsUnmemorized = false;

  @Output() markAsMemorized = new EventEmitter<void>();
  @Output() markAsUnmemorized = new EventEmitter<void>();
  @Output() addToDeck = new EventEmitter<string>();
  @Output() createDeck = new EventEmitter<void>();
  @Output() jumpToCrossReferences = new EventEmitter<void>();

  // Deck dropdown state
  showDeckDropdown = false;
  deckSearchText = '';
  filteredDecks: string[] = [];
  private hoverTimeout: any;

  onDeckHover() {
    // Clear any pending timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    // Show dropdown immediately on hover
    this.showDeckDropdown = true;
    // Initialize with all decks visible on hover
    this.filteredDecks = [...this.flashcardDecks];
  }

  onDeckLeave() {
    // Add a small delay before hiding to allow moving mouse to dropdown
    this.hoverTimeout = setTimeout(() => {
      this.showDeckDropdown = false;
      this.deckSearchText = '';
      this.filteredDecks = [];
    }, 100);
  }

  onDeckSearchInput() {
    this.filterDecks();
  }

  filterDecks() {
    if (!this.deckSearchText.trim()) {
      // Show all decks when search is empty
      this.filteredDecks = [...this.flashcardDecks];
      return;
    }

    const searchLower = this.deckSearchText.toLowerCase();
    this.filteredDecks = this.flashcardDecks.filter(deck => 
      deck.toLowerCase().includes(searchLower)
    );
  }

  selectDeck(deck: string) {
    this.addToDeck.emit(deck);
    this.showDeckDropdown = false;
    this.deckSearchText = '';
    this.filteredDecks = [];
  }

  createNewDeck() {
    this.createDeck.emit();
    this.showDeckDropdown = false;
    this.deckSearchText = '';
  }
}
