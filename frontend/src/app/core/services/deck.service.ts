// frontend/src/app/services/deck.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {}

  createDeck(deck: DeckCreate): Observable<DeckResponse> {
    return this.http.post<DeckResponse>(this.apiUrl, deck);
  }

  getUserDecks(userId: number): Observable<DeckListResponse> {
    return this.http.get<DeckListResponse>(`${this.apiUrl}/user/${userId}`);
  }

  getPublicDecks(
    skip: number = 0,
    limit: number = 20,
  ): Observable<DeckListResponse> {
    return this.http.get<DeckListResponse>(
      `${this.apiUrl}/public?skip=${skip}&limit=${limit}`,
    );
  }

  getDeck(deckId: number): Observable<DeckResponse> {
    return this.http.get<DeckResponse>(`${this.apiUrl}/${deckId}`);
  }

  getDeckCards(
    deckId: number,
    userId: number,
    bibleId?: string,
  ): Observable<DeckCardsResponse> {
    let url = `${this.apiUrl}/${deckId}/verses?user_id=${userId}`;
    if (bibleId) {
      url += `&bible_id=${bibleId}`;
    }
    return this.http.get<DeckCardsResponse>(url);
  }

  addVersesToDeck(
    deckId: number,
    verseCodes: string[],
    reference?: string,
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/${deckId}/verses`, {
      verse_codes: verseCodes,
      reference: reference,
    });
  }

  removeCardFromDeck(deckId: number, cardId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${deckId}/cards/${cardId}`);
  }

  removeMultipleCardsFromDeck(
    deckId: number,
    cardIds: number[],
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${deckId}/cards/remove-multiple`,
      cardIds,
    );
  }

  reorderDeckCards(deckId: number, cardIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${deckId}/cards/reorder`, cardIds);
  }

  updateDeck(deckId: number, updates: any): Observable<DeckResponse> {
    return this.http.put<DeckResponse>(`${this.apiUrl}/${deckId}`, updates);
  }

  deleteDeck(deckId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${deckId}`);
  }

  // Saved deck methods
  getSavedDecks(userId: number): Observable<DeckListResponse> {
    return this.http.get<DeckListResponse>(`${this.apiUrl}/saved/${userId}`);
  }

  saveDeck(deckId: number, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${deckId}/save`, { user_id: userId });
  }

  unsaveDeck(deckId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${deckId}/save/${userId}`);
  }
}
