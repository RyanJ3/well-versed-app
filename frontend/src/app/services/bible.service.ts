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
    console.log(`BibleService initialized with API URL: ${this.apiUrl}`);
    this.bibleData = new BibleData();
    
    // Only try API connection from browser
    if (this.isBrowser) {
      this.checkBackendAvailability();
    }
  }
  
  getBibleData(): BibleData {
    return this.bibleData;
  }

  private checkBackendAvailability(): void {
    // Check the root endpoint, not /api
    const rootUrl = this.apiUrl.replace('/api', '');
    
    this.http.get(rootUrl).pipe(
      tap(response => {
        console.log('Backend is available:', response);
        this.backendAvailable = true;
      }),
      catchError(error => {
        console.error('Backend unavailable:', error);
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

  saveVerse(userId: number, bookId: string, chapterNum: number, verseNum: number, confidence: number): Observable<any> {
    if (!this.backendAvailable) {
      console.warn('Backend unavailable, verse changes will not be saved');
      return of({ success: false, reason: 'offline' });
    }
    
    const verseId = `${bookId}-${chapterNum}-${verseNum}`;
    const payload = { user_id: userId, verse_id: verseId, confidence };
    
    // First try PUT (update)
    return this.http.put(`${this.apiUrl}/user-verses/${userId}/${verseId}`, payload).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          // If verse doesn't exist, create it with POST
          return this.http.post(`${this.apiUrl}/user-verses/`, payload);
        }
        return throwError(() => error);
      }),
      catchError(error => {
        console.error('Failed to save verse:', error);
        return of({ success: false, error });
      })
    );
  }
}