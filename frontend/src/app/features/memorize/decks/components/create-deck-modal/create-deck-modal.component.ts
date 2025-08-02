// frontend/src/app/features/memorize/decks/components/create-deck-modal/create-deck-modal.component.ts
import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeckCreate } from '../../../../../services/deck.service';

interface TagCategory {
  name: string;
  tags: string[];
}

@Component({
  selector: 'app-create-deck-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-deck-modal.component.html',
  styleUrls: ['./create-deck-modal.component.scss']
})
export class CreateDeckModalComponent implements OnInit {
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
  
  tagCategories: TagCategory[] = [];
  selectedTag = '';
  showTagDropdown = false;

  ngOnInit() {
    // Initialize predefined tags
    this.tagCategories = [
      {
        name: 'Books of the Bible',
        tags: [
          'genesis', 'exodus', 'psalms', 'proverbs', 'isaiah', 
          'matthew', 'mark', 'luke', 'john', 'acts', 
          'romans', 'corinthians', 'galatians', 'ephesians', 
          'philippians', 'revelation'
        ]
      },
      {
        name: 'Topics',
        tags: [
          'salvation', 'faith', 'love', 'prayer', 'worship',
          'forgiveness', 'grace', 'mercy', 'hope', 'peace',
          'wisdom', 'courage', 'strength', 'healing', 'joy',
          'promises', 'prophecy', 'parables', 'miracles'
        ]
      },
      {
        name: 'Life Situations',
        tags: [
          'anxiety', 'fear', 'grief', 'depression', 'anger',
          'temptation', 'guidance', 'marriage', 'parenting', 
          'friendship', 'work', 'finances', 'health', 'loss'
        ]
      },
      {
        name: 'Study Type',
        tags: [
          'daily-devotion', 'memory-verse', 'study-guide',
          'sermon-series', 'bible-study', 'youth-group',
          'sunday-school', 'small-group', 'personal-study'
        ]
      },
      {
        name: 'Difficulty',
        tags: [
          'beginner', 'intermediate', 'advanced',
          'short-verses', 'long-passages', 'key-verses'
        ]
      }
    ];
  }

  onClose() {
    this.close.emit();
    this.resetForm();
  }

  onSubmit() {
    if (this.newDeck.name.trim()) {
      this.create.emit(this.newDeck);
    }
  }

  toggleTagDropdown() {
    this.showTagDropdown = !this.showTagDropdown;
  }

  selectTag(tag: string) {
    if (!this.newDeck.tags?.includes(tag)) {
      this.newDeck.tags = [...(this.newDeck.tags || []), tag];
    }
    this.selectedTag = '';
    this.showTagDropdown = false;
  }

  removeTag(tag: string) {
    this.newDeck.tags = this.newDeck.tags?.filter(t => t !== tag) || [];
  }

  formatTag(tag: string): string {
    // Format tag for display (e.g., "daily-devotion" -> "Daily Devotion")
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private resetForm() {
    this.newDeck = {
      name: '',
      description: '',
      is_public: false,
      verse_codes: [],
      tags: []
    };
    this.selectedTag = '';
    this.showTagDropdown = false;
  }
}