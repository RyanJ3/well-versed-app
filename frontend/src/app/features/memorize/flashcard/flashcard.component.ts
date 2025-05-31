// frontend/src/app/flashcard/flashcard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeckCreate, DeckResponse, DeckService } from '../../../core/services/deck.service';
import { UserService } from '../../../core/services/user.service';

interface DeckWithCounts extends DeckResponse {
  verse_count?: number;
  loading_counts?: boolean;
  saving?: boolean;
}

@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './flashcard.component.html',
  styleUrls: ['./flashcard.component.scss']
})
export class FlashcardComponent implements OnInit {
  activeTab: 'my-decks' | 'public' | 'saved' = 'my-decks';
  isLoading = false;
  userId = 1; // Will be updated from UserService

  // Decks with extended counting information
  myDecks: DeckWithCounts[] = [];
  publicDecks: DeckWithCounts[] = [];
  savedDecks: DeckWithCounts[] = [];

  // Create deck form
  showCreateForm = false;
  newDeck: DeckCreate = {
    name: '',
    description: '',
    is_public: false,
    verse_codes: [],
    tags: []
  };
  tagInput = '';

  constructor(
    private deckService: DeckService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Get current user ID
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
        this.loadMyDecks();
      }
    });
  }

  setActiveTab(tab: 'my-decks' | 'public' | 'saved') {
    this.activeTab = tab;
    
    switch (tab) {
      case 'my-decks':
        if (this.myDecks.length === 0) {
          this.loadMyDecks();
        }
        break;
      case 'public':
        if (this.publicDecks.length === 0) {
          this.loadPublicDecks();
        }
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
        this.myDecks = response.decks.map(deck => ({ ...deck, loading_counts: false }));
        this.isLoading = false;
        // Load detailed counts for each deck
        this.loadDetailedCounts(this.myDecks);
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
        this.publicDecks = response.decks.map(deck => ({ ...deck, loading_counts: false }));
        this.isLoading = false;
        // Load detailed counts for each deck
        this.loadDetailedCounts(this.publicDecks);
      },
      error: (error) => {
        console.error('Error loading public decks:', error);
        this.isLoading = false;
      }
    });
  }

  loadSavedDecks() {
    this.isLoading = true;
    // TODO: Replace with actual saved decks endpoint when backend is ready
    // this.deckService.getSavedDecks(this.userId).subscribe({
    //   next: (response) => {
    //     this.savedDecks = response.decks.map(deck => ({ ...deck, loading_counts: false }));
    //     this.isLoading = false;
    //     this.loadDetailedCounts(this.savedDecks);
    //   },
    //   error: (error) => {
    //     console.error('Error loading saved decks:', error);
    //     this.isLoading = false;
    //   }
    // });

    // Temporary implementation - filter public decks that are marked as saved
    this.savedDecks = this.publicDecks.filter(deck => deck.is_saved);
    this.isLoading = false;
  }

  /**
   * Load detailed verse counts for decks by fetching their cards
   * This provides accurate verse count vs card count
   */
  private loadDetailedCounts(decks: DeckWithCounts[]) {
    // Load counts for all decks that don't have verse_count yet
    const decksToLoad = decks.filter(deck => deck.verse_count === undefined);
    
    decksToLoad.forEach(deck => {
      deck.loading_counts = true;
      
      this.deckService.getDeckCards(deck.deck_id, this.userId).subscribe({
        next: (response) => {
          // Calculate total verse count from all cards
          // Each card can be either single_verse (1 verse) or verse_range (multiple verses)
          const totalVerses = response.cards.reduce((total, card) => {
            if (card.card_type === 'single_verse') {
              return total + 1;
            } else if (card.card_type === 'verse_range' && card.verses) {
              return total + card.verses.length;
            } else if (card.verses) {
              // Fallback: count actual verses array length
              return total + card.verses.length;
            }
            return total + 1; // Default to 1 if unclear
          }, 0);
          
          deck.verse_count = totalVerses;
          deck.loading_counts = false;
        },
        error: (error) => {
          console.error(`Error loading counts for deck ${deck.deck_id}:`, error);
          deck.loading_counts = false;
          // Fallback: assume 1 verse per card
          deck.verse_count = deck.card_count;
        }
      });
    });
  }

  /**
   * Get formatted count display for a deck
   */
  getCountDisplay(deck: DeckWithCounts): { cards: number; verses: number | string } {
    return {
      cards: deck.card_count,
      verses: deck.loading_counts ? '...' : (deck.verse_count ?? deck.card_count)
    };
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
      verse_codes: [],
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
        const deckWithCounts: DeckWithCounts = { ...deck, loading_counts: false };
        this.myDecks.unshift(deckWithCounts);
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
    if (!confirm('Are you sure you want to delete this deck? This action cannot be undone.')) return;

    this.deckService.deleteDeck(deckId).subscribe({
      next: () => {
        this.myDecks = this.myDecks.filter(d => d.deck_id !== deckId);
      },
      error: (error) => {
        console.error('Error deleting deck:', error);
        alert('Error deleting deck. Please try again.');
      }
    });
  }

  saveDeck(deck: DeckWithCounts) {
    deck.saving = true;
    
    // TODO: Replace with actual backend endpoint when ready
    // this.deckService.saveDeck(deck.deck_id, this.userId).subscribe({
    //   next: () => {
    //     deck.is_saved = true;
    //     deck.save_count = (deck.save_count || 0) + 1;
    //     deck.saving = false;
    //     
    //     // Add to saved decks if not already there
    //     if (!this.savedDecks.find(d => d.deck_id === deck.deck_id)) {
    //       this.savedDecks.push({ ...deck });
    //     }
    //     
    //     alert(`"${deck.name}" has been added to your collection!`);
    //   },
    //   error: (error) => {
    //     console.error('Error saving deck:', error);
    //     deck.saving = false;
    //     alert('Unable to save deck. Please try again.');
    //   }
    // });

    // Temporary implementation with simulated delay
    setTimeout(() => {
      deck.is_saved = true;
      deck.save_count = (deck.save_count || 0) + 1;
      deck.saving = false;
      
      // Add to saved decks if not already there
      if (!this.savedDecks.find(d => d.deck_id === deck.deck_id)) {
        this.savedDecks.push({ ...deck });
      }
      
      console.log(`"${deck.name}" added to your collection!`);
    }, 500);
  }

  unsaveDeck(deck: DeckWithCounts) {
    deck.saving = true;
    
    // TODO: Replace with actual backend endpoint when ready
    // this.deckService.unsaveDeck(deck.deck_id, this.userId).subscribe({
    //   next: () => {
    //     deck.is_saved = false;
    //     deck.save_count = Math.max(0, (deck.save_count || 1) - 1);
    //     deck.saving = false;
    //     
    //     // Remove from saved decks
    //     this.savedDecks = this.savedDecks.filter(d => d.deck_id !== deck.deck_id);
    //     
    //     // Update the deck in public decks list if it exists there
    //     const publicDeck = this.publicDecks.find(d => d.deck_id === deck.deck_id);
    //     if (publicDeck) {
    //       publicDeck.is_saved = false;
    //       publicDeck.save_count = deck.save_count;
    //     }
    //     
    //     alert(`"${deck.name}" has been removed from your collection.`);
    //   },
    //   error: (error) => {
    //     console.error('Error unsaving deck:', error);
    //     deck.saving = false;
    //     alert('Unable to remove deck from collection. Please try again.');
    //   }
    // });

    // Temporary implementation with simulated delay
    setTimeout(() => {
      deck.is_saved = false;
      deck.save_count = Math.max(0, (deck.save_count || 1) - 1);
      deck.saving = false;
      
      // Remove from saved decks
      this.savedDecks = this.savedDecks.filter(d => d.deck_id !== deck.deck_id);
      
      // Update the deck in public decks list if it exists there
      const publicDeck = this.publicDecks.find(d => d.deck_id === deck.deck_id);
      if (publicDeck) {
        publicDeck.is_saved = false;
        publicDeck.save_count = deck.save_count;
      }
      
      console.log(`"${deck.name}" removed from your collection.`);
    }, 500);
  }

  getDisplayDecks(): DeckWithCounts[] {
    switch (this.activeTab) {
      case 'my-decks':
        return this.myDecks;
      case 'public':
        return this.publicDecks;
      case 'saved':
        return this.savedDecks;
    }
  }

  // TrackBy function for better performance
  trackByDeckId(index: number, deck: DeckWithCounts): number {
    return deck.deck_id;
  }
}