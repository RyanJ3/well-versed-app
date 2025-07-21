// frontend/src/app/deck-editor/deck-editor.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CardWithVerses,
  DeckResponse,
  DeckService,
  DeckCardsResponse,
  VerseInCard,
} from '../../../../../core/services/deck.service';
import { VerseSelection } from '../../../../../shared/components/verse-range-picker/verse-range-picker.component';
import { BibleService } from '../../../../../core/services/bible.service';
import { ModalService } from '../../../../../core/services/modal.service';
import { DeckFormComponent } from '../../components/deck-form/deck-form.component';
import { CardEditorComponent } from '../../components/card-editor/card-editor.component';

@Component({
  selector: 'app-deck-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DeckFormComponent, CardEditorComponent],
  templateUrl: './deck-editor-page.component.html',
  styleUrls: ['./deck-editor-page.component.scss'],
})
export class DeckEditorPageComponent implements OnInit {
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

  // Selected cards for bulk operations
  selectedCards: Set<number> = new Set();

  // Warning messages for inline verse pickers
  pickerWarnings: { [cardId: number]: string } = {};

  // Drag and drop
  draggedIndex: number | null = null;
  private originalDeckCards: CardWithVerses[] | null = null;
  private dropHandled = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deckService: DeckService,
    private bibleService: BibleService,
    private modalService: ModalService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params: any) => {
      this.deckId = +params['deckId'];
      this.loadDeck();
      this.loadDeckCards();
    });
  }

  loadDeck() {
    this.deckService.getDeck(this.deckId).subscribe({
      next: (deck: DeckResponse) => {
        this.deck = deck;
        this.deckName = deck.name;
        this.deckDescription = deck.description || '';
        this.isDeckPublic = deck.is_public;
      },
      error: (error: any) => {
        console.error('Error loading deck:', error);
        this.modalService.alert(
          'Error Loading Deck',
          'Unable to load deck details. Please try again.',
          'danger',
        );
      },
    });
  }

  loadDeckCards() {
    this.isLoading = true;
    this.deckService.getDeckCards(this.deckId, this.userId).subscribe({
      next: (response: DeckCardsResponse) => {
        this.deckCards = response.cards;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading deck cards:', error);
        this.isLoading = false;
        this.modalService.alert(
          'Error Loading Cards',
          'Unable to load deck cards. Please try again.',
          'danger',
        );
      },
    });
  }

  updateDeckInfoForm(value: { name: string; description: string; isPublic: boolean }) {
    this.deckName = value.name;
    this.deckDescription = value.description;
    this.isDeckPublic = value.isPublic;
    this.updateDeckInfo();
  }

  updateDeckInfo() {
    if (!this.deckName.trim()) {
      this.modalService.alert(
        'Validation Error',
        'Deck name cannot be empty.',
        'warning',
      );
      return;
    }

    this.isSaving = true;
    const updates = {
      name: this.deckName,
      description: this.deckDescription,
      is_public: this.isDeckPublic,
    };

    this.deckService.updateDeck(this.deckId, updates).subscribe({
      next: (updatedDeck: DeckResponse) => {
        this.deck = updatedDeck;
        this.isSaving = false;
        this.editMode = 'verses';
        this.modalService.success(
          'Deck Updated',
          'Your deck settings have been saved successfully.',
        );
      },
      error: (error: any) => {
        console.error('Error updating deck:', error);
        this.isSaving = false;
        this.modalService.alert(
          'Error Updating Deck',
          'Unable to save deck settings. Please try again.',
          'danger',
        );
      },
    });
  }

  // Card selection helpers

  getCardSelection(card: CardWithVerses): VerseSelection | null {
    if (!card.verses || card.verses.length === 0) return null;

    const firstVerse = card.verses[0];
    const lastVerse = card.verses[card.verses.length - 1];

    // Parse verse codes to get book, chapter, verse info
    const [bookId, startChapter, startVerse] = firstVerse.verse_code
      .split('-')
      .map(Number);
    const [, endChapter, endVerse] = lastVerse.verse_code
      .split('-')
      .map(Number);

    return {
      mode: card.card_type === 'single_verse' ? 'single' : 'range',
      startVerse: {
        book: this.getBookName(bookId),
        bookId: bookId,
        chapter: startChapter,
        verse: startVerse,
      },
      endVerse:
        card.card_type === 'verse_range'
          ? {
              chapter: endChapter,
              verse: endVerse,
            }
          : undefined,
      verseCodes: card.verses.map((v: VerseInCard) => v.verse_code),
      verseCount: card.verses.length,
      reference: card.reference,
    };
  }

  async applyVerseSelection(card: CardWithVerses, selection: VerseSelection) {
    const existingVerseCodes = new Set<string>();
    this.deckCards.forEach((c: CardWithVerses) => {
      if (c.card_id !== card.card_id) {
        c.verses.forEach((v: VerseInCard) => existingVerseCodes.add(v.verse_code));
      }
    });

    const duplicateVerses = selection.verseCodes.filter((code: string) =>
      existingVerseCodes.has(code),
    );
    if (duplicateVerses.length > 0) {
      this.pickerWarnings[card.card_id] =
        'Some of the selected verses are already in another card in this deck.';
      return;
    }

    this.pickerWarnings[card.card_id] = '';
    await this.updateCardVerses(card, selection);
  }

  async updateCardVerses(card: CardWithVerses, selection: VerseSelection) {
    // If it's a temporary card (negative ID), add it as new
    if (card.card_id < 0) {
      this.deckService
        .addVersesToDeck(this.deckId, selection.verseCodes, selection.reference)
        .subscribe({
          next: () => {
            this.loadDeckCards();
            this.modalService.success(
              'Card Added',
              'The card has been added successfully.',
            );
          },
          error: (error: any) => {
            console.error('Error adding card:', error);
            this.modalService.alert(
              'Error Adding Card',
              'Unable to add card. Please try again.',
              'danger',
            );
          },
        });
      return;
    }

    // To update a card, we need to remove it and add it again with new verses
    // First, ask for confirmation
    const confirmed = await this.modalService.confirm({
      title: 'Update Card',
      message:
        'To update this card, it will be removed and re-added with the new verses. Continue?',
      type: 'info',
      confirmText: 'Update',
      showCancel: true,
    });

    if (!confirmed.confirmed) return;

    // Remove the old card
    this.deckService.removeCardFromDeck(this.deckId, card.card_id).subscribe({
      next: () => {
        // Add the new card with updated verses
        this.deckService
          .addVersesToDeck(
            this.deckId,
            selection.verseCodes,
            selection.reference,
          )
          .subscribe({
            next: () => {
              this.loadDeckCards();
              this.modalService.success(
                'Card Updated',
                'The card has been updated successfully.',
              );
            },
            error: (error: any) => {
              console.error('Error adding updated card:', error);
              this.modalService.alert(
                'Error Updating Card',
                'Unable to update card. Please try again.',
                'danger',
              );
              // Reload to restore the original state
              this.loadDeckCards();
            },
          });
      },
      error: (error: any) => {
        console.error('Error removing old card:', error);
        this.modalService.alert(
          'Error Updating Card',
          'Unable to update card. Please try again.',
          'danger',
        );
      },
    });
  }

  getCardBook(card: CardWithVerses): string {
    if (!card.verses || card.verses.length === 0) return '';
    const firstVerse = card.verses[0];
    const [bookId] = firstVerse.verse_code.split('-').map(Number);
    return this.getBookName(bookId);
  }

  getBookName(bookId: number): string {
    const book = this.bibleService.getBibleData().getBookById(bookId);
    return book ? book.name : `Book ${bookId}`;
  }

  getTotalVerseCount(): number {
    return this.deckCards.reduce(
      (total, card) => total + card.verses.length,
      0,
    );
  }

  // Add new card
  addNewCard() {
    // Create a temporary new card and set it as editing
    const tempCardId = -Date.now(); // Negative ID for temporary cards
    const newCard: CardWithVerses = {
      card_id: tempCardId,
      card_type: 'single_verse',
      reference: 'Select verses...',
      verses: [],
      position: this.deckCards.length + 1,
      added_at: new Date().toISOString(),
      confidence_score: undefined, // Changed from null to undefined
    };

    this.deckCards.push(newCard);
  }

  // Bulk operations
  toggleAllCards(event: any) {
    if (event.target.checked) {
    this.deckCards.forEach((card: CardWithVerses) => this.selectedCards.add(card.card_id));
    } else {
      this.selectedCards.clear();
    }
  }

  toggleCardSelection(cardId: number) {
    if (this.selectedCards.has(cardId)) {
      this.selectedCards.delete(cardId);
    } else {
      this.selectedCards.add(cardId);
    }
  }

  async removeCardFromDeck(cardId: number) {
    const card = this.deckCards.find((c: CardWithVerses) => c.card_id === cardId);
    if (!card) return;

    const confirmed = await this.modalService.confirm({
      title: 'Remove Card',
      message: `Are you sure you want to remove "${card.reference}" from the deck?`,
      type: 'warning',
      confirmText: 'Remove',
      showCancel: true,
    });

    if (!confirmed.confirmed) return;

    // If it's a temporary card (negative ID), just remove from array
    if (cardId < 0) {
      this.deckCards = this.deckCards.filter((c: CardWithVerses) => c.card_id !== cardId);
      return;
    }

    this.deckService.removeCardFromDeck(this.deckId, cardId).subscribe({
      next: () => {
        this.deckCards = this.deckCards.filter((c: CardWithVerses) => c.card_id !== cardId);
        this.selectedCards.delete(cardId);
        this.modalService.success(
          'Card Removed',
          'The card has been removed from the deck.',
        );
      },
      error: (error: any) => {
        console.error('Error removing card:', error);
        this.modalService.alert(
          'Error Removing Card',
          'Unable to remove card. Please try again.',
          'danger',
        );
      },
    });
  }

  async removeSelectedCards() {
    if (this.selectedCards.size === 0) return;

    const confirmed = await this.modalService.danger(
      'Remove Selected Cards',
      `Are you sure you want to remove ${this.selectedCards.size} selected card${this.selectedCards.size !== 1 ? 's' : ''} from the deck? This action cannot be undone.`,
      'Remove Cards',
    );

    if (!confirmed) return;

    // Filter out temporary cards
    const cardIds = Array.from(this.selectedCards).filter((id: number) => id > 0);
    const tempCardIds = Array.from(this.selectedCards).filter((id: number) => id < 0);

    // Remove temporary cards immediately
    if (tempCardIds.length > 0) {
      this.deckCards = this.deckCards.filter(
        (c: CardWithVerses) => !tempCardIds.includes(c.card_id),
      );
      tempCardIds.forEach((id: number) => this.selectedCards.delete(id));
    }

    // Remove real cards through API
    if (cardIds.length > 0) {
      this.deckService
        .removeMultipleCardsFromDeck(this.deckId, cardIds)
        .subscribe({
          next: () => {
            this.deckCards = this.deckCards.filter(
              (c: CardWithVerses) => !this.selectedCards.has(c.card_id),
            );
            this.selectedCards.clear();
            this.modalService.success(
              'Cards Removed',
              `${cardIds.length + tempCardIds.length} card${cardIds.length + tempCardIds.length !== 1 ? 's' : ''} removed from the deck.`,
            );
          },
          error: (error: any) => {
            console.error('Error removing cards:', error);
            this.modalService.alert(
              'Error Removing Cards',
              'Unable to remove selected cards. Please try again.',
              'danger',
            );
          },
        });
    } else if (tempCardIds.length > 0) {
      this.modalService.success(
        'Cards Removed',
        `${tempCardIds.length} card${tempCardIds.length !== 1 ? 's' : ''} removed from the deck.`,
      );
    }
  }

  onDragStart(index: number) {
    this.draggedIndex = index;
    this.originalDeckCards = [...this.deckCards];
    this.dropHandled = false;
  }
  onDragOver(index: number, event: DragEvent) {
    event.preventDefault();
    if (this.draggedIndex === null || index === this.draggedIndex) return;
    const [moved] = this.deckCards.splice(this.draggedIndex, 1);
    this.deckCards.splice(index, 0, moved);
    this.draggedIndex = index;
  }

  onDrop(index: number) {
    if (this.draggedIndex === null) return;
    this.dropHandled = true;
    this.draggedIndex = null;
    this.originalDeckCards = null;
    this.saveCardOrder();
  }

  onDragEnd() {
    if (!this.dropHandled && this.originalDeckCards) {
      this.deckCards = this.originalDeckCards;
    }
    this.draggedIndex = null;
    this.originalDeckCards = null;
  }

  saveCardOrder() {
    const ids = this.deckCards
      .filter((c: CardWithVerses) => c.card_id > 0)
      .map((c: CardWithVerses) => c.card_id);
    this.deckService.reorderDeckCards(this.deckId, ids).subscribe();
  }

  goBack() {
    this.router.navigate(['/decks']);
  }
}
