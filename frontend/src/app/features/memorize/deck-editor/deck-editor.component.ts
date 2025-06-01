// frontend/src/app/deck-editor/deck-editor.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardWithVerses, DeckResponse, DeckService } from '../../../core/services/deck.service';
import { VersePickerComponent, VerseSelection } from '../../../shared/components/verse-range-picker/verse-range-picker.component';
import { BibleService } from '../../../core/services/bible.service';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-deck-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, VersePickerComponent],
  templateUrl: './deck-editor.component.html',
  styleUrls: ['./deck-editor.component.scss']
})
export class DeckEditorComponent implements OnInit {
  deckId: number = 0;
  deck: DeckResponse | null = null;
  deckCards: CardWithVerses[] = [];
  isLoading = true;
  isSaving = false;
  isAddingVerses = false;
  userId = 1; // TODO: Get from UserService

  // Edit mode
  editMode: 'info' | 'verses' = 'verses';
  
  // Deck info editing
  deckName = '';
  deckDescription = '';
  isDeckPublic = false;

  // Verse picker selection
  currentSelection: VerseSelection | null = null;
  
  // Selected cards for bulk operations
  selectedCards: Set<number> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deckService: DeckService,
    private bibleService: BibleService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.deckId = +params['deckId'];
      this.loadDeck();
      this.loadDeckCards();
    });
  }

  loadDeck() {
    this.deckService.getDeck(this.deckId).subscribe({
      next: (deck) => {
        this.deck = deck;
        this.deckName = deck.name;
        this.deckDescription = deck.description || '';
        this.isDeckPublic = deck.is_public;
      },
      error: (error) => {
        console.error('Error loading deck:', error);
        this.modalService.alert('Error Loading Deck', 'Unable to load deck details. Please try again.', 'danger');
      }
    });
  }

  loadDeckCards() {
    this.isLoading = true;
    this.deckService.getDeckCards(this.deckId, this.userId).subscribe({
      next: (response) => {
        this.deckCards = response.cards;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading deck cards:', error);
        this.isLoading = false;
        this.modalService.alert('Error Loading Cards', 'Unable to load deck cards. Please try again.', 'danger');
      }
    });
  }

  updateDeckInfo() {
    if (!this.deckName.trim()) {
      this.modalService.alert('Validation Error', 'Deck name cannot be empty.', 'warning');
      return;
    }
    
    this.isSaving = true;
    const updates = {
      name: this.deckName,
      description: this.deckDescription,
      is_public: this.isDeckPublic
    };

    this.deckService.updateDeck(this.deckId, updates).subscribe({
      next: (updatedDeck) => {
        this.deck = updatedDeck;
        this.isSaving = false;
        this.editMode = 'verses';
        this.modalService.success('Deck Updated', 'Your deck settings have been saved successfully.');
      },
      error: (error) => {
        console.error('Error updating deck:', error);
        this.isSaving = false;
        this.modalService.alert('Error Updating Deck', 'Unable to save deck settings. Please try again.', 'danger');
      }
    });
  }

  onVerseSelectionChanged(selection: VerseSelection) {
    this.currentSelection = selection;
  }

  async addSelectedVerses() {
    if (!this.currentSelection || this.currentSelection.verseCodes.length === 0) {
      return;
    }

    // Check if any verses are already in the deck
    const existingVerseCodes = new Set();
    this.deckCards.forEach(card => {
      card.verses.forEach(verse => {
        existingVerseCodes.add(verse.verse_code);
      });
    });

    const newVerseCodes = this.currentSelection.verseCodes.filter(code => 
      !existingVerseCodes.has(code)
    );

    if (newVerseCodes.length === 0) {
      await this.modalService.alert(
        'Duplicate Verses', 
        'All selected verses are already in this deck.',
        'warning'
      );
      return;
    }

    this.isAddingVerses = true;
    this.deckService.addVersesToDeck(this.deckId, newVerseCodes, this.currentSelection.reference).subscribe({
      next: () => {
        this.loadDeckCards();
        this.isAddingVerses = false;
        
        // Show success message
        const addedCount = newVerseCodes.length;
        const skippedCount = this.currentSelection!.verseCodes.length - addedCount;
        let message = `Added flashcard with ${addedCount} verse${addedCount !== 1 ? 's' : ''}.`;
        if (skippedCount > 0) {
          message += ` (${skippedCount} verse${skippedCount !== 1 ? 's' : ''} already in deck)`;
        }
        
        this.modalService.success('Card Added', message);
      },
      error: (error) => {
        console.error('Error adding verses:', error);
        this.isAddingVerses = false;
        this.modalService.alert('Error Adding Verses', 'Unable to add verses to deck. Please try again.', 'danger');
      }
    });
  }

  async removeCardFromDeck(cardId: number) {
    const confirmed = await this.modalService.confirm({
      title: 'Remove Card',
      message: 'Are you sure you want to remove this card from the deck?',
      type: 'warning',
      confirmText: 'Remove',
      showCancel: true
    });

    if (!confirmed.confirmed) return;

    this.deckService.removeCardFromDeck(this.deckId, cardId).subscribe({
      next: () => {
        this.deckCards = this.deckCards.filter(c => c.card_id !== cardId);
        this.selectedCards.delete(cardId);
        this.modalService.success('Card Removed', 'The card has been removed from the deck.');
      },
      error: (error) => {
        console.error('Error removing card:', error);
        this.modalService.alert('Error Removing Card', 'Unable to remove card. Please try again.', 'danger');
      }
    });
  }

  toggleCardSelection(cardId: number) {
    if (this.selectedCards.has(cardId)) {
      this.selectedCards.delete(cardId);
    } else {
      this.selectedCards.add(cardId);
    }
  }

  async removeSelectedCards() {
    if (this.selectedCards.size === 0) return;
    
    const confirmed = await this.modalService.danger(
      'Remove Selected Cards',
      `Are you sure you want to remove ${this.selectedCards.size} selected card${this.selectedCards.size !== 1 ? 's' : ''} from the deck? This action cannot be undone.`,
      'Remove Cards'
    );

    if (!confirmed) return;

    const cardIds = Array.from(this.selectedCards);
    this.deckService.removeMultipleCardsFromDeck(this.deckId, cardIds).subscribe({
      next: () => {
        this.deckCards = this.deckCards.filter(c => !this.selectedCards.has(c.card_id));
        this.selectedCards.clear();
        this.modalService.success('Cards Removed', `${cardIds.length} card${cardIds.length !== 1 ? 's' : ''} removed from the deck.`);
      },
      error: (error) => {
        console.error('Error removing cards:', error);
        this.modalService.alert('Error Removing Cards', 'Unable to remove selected cards. Please try again.', 'danger');
      }
    });
  }

  getCardVersesText(card: CardWithVerses): string {
    if (card.verses.length === 0) return 'No verses';
    if (card.verses.length === 1) return card.verses[0].text;
    
    // For multiple verses, show first verse + indicator
    return `${card.verses[0].text} ... (+${card.verses.length - 1} more verse${card.verses.length - 1 !== 1 ? 's' : ''})`;
  }

  goBack() {
    this.router.navigate(['/flashcards']);
  }
}