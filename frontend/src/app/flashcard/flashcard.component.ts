// frontend/src/app/flashcard/flashcard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeckService, DeckResponse, DeckCreate } from '../services/deck.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flashcard.component.html',
  styleUrls: ['./flashcard.component.scss']
})
export class FlashcardComponent implements OnInit {
  activeTab: 'my-decks' | 'public' | 'saved' = 'my-decks';
  isLoading = false;
  userId = 1;

  // Decks
  myDecks: DeckResponse[] = [];
  publicDecks: DeckResponse[] = [];
  savedDecks: DeckResponse[] = [];

  // Create deck form
  showCreateForm = false;
  newDeck: DeckCreate = {
    name: '',
    description: '',
    is_public: false,
    tags: []
  };
  tagInput = '';

  constructor(
    private deckService: DeckService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadMyDecks();
  }

  setActiveTab(tab: 'my-decks' | 'public' | 'saved') {
    this.activeTab = tab;
    
    switch (tab) {
      case 'my-decks':
        this.loadMyDecks();
        break;
      case 'public':
        this.loadPublicDecks();
        break;
      case 'saved':
        this.loadSavedDecks();
        break;
    }
  }

  loadMyDecks() {
    this.isLoading = true;
    this.deckService.getUserDecks(this.userId).subscribe({
      next: (response) => {
        this.myDecks = response.decks;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading decks:', error);
        this.isLoading = false;
      }
    });
  }

  loadPublicDecks() {
    this.isLoading = true;
    this.deckService.getPublicDecks().subscribe({
      next: (response) => {
        this.publicDecks = response.decks;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading public decks:', error);
        this.isLoading = false;
      }
    });
  }

  loadSavedDecks() {
    this.isLoading = true;
    this.deckService.getSavedDecks(this.userId).subscribe({
      next: (response) => {
        this.savedDecks = response.decks;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading saved decks:', error);
        this.isLoading = false;
      }
    });
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.resetNewDeck();
    }
  }

  resetNewDeck() {
    this.newDeck = {
      name: '',
      description: '',
      is_public: false,
      tags: []
    };
    this.tagInput = '';
  }

  addTag() {
    if (this.tagInput.trim() && !this.newDeck.tags?.includes(this.tagInput.trim())) {
      this.newDeck.tags = [...(this.newDeck.tags || []), this.tagInput.trim()];
      this.tagInput = '';
    }
  }

  removeTag(tag: string) {
    this.newDeck.tags = this.newDeck.tags?.filter(t => t !== tag) || [];
  }

  createDeck() {
    if (!this.newDeck.name.trim()) return;

    this.isLoading = true;
    this.deckService.createDeck(this.newDeck).subscribe({
      next: (deck) => {
        this.myDecks.unshift(deck);
        this.toggleCreateForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating deck:', error);
        this.isLoading = false;
      }
    });
  }

  deleteDeck(deckId: number) {
    if (!confirm('Are you sure you want to delete this deck?')) return;

    this.deckService.deleteDeck(deckId).subscribe({
      next: () => {
        this.myDecks = this.myDecks.filter(d => d.deck_id !== deckId);
      },
      error: (error) => {
        console.error('Error deleting deck:', error);
      }
    });
  }

  saveDeck(deck: DeckResponse) {
    this.deckService.saveDeck(deck.deck_id).subscribe({
      next: () => {
        deck.is_saved = true;
        deck.save_count++;
        // Reload saved decks if on that tab
        if (this.activeTab === 'saved') {
          this.loadSavedDecks();
        }
      },
      error: (error) => {
        console.error('Error saving deck:', error);
      }
    });
  }

  unsaveDeck(deck: DeckResponse) {
    this.deckService.unsaveDeck(deck.deck_id).subscribe({
      next: () => {
        deck.is_saved = false;
        deck.save_count--;
        // Remove from saved decks if on that tab
        if (this.activeTab === 'saved') {
          this.savedDecks = this.savedDecks.filter(d => d.deck_id !== deck.deck_id);
        }
      },
      error: (error) => {
        console.error('Error unsaving deck:', error);
      }
    });
  }

  getDisplayDecks(): DeckResponse[] {
    switch (this.activeTab) {
      case 'my-decks':
        return this.myDecks;
      case 'public':
        return this.publicDecks;
      case 'saved':
        return this.savedDecks;
    }
  }
}