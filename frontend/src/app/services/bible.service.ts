// bible.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { BibleData, UserVerseDetail } from '../models/bible.model';
import BIBLE_DATA from '../models/bible_base_data.json';

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  // Change localhost to your backend service name in docker-compose
  private apiUrl = 'http://backend:8000/api'; 
  private bibleData: BibleData;
  private useMockData = true; // Enable mock data until backend is reachable
  
  constructor(private http: HttpClient) {
    console.log(`BibleService initialized with API URL: ${this.apiUrl}`);
    // Make sure you're passing the proper data to BibleData constructor
    this.bibleData = new BibleData();
    
    // Once mock verses are loaded, update them in the model
    if (this.useMockData) {
      console.log('Pre-loading mock verses');
      const mockVerses = this.getMockUserVerses();
      this.bibleData.mapUserVersesToModel(mockVerses);
    }
  }
  
  // Add this method to initialize the full Bible structure
  private initializeMockBibleData(): void {
    // Create at least Genesis structure for the UI
    interface MockBibleStructure {
      [bookName: string]: {
        [chapterNum: number]: number[];
      }
    }
    
    const mockStructure: MockBibleStructure = {
      "Genesis": {
        1: [31], // Chapter 1 has 31 verses
        2: [25],
        3: [24],
        // Add more chapters as needed...
        50: [26] // Last chapter
      }
    };
    
    // Apply to BibleData structure
    Object.keys(mockStructure).forEach(bookName => {
      const book = this.bibleData.getBookByName(bookName);
      if (book) {
        Object.keys(mockStructure[bookName]).forEach(chapterNum => {
          const chapterNumber = parseInt(chapterNum);
          if (chapterNumber > 0 && chapterNumber <= book.chapters.length) {
            console.log(`Initializing ${bookName} chapter ${chapterNumber}`);
          }
        });
      }
    });
    
    // Pre-map the mock verses
    const mockVerses = this.getMockUserVerses();
    this.bibleData.mapUserVersesToModel(mockVerses);
  }
  getBibleData(): BibleData {
    return this.bibleData;
  }

  getUserVerses(userId: number): Observable<UserVerseDetail[]> {
    console.log(`Fetching verses for user: ${userId}`);
    
    if (this.useMockData) {
      console.log('Using mock data as backend is unavailable');
      return of(this.getMockUserVerses()).pipe(
        tap(verses => {
          console.log(`Generated ${verses.length} mock verses`);
          this.bibleData.mapUserVersesToModel(verses);
        })
      );
    }
    
    return this.http.get<UserVerseDetail[]>(`${this.apiUrl}/user-verses/${userId}`).pipe(
      tap(verses => console.log(`Received ${verses?.length || 0} verses from API`)),
      tap(verses => this.bibleData.mapUserVersesToModel(verses)),
      catchError(error => {
        console.error('Error fetching user verses:', error);
        console.log('Falling back to mock data');
        const mockVerses = this.getMockUserVerses();
        this.bibleData.mapUserVersesToModel(mockVerses);
        return of(mockVerses);
      })
    );
  }

  saveVerse(userId: number, bookId: string, chapterNum: number, verseNum: number, confidence: number): Observable<any> {
    const verseId = `${bookId}-${chapterNum}-${verseNum}`;
    console.log(`Saving verse ${verseId} with confidence ${confidence}`);
    
    if (this.useMockData) {
      // Update local model without API call
      return of({ success: true }).pipe(
        tap(() => {
          const book = this.bibleData.getBookById(bookId);
          if (book && book.chapters.length >= chapterNum) {
            const chapter = book.getChapter(chapterNum);
            if (chapter && chapter.verses.length >= verseNum) {
              const verse = chapter.verses[verseNum - 1];
              verse.confidence = confidence;
              verse.memorized = confidence >= 500;
              verse.lastPracticed = new Date();
              verse.practiceCount++;
            }
          }
        })
      );
    }
    
    // Original API call logic
    const payload = { user_id: userId, verse_id: verseId, confidence };
    
    return this.http.get<UserVerseDetail[]>(`${this.apiUrl}/user-verses/${userId}`).pipe(
      map(verses => verses.some(v => v.verse.verse_id === verseId)),
      switchMap(exists => {
        if (exists) {
          return this.http.put(`${this.apiUrl}/user-verses/${userId}/${verseId}`, payload);
        } else {
          return this.http.post(`${this.apiUrl}/user-verses/`, payload);
        }
      }),
      catchError(error => {
        console.error('Error saving verse:', error);
        return of({ success: false, error });
      })
    );
  }

  // Create mock user verses for development/testing
  private getMockUserVerses(): UserVerseDetail[] {
    return [
      this.createMockVerse('GEN', 1, 1, 950, 45),
      this.createMockVerse('GEN', 1, 26, 870, 32),
      this.createMockVerse('GEN', 3, 15, 780, 28),
      this.createMockVerse('GEN', 12, 1, 850, 30),
      this.createMockVerse('GEN', 22, 18, 650, 18),
      this.createMockVerse('GEN', 50, 20, 720, 22)
    ];
  }

  private createMockVerse(bookId: string, chapter: number, verse: number, confidence: number, practiceCount: number): UserVerseDetail {
    const now = new Date();
    const lastPracticed = new Date(now);
    lastPracticed.setDate(now.getDate() - Math.floor(Math.random() * 7));
    
    return {
      verse: {
        verse_id: `${bookId}-${chapter}-${verse}`,
        book_id: bookId,
        chapter_number: chapter,
        verse_number: verse,
        confidence: 0,
        practiceCount: 0,
        verseNumber: 0,
        memorized: false,
        toggle: function (): boolean {
          throw new Error('Function not implemented.');
        },
        chapter: undefined,
        book: undefined,
        reference: ''
      },
      confidence: confidence,
      practice_count: practiceCount,
      last_practiced: lastPracticed,
      created_at: new Date(2025, 0, 15)
    };
  }
}