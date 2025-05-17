// frontend/src/app/services/bible.service.ts

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { BibleData, UserVerseDetail } from '../models/bible.model';
import { environment } from '../../environments';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  private apiUrl = environment.apiUrl;
  private bibleData: BibleData;
  private isBrowser: boolean;
  private backendAvailable: boolean = false;
  
  // Add a BehaviorSubject to notify subscribers when preferences change
  private preferencesSubject = new BehaviorSubject<{includeApocrypha: boolean}>({
    includeApocrypha: false
  });
  
  // Public observable that components can subscribe to
  public preferences$ = this.preferencesSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    console.log(`BibleService initialized. API URL: ${this.apiUrl}, Browser environment: ${this.isBrowser}`);
    this.bibleData = new BibleData();

    // Only try API connection from browser
    if (this.isBrowser) {
      console.log('Running in browser, checking backend availability...');
      this.checkBackendAvailability();
    } else {
      console.log('Not running in browser, skipping backend check');
    }
  }

  getBibleData(): BibleData {
    return this.bibleData;
  }

  // Updated method to notify of preference changes
  updateUserPreferences(includeApocrypha: boolean): void {
    console.log(`BibleService: Updating preferences - includeApocrypha=${includeApocrypha}`);
    
    // Check if there's an actual change
    const needsUpdate = this.bibleData.includeApocrypha !== includeApocrypha;
    console.log(`Preference change detected: ${needsUpdate}`);
    
    if (needsUpdate) {
      // Update the Bible data model
      this.bibleData.includeApocrypha = includeApocrypha;
      
      // Force a complete reload and refresh of the Bible data
      console.log('Forcing complete reload of Bible data with new preferences');
      
      // First reload all books from the original data source
      if (typeof this.bibleData.reloadAllBooks === 'function') {
        this.bibleData.reloadAllBooks();
      } else {
        // Fallback to just refreshing based on settings
        this.bibleData.refreshBooksBasedOnSettings();
      }
      
      // Notify subscribers about the change
      this.preferencesSubject.next({
        includeApocrypha: includeApocrypha
      });
    }
  }

  private checkBackendAvailability(): void {
    // Check the root endpoint, not /api
    const rootUrl = this.apiUrl.replace('/api', '');

    console.log('Checking backend availability at:', rootUrl);

    this.http.get(rootUrl).pipe(
      tap(response => {
        console.log('Backend response:', response);
        this.backendAvailable = true;
      }),
      catchError(error => {
        console.error('Backend unavailable - Error details:', error);
        this.backendAvailable = false;
        return of(null);
      })
    ).subscribe();
  }

  // Updated getUserVerses to include the includeApocrypha parameter
  getUserVerses(userId: number, includeApocrypha?: boolean): Observable<UserVerseDetail[]> {
    // Build the API endpoint with the includeApocrypha parameter
    let params = new HttpParams();
    if (includeApocrypha !== undefined) {
      // Ensure it's a proper boolean string
      const apocryphaValue = includeApocrypha === true ? 'true' : 'false';
      params = params.set('include_apocrypha', apocryphaValue);
    }

    const endpoint = `${this.apiUrl}/user-verses/${userId}`;
    console.log(`Requesting verses from: ${endpoint} with includeApocrypha=${includeApocrypha}`);
    console.log(`Query params: ${params.toString()}`);

    // If includeApocrypha is provided, update frontend preferences
    if (includeApocrypha !== undefined) {
      this.updateUserPreferences(includeApocrypha);
    }

    return this.http.get<UserVerseDetail[]>(endpoint, { params }).pipe(
      tap(verses => {
        console.log(`Received ${verses?.length || 0} verses from API`);
        if (verses && verses.length > 0) {
          // Log a sample of the response for debugging
          console.log('Sample verse response:', verses[0]);
        }
      }),
      tap(verses => this.bibleData.mapUserVersesToModel(verses)),
      catchError(error => {
        console.error('API ERROR:', error);
        // Throw the error instead of returning empty list
        throw error;
      })
    );
  }

  saveVerse(userId: number, bookId: string, chapterNum: number, verseNum: number, practiceCount: number): Observable<any> {
    console.log(`Attempting to save verse - Book: ${bookId}, Chapter: ${chapterNum}, Verse: ${verseNum}`);

    const verseId = `${bookId}-${chapterNum}-${verseNum}`;
    const payload = { user_id: userId, verse_id: verseId, practice_count: practiceCount };

    // Even if backend was previously detected as unavailable, try again
    return this.http.put(`${this.apiUrl}/user-verses/${userId}/${verseId}`, payload).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          // Verse doesn't exist, try to create it
          return this.http.post(`${this.apiUrl}/user-verses/`, payload);
        }
        // Handle offline mode - store locally
        console.log('Backend unavailable, storing verse locally for later sync');
        this.storeOfflineVerse(payload);
        return of({ success: true, offline: true });
      })
    );
  }

  // Method to support offline storage
  private storeOfflineVerse(verseData: any): void {
    if (!this.isBrowser) return;

    let pendingVerses: any[] = [];
    const stored = localStorage.getItem('pendingVerses');
    if (stored) {
      try {
        pendingVerses = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored verses:', e);
      }
    }

    // Add current verse to pending list
    pendingVerses.push({
      ...verseData,
      timestamp: new Date().toISOString()
    });

    // Store back to localStorage
    localStorage.setItem('pendingVerses', JSON.stringify(pendingVerses));
  }

  // Method to sync offline verses when backend becomes available
  syncOfflineVerses(): Observable<any> {
    if (!this.isBrowser || !this.backendAvailable) {
      return of({ success: false });
    }

    const stored = localStorage.getItem('pendingVerses');
    if (!stored) {
      return of({ success: true, noChanges: true });
    }

    try {
      const pendingVerses = JSON.parse(stored);
      if (pendingVerses.length === 0) {
        return of({ success: true, noChanges: true });
      }

      // Process each verse
      // This is simplified - in a real app, you'd want to handle partial success
      console.log(`Syncing ${pendingVerses.length} offline verses`);

      // For simplicity, just clear the storage
      localStorage.removeItem('pendingVerses');
      return of({ success: true, syncedCount: pendingVerses.length });

    } catch (e) {
      console.error('Error syncing offline verses:', e);
      return of({ success: false, error: e });
    }
  }

  // Updated saveVersesBulk to also pass the include_apocrypha parameter if needed
  saveVersesBulk(
    userId: number, 
    bookId: string, 
    chapterNum: number,
    verseNums: number[], 
    practiceCount: number
  ): Observable<any> {
    
    console.log(`Saving verses in bulk - User: ${userId}, Book: ${bookId}, Chapter: ${chapterNum}, Verses: ${verseNums.length}`);
    
    const payload = {
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNum,
      verse_numbers: verseNums,
      practice_count: practiceCount,
      last_practiced: new Date()
    };

    return this.http.post(`${this.apiUrl}/user-verses/bulk`, payload).pipe(
      tap(response => console.log('Bulk save response:', response)),
      catchError((error) => {
        console.error('Error saving verses in bulk:', error);
        
        // Store locally for offline mode
        if (!this.backendAvailable) {
          console.log('Backend unavailable, storing bulk verses locally');
          verseNums.forEach(verseNum => {
            const verseId = `${bookId}-${chapterNum}-${verseNum}`;
            this.storeOfflineVerse({
              user_id: userId,
              verse_id: verseId,
              practice_count: practiceCount,
              last_practiced: new Date()
            });
          });
          return of({ success: true, offline: true, count: verseNums.length });
        }
        
        return of({ success: false, error });
      })
    );
  }

  // Method to support Promise-based operations
  saveVersesBulkWithPromise(
    userId: number, 
    bookId: string, 
    chapterNum: number, 
    verseNums: number[], 
    practiceCount: number
  ): Promise<any> {
    return this.saveVersesBulk(userId, bookId, chapterNum, verseNums, practiceCount).toPromise();
  }

  /**
   * Logs all book IDs for debugging purposes
   * Call this method during component initialization to verify book ID mappings
   */
  logBookIdMappings(): void {
    console.log('=== Book ID Mappings ===');
    const bibleData = this.getBibleData();
    const books = bibleData.books;
    
    // Create a sorted list for easier reference
    const mappings = books.map(book => ({
      name: book.name,
      id: book.id,
      chapters: book.chapters.length
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    // Log each book with its ID and chapter count
    mappings.forEach(book => {
      console.log(`${book.name.padEnd(20)}: ${book.id.padEnd(5)} (${book.chapters} chapters)`);
    });
    
    // Log single-chapter books separately for reference
    console.log('\n=== Single Chapter Books ===');
    const singleChapterBooks = mappings.filter(book => book.chapters === 1);
    singleChapterBooks.forEach(book => {
      console.log(`${book.name.padEnd(20)}: ${book.id}`);
    });
    
    console.log('=====================');
  }
}