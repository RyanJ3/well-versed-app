// frontend/src/app/services/deck.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Deck,
  Card,
  CreateDeckRequest,
  CreateCardRequest,
  UpdateDeckRequest,
  StudySessionResult,
  ImportDeckRequest,
} from '../../state/decks/models/deck.model';

export interface DeckCreate {
  name: string;
  description?: string;
  is_public: boolean;
  verse_codes?: string[];
  tags?: string[];
}

export interface DeckResponse {
  deck_id: number;
  creator_id: number;
  creator_name: string;
  name: string;
  description?: string;
  is_public: boolean;
  save_count: number;
  created_at: string;
  updated_at: string;
  card_count: number; // Changed from verse_count
  tags: string[];
  is_saved: boolean;
}

export interface DeckListResponse {
  total: number;
  decks: DeckResponse[];
}

// Card-related interfaces
export interface VerseInCard {
  verse_id: number;
  verse_code: string;
  book_id: number;
  book_name: string;
  chapter_number: number;
  verse_number: number;
  reference: string;
  text: string;
  verse_order: number;
}

export interface CardWithVerses {
  card_id: number;
  card_type: string;
  reference: string;
  verses: VerseInCard[];
  position: number;
  added_at: string;
  confidence_score?: number;
  last_reviewed?: string;
}

export interface DeckCardsResponse {
  deck_id: number;
  deck_name: string;
  total_cards: number;
  cards: CardWithVerses[];
}

@Injectable({
  providedIn: 'root',
})
export class DeckService {
  private apiUrl = `${environment.apiUrl}/decks`;
  /** Normalize provided user id, falling back to 1 if invalid */
  private normalizeUserId(id: any): number {
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }

  constructor(private http: HttpClient) {}

  createDeck(deck: DeckCreate): Observable<DeckResponse>;
  createDeck(request: CreateDeckRequest): Observable<Deck>;
  createDeck(arg: DeckCreate | CreateDeckRequest): Observable<DeckResponse | Deck> {
    if ('is_public' in arg) {
      console.log('Creating deck', arg);
      return this.http.post<DeckResponse>(this.apiUrl, arg).pipe(
        tap(res => console.log('Deck created', res)),
        catchError(err => {
          console.error('Error creating deck', err);
          throw err;
        })
      );
    }
    // Placeholder implementation for NgRx state management
    return of({} as Deck);
  }

  getUserDecks(userId: number): Observable<DeckListResponse> {
    const uid = this.normalizeUserId(userId);
    console.log(`Fetching decks for user ${uid}`);
    return this.http.get<DeckListResponse>(`${this.apiUrl}/my-decks`).pipe(
      tap(res => console.log(`Loaded ${res.decks.length} user decks`)),
      catchError(err => {
        console.error('Error loading user decks', err);
        throw err;
      })
    );
  }

  getPublicDecks(
    skip: number = 0,
    limit: number = 20,
  ): Observable<DeckListResponse> {
    console.log(`Fetching public decks skip=${skip} limit=${limit}`);
    return this.http.get<DeckListResponse>(
      `${this.apiUrl}/public?skip=${skip}&limit=${limit}`,
    ).pipe(
      tap(res => console.log(`Loaded ${res.decks.length} public decks`)),
      catchError(err => { console.error('Error loading public decks', err); throw err; })
    );
  }

  getDeck(deckId: number): Observable<DeckResponse> {
    console.log(`Fetching deck ${deckId}`);
    return this.http.get<DeckResponse>(`${this.apiUrl}/${deckId}`).pipe(
      tap(res => console.log('Loaded deck', res)),
      catchError(err => { console.error('Error loading deck', err); throw err; })
    );
  }

  getDeckCards(
    deckId: number,
    userId: number,
    bibleId?: string,
  ): Observable<DeckCardsResponse> {
    let url = `${this.apiUrl}/${deckId}/cards`;
    if (bibleId) {
      url += `?bible_id=${bibleId}`;
    }
    console.log(`Fetching cards for deck ${deckId}`);
    return this.http.get<DeckCardsResponse>(url).pipe(
      tap(res => console.log(`Loaded ${res.total_cards} cards`)),
      catchError(err => { console.error('Error loading deck cards', err); throw err; })
    );
  }

