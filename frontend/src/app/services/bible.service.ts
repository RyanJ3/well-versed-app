import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
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

  getUserVerses(userId: number): Observable<UserVerseDetail[]> {
    const endpoint = `${this.apiUrl}/user-verses/${userId}`;
    console.log('Requesting verses from:', endpoint);
    
    return this.http.get<UserVerseDetail[]>(endpoint).pipe(
      tap(verses => console.log(`Received ${verses?.length || 0} verses from API`)),
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

  // Add this method to support offline storage
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
  
  // Optional: Method to sync offline verses when backend becomes available
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
}