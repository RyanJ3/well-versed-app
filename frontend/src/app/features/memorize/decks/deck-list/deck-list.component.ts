// frontend/src/app/features/memorize/flashcard/flashcard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeckCardComponent, DeckWithCounts } from '../components/deck-card/deck-card.component';
import { CreateDeckModalComponent } from '../components/create-deck-modal/create-deck-modal.component';
import { DeckFilterComponent } from '../components/deck-filter/deck-filter.component';
import { UserService } from '../../../../core/services/user.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DeckCreate, DeckService } from '../../../../core/services/deck.service';

interface Tab {
  id: 'my-decks' | 'public' | 'saved';
  label: string;
  icon: string;
}

@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    DeckCardComponent,
    CreateDeckModalComponent,
    DeckFilterComponent
  ],
  templateUrl: './deck-list.component.html',
  styleUrls: [
    './deck-list.component.scss',
    // './flashcard-hero.component.scss'
  ]
})
export class DeckListComponent implements OnInit {
  // Tab configuration
  tabs: Tab[] = [
    {
      id: 'my-decks',
      label: 'My Decks',
      icon: '📚'
    },
    {
      id: 'public',
      label: 'Discover',
      icon: '🌐'
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: '💾'
    }
  ];

  activeTab: 'my-decks' | 'public' | 'saved' = 'my-decks';
  isLoading = false;
  userId = 1; // Will be updated from UserService

  // Decks with extended counting information
  myDecks: DeckWithCounts[] = [];
  publicDecks: DeckWithCounts[] = [];
  savedDecks: DeckWithCounts[] = [];

  // Tag filtering
  selectedTags: string[] = [];
  tagCounts = new Map<string, number>();
  
  // Create deck modal
  showCreateModal = false;

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

  // Tab Management
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

  getTabCount(tabId: string): number {
    switch (tabId) {
      case 'my-decks':
        return this.myDecks.length;
      case 'public':
        return this.publicDecks.length;
      case 'saved':
        return this.savedDecks.length;
      default:
        return 0;
    }
  }

  // Data Loading
  loadMyDecks() {
    this.isLoading = true;
    this.deckService.getUserDecks(this.userId).subscribe({
      next: (response) => {
        this.myDecks = response.decks.map(deck => ({ 
          ...deck, 
          loading_counts: false,
          creator_id: deck.creator_id || this.userId,
          updated_at: deck.updated_at || deck.created_at
        }));
        this.isLoading = false;
        this.loadDetailedCounts(this.myDecks);
        this.updateTagCounts();
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
        this.publicDecks = response.decks.map(deck => ({ 
          ...deck, 
          loading_counts: false,
          updated_at: deck.updated_at || deck.created_at
        }));
        this.isLoading = false;
        this.loadDetailedCounts(this.publicDecks);
        this.updateTagCounts();
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
          is_saved: true,
          updated_at: deck.updated_at || deck.created_at
        }));
        this.isLoading = false;
        this.loadDetailedCounts(this.savedDecks);
        this.updateTagCounts();
      },
      error: (error) => {
        console.error('Error loading saved decks:', error);
        this.isLoading = false;
        this.savedDecks = [];
        
        if (error.status !== 404) {
          this.modalService.alert(
            'Error Loading Saved Decks',
            'Unable to load saved decks. Please try again later.',
            'danger'
          );
        }
      }
    });
  }

  private loadDetailedCounts(decks: DeckWithCounts[]) {
    const decksToLoad = decks.filter(deck => deck.verse_count === undefined);
    
    decksToLoad.forEach(deck => {
      deck.loading_counts = true;
      
      this.deckService.getDeckCards(deck.deck_id, this.userId).subscribe({
        next: (response) => {
          const totalVerses = response.cards.reduce((total, card) => {
            if (card.card_type === 'single_verse') {
              return total + 1;
            } else if (card.card_type === 'verse_range' && card.verses) {
              return total + card.verses.length;
            } else if (card.verses) {
              return total + card.verses.length;
            }
            return total + 1;
          }, 0);
          
          deck.verse_count = totalVerses;
          deck.loading_counts = false;
        },
        error: (error) => {
          console.error(`Error loading counts for deck ${deck.deck_id}:`, error);
          deck.loading_counts = false;
          deck.verse_count = deck.card_count;
        }
      });
    });
  }

  // Tag Management
  getAllTags(): string[] {
    const allDecks = this.getDisplayDecks();
    const tagSet = new Set<string>();
    
    allDecks.forEach(deck => {
      if (deck.tags && deck.tags.length > 0) {
        deck.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  }

  updateTagCounts() {
    this.tagCounts.clear();
    const allDecks = this.getDisplayDecks();
    
    allDecks.forEach(deck => {
      if (deck.tags) {
        deck.tags.forEach(tag => {
          this.tagCounts.set(tag, (this.tagCounts.get(tag) || 0) + 1);
        });
      }
    });
  }

  toggleTagFilter(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
  }

  clearTagFilters() {
    this.selectedTags = [];
  }

  getFilteredDecks(): DeckWithCounts[] {
    let decks = this.getDisplayDecks();
    
    if (this.selectedTags.length > 0) {
      decks = decks.filter(deck => {
        if (!deck.tags || deck.tags.length === 0) return false;
        return this.selectedTags.some(tag => deck.tags!.includes(tag));
      });
    }
    
    return decks;
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

  // Empty State
  getEmptyStateTitle(): string {
    if (this.selectedTags.length > 0) {
      return 'No decks found with selected tags';
    }
    
    switch (this.activeTab) {
      case 'my-decks':
        return 'No decks found';
      case 'public':
        return 'No public decks available';
      case 'saved':
        return 'No saved decks yet';
      default:
        return 'No decks found';
    }
  }

  getEmptyStateMessage(): string {
    if (this.selectedTags.length > 0) {
      return 'Try selecting different tags or clear the filters to see all decks.';
    }
    
    switch (this.activeTab) {
      case 'my-decks':
        return "You haven't created any decks yet. Create your first deck to get started!";
      case 'public':
        return 'No public decks are available at the moment. Check back later!';
      case 'saved':
        return "You haven't saved any decks yet. Browse public decks to find some to save!";
      default:
        return 'No decks available.';
    }
  }

  // Create Deck
  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  createDeck(newDeck: DeckCreate) {
    if (!newDeck.name.trim()) {
      this.modalService.alert(
        'Validation Error',
        'Please enter a name for your deck.',
        'warning'
      );
      return;
    }

    this.isLoading = true;

    this.deckService.createDeck(newDeck).subscribe({
      next: (deck) => {
        const deckWithCounts: DeckWithCounts = { 
          ...deck, 
          loading_counts: false,
          creator_id: deck.creator_id || this.userId,
          updated_at: deck.updated_at || deck.created_at
        };
        this.myDecks.unshift(deckWithCounts);
        this.closeCreateModal();
        this.isLoading = false;
        this.updateTagCounts();
        
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

  // Deck Actions
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
        this.updateTagCounts();
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
        
        if (!this.savedDecks.find(d => d.deck_id === deck.deck_id)) {
          this.savedDecks.push({ 
            ...deck,
            updated_at: deck.updated_at || deck.created_at
          });
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
        
        this.savedDecks = this.savedDecks.filter(d => d.deck_id !== deck.deck_id);
        
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

  // TrackBy function for better performance
  trackByDeckId(index: number, deck: DeckWithCounts): number {
    return deck.deck_id;
  }
}
