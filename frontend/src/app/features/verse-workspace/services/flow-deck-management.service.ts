import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DeckService, DeckResponse, DeckCreate } from '@services/api/deck.service';
import { NotificationService } from '@services/utils/notification.service';
import { Router } from '@angular/router';
import { FlowVerse } from '../models/flow.models';
import { BibleBook } from '@models/bible';

export interface DeckManagementState {
  decks: DeckResponse[];
  deckNames: string[];
  showCreateModal: boolean;
  createLoading: boolean;
  pendingVersesToAdd: string[];
}

@Injectable()
export class FlowDeckManagementService {
  private deckState = new BehaviorSubject<DeckManagementState>({
    decks: [],
    deckNames: [],
    showCreateModal: false,
    createLoading: false,
    pendingVersesToAdd: []
  });

  public readonly state$ = this.deckState.asObservable();
  private destroy$ = new Subject<void>();
  
  constructor(
    private deckService: DeckService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  get currentState(): DeckManagementState {
    return this.deckState.value;
  }

  get decks(): DeckResponse[] {
    return this.deckState.value.decks;
  }

  get deckNames(): string[] {
    return this.deckState.value.deckNames;
  }

  loadUserDecks(userId: number): void {
    if (!userId) return;
    
    this.deckService.getUserDecks(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const deckNames = response.decks.length > 0 
            ? response.decks.map(deck => deck.name)
            : ['Create a deck first'];
          
          this.updateState({
            decks: response.decks,
            deckNames: deckNames
          });
          
          console.log('Loaded flashcard decks:', deckNames);
        },
        error: (error) => {
          console.error('Error loading flashcard decks:', error);
          this.updateState({
            decks: [],
            deckNames: []
          });
        }
      });
  }

  openCreateDeckModal(versesToAdd: string[]): void {
    this.updateState({
      pendingVersesToAdd: versesToAdd,
      showCreateModal: true
    });
  }

  closeCreateDeckModal(): void {
    this.updateState({
      showCreateModal: false,
      createLoading: false,
      pendingVersesToAdd: []
    });
  }

  createDeck(deckData: DeckCreate, verses: FlowVerse[], currentBook: BibleBook | null, userId: number): void {
    this.updateState({ createLoading: true });
    
    this.deckService.createDeck(deckData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdDeck) => {
          console.log('Deck created successfully:', createdDeck);
          
          // If there are pending verses to add, add them to the new deck
          if (this.deckState.value.pendingVersesToAdd.length > 0) {
            this.addVersesToNewDeck(createdDeck, deckData.name, verses, currentBook);
          } else {
            this.notificationService.success(`Deck "${deckData.name}" created successfully!`);
            this.finalizeDeckCreation(userId);
          }
        },
        error: (error) => {
          console.error('Error creating deck:', error);
          this.notificationService.error('Error creating deck. Please try again.');
          this.updateState({ createLoading: false });
        }
      });
  }

  private addVersesToNewDeck(
    createdDeck: DeckResponse, 
    deckName: string, 
    verses: FlowVerse[], 
    currentBook: BibleBook | null
  ): void {
    const pendingVerses = this.deckState.value.pendingVersesToAdd;
    
    // Convert verse codes to actual verse codes and create reference
    const verseCodes = pendingVerses.map(verseId => {
      // If verseId is already a verse code, use it; otherwise find the verse
      if (verseId.includes('-')) {
        return verseId;
      } else {
        const verse = verses.find(v => v.verseCode === verseId);
        return verse ? verse.verseCode : null;
      }
    }).filter(code => code !== null) as string[];

    if (verseCodes.length === 0) {
      this.notificationService.success(`Deck "${deckName}" created successfully!`);
      this.finalizeDeckCreation(createdDeck.creator_id);
      return;
    }

    // Create reference for the verses
    const reference = this.createVerseReference(verseCodes, verses, currentBook);

    // Add verses to the new deck
    this.deckService.addVersesToDeck(createdDeck.deck_id, verseCodes, reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Added ${verseCodes.length} verses to ${deckName}`);
          this.notificationService.success(
            `Deck "${deckName}" created with ${verseCodes.length} verse${verseCodes.length > 1 ? 's' : ''}!`
          );
          this.finalizeDeckCreation(createdDeck.creator_id);
        },
        error: (error) => {
          console.error('Error adding verses to new deck:', error);
          this.notificationService.warning(
            `Deck "${deckName}" created, but failed to add verses. You can add them manually.`
          );
          this.finalizeDeckCreation(createdDeck.creator_id);
        }
      });
  }

  addVersesToDeck(
    deckName: string, 
    versesToAdd: string[], 
    verses: FlowVerse[], 
    currentBook: BibleBook | null
  ): void {
    // Handle case where user needs to create a deck first
    if (deckName === 'Create a deck first') {
      this.router.navigate(['/decks']);
      return;
    }

    // Find the deck by name
    const selectedDeck = this.deckState.value.decks.find(deck => deck.name === deckName);
    if (!selectedDeck) {
      console.error('Deck not found:', deckName);
      return;
    }

    // Convert verse indices/codes to verse codes
    const verseCodes = this.convertToVerseCodes(versesToAdd, verses);
    
    if (verseCodes.length === 0) {
      console.error('No valid verses to add');
      return;
    }

    // Create reference for the verses
    const reference = this.createVerseReference(verseCodes, verses, currentBook);

    // Add verses to the deck
    this.deckService.addVersesToDeck(selectedDeck.deck_id, verseCodes, reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Added ${verseCodes.length} verses to ${deckName}`);
          this.notificationService.success(
            `Added ${verseCodes.length} verse${verseCodes.length > 1 ? 's' : ''} to "${deckName}"!`
          );
        },
        error: (error) => {
          console.error('Error adding verses to deck:', error);
          this.notificationService.error('Failed to add verses to deck. Please try again.');
        }
      });
  }

  private convertToVerseCodes(versesToAdd: string[], verses: FlowVerse[]): string[] {
    // Handle both verse codes and indices
    const verseCodes: string[] = [];
    
    for (const item of versesToAdd) {
      if (item.includes('-')) {
        // Already a verse code
        verseCodes.push(item);
      } else {
        // Try to parse as index
        const index = parseInt(item);
        if (!isNaN(index) && verses[index]) {
          verseCodes.push(verses[index].verseCode);
        }
      }
    }
    
    return verseCodes;
  }

  private createVerseReference(
    verseCodes: string[], 
    verses: FlowVerse[], 
    currentBook: BibleBook | null
  ): string {
    if (verseCodes.length === 0 || !currentBook) return '';
    
    const firstVerseCode = verseCodes[0];
    const lastVerseCode = verseCodes[verseCodes.length - 1];
    const firstVerse = verses.find(v => v.verseCode === firstVerseCode);
    const lastVerse = verses.find(v => v.verseCode === lastVerseCode);
    
    if (!firstVerse || !lastVerse) return '';
    
    if (verseCodes.length === 1) {
      return `${currentBook.name} ${firstVerse.reference}`;
    } else {
      return `${currentBook.name} ${firstVerse.reference}-${lastVerse.reference}`;
    }
  }

  private finalizeDeckCreation(userId: number): void {
    // Clear pending verses
    this.updateState({ pendingVersesToAdd: [] });
    
    // Reload user decks to include the new deck
    this.loadUserDecks(userId);
    
    // Close the modal
    this.closeCreateDeckModal();
  }

  private updateState(partial: Partial<DeckManagementState>): void {
    this.deckState.next({
      ...this.deckState.value,
      ...partial
    });
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}