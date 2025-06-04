// frontend/src/app/features/memorize/flashcard/components/create-deck-modal/create-deck-modal.component.ts
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeckCreate } from '../../../../../core/services/deck.service';

@Component({
  selector: 'app-create-deck-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-deck-modal.component.html',
  styleUrls: ['./create-deck-modal.component.scss']
})
export class CreateDeckModalComponent {
  @Input() show = false;
  @Input() isLoading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<DeckCreate>();

  newDeck: DeckCreate = {
    name: '',
    description: '',
    is_public: false,
    verse_codes: [],
    tags: []
  };
  
  tagInput = '';

  onClose() {
    this.close.emit();
    this.resetForm();
  }

  onSubmit() {
    if (this.newDeck.name.trim()) {
      this.create.emit(this.newDeck);
    }
  }

  addTag() {
    if (this.tagInput.trim() && !this.newDeck.tags?.includes(this.tagInput.trim())) {
      // Limit tag length and format
      const formattedTag = this.tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (formattedTag.length <= 20) {
        this.newDeck.tags = [...(this.newDeck.tags || []), formattedTag];
        this.tagInput = '';
      }
    }
  }

  removeTag(tag: string) {
    this.newDeck.tags = this.newDeck.tags?.filter(t => t !== tag) || [];
  }

  private resetForm() {
    this.newDeck = {
      name: '',
      description: '',
      is_public: false,
      verse_codes: [],
      tags: []
    };
    this.tagInput = '';
  }
}