  addVersesToDeck(
    deckId: number,
    verseCodes: string[],
    reference?: string,
  ): Observable<any> {
    console.log(`Adding ${verseCodes.length} verses to deck ${deckId}`);
    return this.http.post(`${this.apiUrl}/${deckId}/cards`, {
      verse_codes: verseCodes,
      reference: reference,
    }).pipe(
      tap(() => console.log('Verses added to deck')),
      catchError(err => { console.error('Error adding verses', err); throw err; })
    );
  }

  removeCardFromDeck(deckId: number, cardId: number): Observable<any> {
    console.log(`Removing card ${cardId} from deck ${deckId}`);
    return this.http.delete(`${this.apiUrl}/${deckId}/cards/${cardId}`).pipe(
      tap(() => console.log('Card removed')),
      catchError(err => { console.error('Error removing card', err); throw err; })
    );
  }

  removeMultipleCardsFromDeck(
    deckId: number,
    cardIds: number[],
  ): Observable<any> {
    console.log(`Removing ${cardIds.length} cards from deck ${deckId}`);
    return this.http.post(
      `${this.apiUrl}/${deckId}/cards/remove-multiple`,
      cardIds,
    ).pipe(
      tap(() => console.log('Cards removed')),
      catchError(err => { console.error('Error removing cards', err); throw err; })
    );
  }

  reorderDeckCards(deckId: number, cardIds: number[]): Observable<any> {
    console.log(`Reordering cards for deck ${deckId}`);
    return this.http.post(`${this.apiUrl}/${deckId}/cards/reorder`, cardIds).pipe(
      tap(() => console.log('Cards reordered')),
      catchError(err => { console.error('Error reordering cards', err); throw err; })
    );
  }

  updateDeck(deckId: number, updates: any): Observable<DeckResponse> {
    console.log(`Updating deck ${deckId}`);
    return this.http.put<DeckResponse>(`${this.apiUrl}/${deckId}`, updates).pipe(
      tap(res => console.log('Deck updated', res)),
      catchError(err => { console.error('Error updating deck', err); throw err; })
    );
  }

  deleteDeck(deckId: number): Observable<any> {
    console.log(`Deleting deck ${deckId}`);
    return this.http.delete(`${this.apiUrl}/${deckId}`).pipe(
      tap(() => console.log('Deck deleted')),
      catchError(err => { console.error('Error deleting deck', err); throw err; })
    );
  }

  // Saved deck methods
  getSavedDecks(userId: number): Observable<DeckListResponse> {
    const uid = this.normalizeUserId(userId);
    console.log(`Fetching saved decks for user ${uid}`);
    return this.http.get<DeckListResponse>(`${this.apiUrl}/saved/${uid}`).pipe(
      tap(res => console.log(`Loaded ${res.decks.length} saved decks`)),
      catchError(err => { console.error('Error loading saved decks', err); throw err; })
    );
  }

  saveDeck(deckId: number, userId: number): Observable<any> {
    const uid = this.normalizeUserId(userId);
    console.log(`Saving deck ${deckId} for user ${uid}`);
    return this.http.post(`${this.apiUrl}/${deckId}/save`, { user_id: uid }).pipe(
      tap(() => console.log('Deck saved')),
      catchError(err => { console.error('Error saving deck', err); throw err; })
    );
  }

  unsaveDeck(deckId: number, userId: number): Observable<any> {
    const uid = this.normalizeUserId(userId);
    console.log(`Unsaving deck ${deckId} for user ${uid}`);
    return this.http.delete(`${this.apiUrl}/${deckId}/save/${uid}`).pipe(
      tap(() => console.log('Deck unsaved')),
      catchError(err => { console.error('Error unsaving deck', err); throw err; })
    );
  }

  // --- Additional helper methods used in NgRx effects ---
  getDecks(): Observable<Deck[]> {
    return of([]);
  }

  getCards(deckId: number): Observable<Card[]> {
    return of([]);
  }

  createCard(deckId: number, card: CreateCardRequest): Observable<Card> {
    return of({} as Card);
  }

  toggleFavorite(deckId: number): Observable<boolean> {
    return of(false);
  }

  importDeck(request: ImportDeckRequest): Observable<{ deck: Deck; cardsImported: number }> {
    return of({ deck: {} as Deck, cardsImported: 0 });
  }

  completeStudySession(result: StudySessionResult): Observable<Partial<Deck>> {
    return of({});
  }
}
