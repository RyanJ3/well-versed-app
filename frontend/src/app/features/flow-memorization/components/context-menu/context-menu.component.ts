import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuData } from '../../models/context-menu-data.model';

@Component({
  selector: 'app-flow-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss']
})
export class FlowContextMenuComponent {
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

  addToFlashcardDeck(deck: string) {
    this.addToDeck.emit(deck);
  }

  createNewDeck() {
    this.createDeck.emit();
  }
}
