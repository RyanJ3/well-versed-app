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

  // Demo data flag
  useDemoData = true;

  constructor(
    private deckService: DeckService,
    private userService: UserService
  ) {}

  ngOnInit() {
    if (this.useDemoData) {
      this.loadDemoData();
    } else {
      this.loadMyDecks();
    }
  }

  loadDemoData() {
    // Create some demo decks for testing
    this.myDecks = [
      {
        deck_id: 1,
        creator_id: 1,
        creator_name: 'Test User',
        name: 'John 3:16 Collection',
        description: 'Famous verses from the Gospel of John',
        is_public: false,
        save_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        verse_count: 5,
        tags: ['gospel', 'john', 'love'],
        is_saved: false
      },
      {
        deck_id: 2,
        creator_id: 1,
        creator_name: 'Test User',
        name: 'Psalms for Comfort',
        description: 'Comforting verses from the book of Psalms',
        is_public: true,
        save_count: 12,
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        verse_count: 8,
        tags: ['psalms', 'comfort', 'peace'],
        is_saved: false
      }
    ];

    this.publicDecks = [
      {
        deck_id: 3,
        creator_id: 2,
        creator_name: 'Bible Scholar',
        name: 'Romans Road to Salvation',
        description: 'Key verses about salvation from Romans',
        is_public: true,
        save_count: 45,
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        verse_count: 6,
        tags: ['salvation', 'romans', 'gospel'],
        is_saved: false
      },
      {
        deck_id: 4,
        creator_id: 3,
        creator_name: 'Youth Pastor',
        name: 'Verses for Students',
        description: 'Encouraging verses for young people',
        is_public: true,
        save_count: 23,
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        updated_at: new Date(Date.now() - 259200000).toISOString(),
        verse_count: 12,
        tags: ['youth', 'encouragement', 'students'],
        is_saved: true
      }
    ];

    this.savedDecks = this.publicDecks.filter(deck => deck.is_saved);
  }

  setActiveTab(tab: 'my-decks' | 'public' | 'saved') {
    this.activeTab = tab;
    
    if (!this.useDemoData) {
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
        // Fallback to demo data on error
        this.useDemoData = true;
        this.loadDemoData();
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

    if (this.useDemoData) {
      // Simulate creating a deck with demo data
      const newDeck: DeckResponse = {
        deck_id: Math.max(...this.myDecks.map(d => d.deck_id)) + 1,
        creator_id: this.userId,
        creator_name: 'Test User',
        name: this.newDeck.name,
        description: this.newDeck.description,
        is_public: this.newDeck.is_public,
        save_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        verse_count: 0,
        tags: this.newDeck.tags || [],
        is_saved: false
      };

      this.myDecks.unshift(newDeck);
      this.toggleCreateForm();
      this.isLoading = false;
      
      // Show success message
      console.log('Demo deck created:', newDeck);
    } else {
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
  }

  deleteDeck(deckId: number) {
    if (!confirm('Are you sure you want to delete this deck?')) return;

    if (this.useDemoData) {
      // Simulate deleting a deck
      this.myDecks = this.myDecks.filter(d => d.deck_id !== deckId);
      console.log('Demo deck deleted:', deckId);
    } else {
      this.deckService.deleteDeck(deckId).subscribe({
        next: () => {
          this.myDecks = this.myDecks.filter(d => d.deck_id !== deckId);
        },
        error: (error) => {
          console.error('Error deleting deck:', error);
        }
      });
    }
  }

  saveDeck(deck: DeckResponse) {
    if (this.useDemoData) {
      // Simulate saving a deck
      deck.is_saved = true;
      deck.save_count++;
      if (this.activeTab === 'saved') {
        this.savedDecks.push(deck);
      }
      console.log('Demo deck saved:', deck.name);
    } else {
      this.deckService.saveDeck(deck.deck_id).subscribe({
        next: () => {
          deck.is_saved = true;
          deck.save_count++;
          if (this.activeTab === 'saved') {
            this.loadSavedDecks();
          }
        },
        error: (error) => {
          console.error('Error saving deck:', error);
        }
      });
    }
  }

  unsaveDeck(deck: DeckResponse) {
    if (this.useDemoData) {
      // Simulate unsaving a deck
      deck.is_saved = false;
      deck.save_count--;
      if (this.activeTab === 'saved') {
        this.savedDecks = this.savedDecks.filter(d => d.deck_id !== deck.deck_id);
      }
      console.log('Demo deck unsaved:', deck.name);
    } else {
      this.deckService.unsaveDeck(deck.deck_id).subscribe({
        next: () => {
          deck.is_saved = false;
          deck.save_count--;
          if (this.activeTab === 'saved') {
            this.savedDecks = this.savedDecks.filter(d => d.deck_id !== deck.deck_id);
          }
        },
        error: (error) => {
          console.error('Error unsaving deck:', error);
        }
      });
    }
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

  // Demo method to switch between demo and real data
  toggleDemoMode() {
    this.useDemoData = !this.useDemoData;
    if (this.useDemoData) {
      this.loadDemoData();
    } else {
      this.loadMyDecks();
    }
  }

  // TrackBy function for better performance
  trackByDeckId(index: number, deck: DeckResponse): number {
    return deck.deck_id;
  }
}