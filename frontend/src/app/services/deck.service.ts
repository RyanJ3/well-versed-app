// frontend/src/app/services/deck.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DeckCreate {
  name: string;
  description?: string;
  is_public: boolean;
  verse_codes?: string[];
  tags?: string[];
}

export interface DeckUpdate {
  name?: string;
  description?: string;
  is_public?: boolean;
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
  verse_count: number;
  tags: string[];
  is_saved: boolean;
}

export interface DeckDetailResponse extends DeckResponse {
  verses: any[];
}

export interface DeckListResponse {
  total: number;
  decks: DeckResponse[];
}

export interface DeckProgressResponse {
  deck_id: number;
  deck_name: string;
  total_verses: number;
  memorized_verses: number;
  progress_percentage: number;
  confidence_breakdown: Record<number, number>;
}

export interface VerseWithText {
  verse_id: number;
  verse_code: string;
  book_id: number;
  book_name: string;
  chapter_number: number;
  verse_number: number;
  reference: string;
  text: string;
  confidence_score?: number;
  last_reviewed?: string;
}

export interface DeckVersesResponse {
  deck_id: number;
  deck_name: string;
  total_verses: number;
  verses: VerseWithText[];
}

export interface DeckDetailResponse extends DeckResponse {
  verses: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DeckService {
  private apiUrl = `${environment.apiUrl}/decks`;

  constructor(private http: HttpClient) {}

  // CRUD operations
  createDeck(deck: DeckCreate): Observable<DeckResponse> {
    return this.http.post<DeckResponse>(this.apiUrl, deck);
  }

  getDeck(deckId: number): Observable<DeckDetailResponse> {
    return this.http.get<DeckDetailResponse>(`${this.apiUrl}/${deckId}`);
  }

  updateDeck(deckId: number, updates: DeckUpdate): Observable<DeckResponse> {
    return this.http.put<DeckResponse>(`${this.apiUrl}/${deckId}`, updates);
  }

  deleteDeck(deckId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${deckId}`);
  }

  // User decks
  getUserDecks(userId: number): Observable<DeckListResponse> {
    return this.http.get<DeckListResponse>(`${this.apiUrl}/user/${userId}`);
  }

  // Public decks
  getPublicDecks(skip = 0, limit = 20, tag?: string): Observable<DeckListResponse> {
    let url = `${this.apiUrl}/public?skip=${skip}&limit=${limit}`;
    if (tag) {
      url += `&tag=${encodeURIComponent(tag)}`;
    }
    return this.http.get<DeckListResponse>(url);
  }

  // Save/unsave
  saveDeck(deckId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${deckId}/save`, {});
  }

  unsaveDeck(deckId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${deckId}/save`);
  }

  getSavedDecks(userId: number): Observable<DeckListResponse> {
    return this.http.get<DeckListResponse>(`${this.apiUrl}/saved/${userId}`);
  }

// Verse management
  addVersesToDeck(deckId: number, verseCodes: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${deckId}/verses`, verseCodes);
  }

  removeVersesFromDeck(deckId: number, verseCodes: string[]): Observable<any> {
    if (verseCodes.length === 1) {
      // Use single verse removal endpoint
      return this.http.delete(`${this.apiUrl}/${deckId}/verses/${verseCodes[0]}`);
    } else {
      // Use multiple verse removal endpoint
      return this.http.post(`${this.apiUrl}/${deckId}/verses/remove-multiple`, verseCodes);
    }
  }

  reorderDeckVerses(deckId: number, verseOrders: any[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/${deckId}/verses/order`, { verse_orders: verseOrders });
  }

  // Progress
  getDeckProgress(deckId: number): Observable<DeckProgressResponse> {
    return this.http.get<DeckProgressResponse>(`${this.apiUrl}/${deckId}/progress`);
  }

  // Get deck verses with text
  getDeckVerses(deckId: number, userId: number): Observable<DeckVersesResponse> {
    return this.http.get<DeckVersesResponse>(`${this.apiUrl}/${deckId}/verses?user_id=${userId}`);
  }
}