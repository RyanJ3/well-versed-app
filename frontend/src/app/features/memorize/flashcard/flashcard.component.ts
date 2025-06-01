// frontend/src/app/flashcard/flashcard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeckCreate, DeckResponse, DeckService } from '../../../core/services/deck.service';
import { UserService } from '../../../core/services/user.service';
import { ModalService } from '../../../core/services/modal.service';

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
    private userService: UserService,
    private modalService: ModalService
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
        this.modalService.alert(
          'Error Loading Decks',
          'Unable to load your decks. Please check your connection and try again.',
          'danger'
        );
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
        this.modalService.alert(
          'Error Loading Public Decks',
          'Unable to load public decks. Please check your connection and try again.',
          'danger'
        );
      }
    });
  }

  loadSavedDecks() {
    this.isLoading = true;
    
    this.deckService.getSavedDecks(this.userId).subscribe({
      next: (response) => {
        this.savedDecks = response.decks.map(deck => ({ 
          ...deck, 
          loading_counts: false,
          is_saved: true // Mark all as saved since they're in the saved list
        }));
        this.isLoading = false;
        // Load detailed counts for each deck
        this.loadDetailedCounts(this.savedDecks);
      },
      error: (error) => {
        console.error('Error loading saved decks:', error);
        this.isLoading = false;
        
        // Fallback to empty array if endpoint doesn't exist yet
        this.savedDecks = [];
        
        // Show appropriate error message
        if (error.status === 404) {
          // Endpoint not implemented yet, silently handle
          console.log('Saved decks endpoint not implemented yet');
        } else {
          // Real error occurred
          this.modalService.alert(
            'Error Loading Saved Decks',
            'Unable to load saved decks. Please try again later.',
            'danger'
          );
        }
      }
    });
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
    if (!this.newDeck.name.trim()) {
      this.modalService.alert(
        'Validation Error',
        'Please enter a name for your deck.',
        'warning'
      );
      return;
    }

    this.isLoading = true;

    this.deckService.createDeck(this.newDeck).subscribe({
      next: (deck) => {
        const deckWithCounts: DeckWithCounts = { ...deck, loading_counts: false };
        this.myDecks.unshift(deckWithCounts);
        this.toggleCreateForm();
        this.isLoading = false;
        
        this.modalService.success(
          'Deck Created',
          `Your deck "${deck.name}" has been created successfully!`
        );
      },
      error: (error) => {
        console.error('Error creating deck:', error);
        this.isLoading = false;
        this.modalService.alert(
          'Error Creating Deck',
          'Unable to create deck. Please try again.',
          'danger'
        );
      }
    });
  }

  async deleteDeck(deckId: number) {
    const deck = this.myDecks.find(d => d.deck_id === deckId);
    if (!deck) return;

    const confirmed = await this.modalService.danger(
      'Delete Deck',
      `Are you sure you want to delete "${deck.name}"? This action cannot be undone and all cards in this deck will be permanently removed.`,
      'Delete Deck'
    );

    if (!confirmed) return;

    this.deckService.deleteDeck(deckId).subscribe({
      next: () => {
        this.myDecks = this.myDecks.filter(d => d.deck_id !== deckId);
        this.modalService.success(
          'Deck Deleted',
          `"${deck.name}" has been deleted successfully.`
        );
      },
      error: (error) => {
        console.error('Error deleting deck:', error);
        this.modalService.alert(
          'Error Deleting Deck',
          'Unable to delete deck. Please try again.',
          'danger'
        );
      }
    });
  }

  saveDeck(deck: DeckWithCounts) {
    deck.saving = true;
    
    this.deckService.saveDeck(deck.deck_id, this.userId).subscribe({
      next: () => {
        deck.is_saved = true;
        deck.save_count = (deck.save_count || 0) + 1;
        deck.saving = false;
        
        // Add to saved decks if not already there
        if (!this.savedDecks.find(d => d.deck_id === deck.deck_id)) {
          this.savedDecks.push({ ...deck });
        }
        
        this.modalService.success(
          'Deck Saved',
          `"${deck.name}" has been added to your collection!`
        );
      },
      error: (error: any) => {
        console.error('Error saving deck:', error);
        deck.saving = false;
        this.modalService.alert(
          'Error Saving Deck',
          'Unable to save deck to your collection. Please try again.',
          'danger'
        );
      }
    });
  }

  async unsaveDeck(deck: DeckWithCounts) {
    const confirmed = await this.modalService.confirm({
      title: 'Remove from Collection',
      message: `Are you sure you want to remove "${deck.name}" from your saved decks?`,
      type: 'warning',
      confirmText: 'Remove',
      showCancel: true
    });

    if (!confirmed.confirmed) return;

    deck.saving = true;
    
    this.deckService.unsaveDeck(deck.deck_id, this.userId).subscribe({
      next: () => {
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
        
        this.modalService.success(
          'Deck Removed',
          `"${deck.name}" has been removed from your collection.`
        );
      },
      error: (error) => {
        console.error('Error unsaving deck:', error);
        deck.saving = false;
        this.modalService.alert(
          'Error Removing Deck',
          'Unable to remove deck from your collection. Please try again.',
          'danger'
        );
      }
    });
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