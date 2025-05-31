// frontend/src/app/deck-editor/deck-editor.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardWithVerses, DeckResponse, DeckService } from '../../../core/services/deck.service';
import { VersePickerComponent, VerseSelection } from '../../../shared/components/verse-range-picker/verse-range-picker.component';
import { BibleService } from '../../../core/services/bible.service';

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
    private bibleService: BibleService
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
      }
    });
  }

  updateDeckInfo() {
    if (!this.deckName.trim()) return;
    
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
      },
      error: (error) => {
        console.error('Error updating deck:', error);
        this.isSaving = false;
      }
    });
  }

  onVerseSelectionChanged(selection: VerseSelection) {
    this.currentSelection = selection;
  }

  addSelectedVerses() {
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
      alert('All selected verses are already in this deck.');
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
          message += ` (${skippedCount} verses already in deck)`;
        }
        alert(message);
      },
      error: (error) => {
        console.error('Error adding verses:', error);
        this.isAddingVerses = false;
        alert('Error adding verses to deck. Please try again.');
      }
    });
  }

  removeCardFromDeck(cardId: number) {
    this.deckService.removeCardFromDeck(this.deckId, cardId).subscribe({
      next: () => {
        this.deckCards = this.deckCards.filter(c => c.card_id !== cardId);
        this.selectedCards.delete(cardId);
      },
      error: (error) => {
        console.error('Error removing card:', error);
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

  removeSelectedCards() {
    if (this.selectedCards.size === 0) return;
    
    const cardIds = Array.from(this.selectedCards);
    this.deckService.removeMultipleCardsFromDeck(this.deckId, cardIds).subscribe({
      next: () => {
        this.deckCards = this.deckCards.filter(c => !this.selectedCards.has(c.card_id));
        this.selectedCards.clear();
      },
      error: (error) => {
        console.error('Error removing cards:', error);
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