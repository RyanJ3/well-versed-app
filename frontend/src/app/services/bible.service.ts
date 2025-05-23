import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { BibleData, UserVerseDetail } from '../models/bible';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  private apiUrl = environment.apiUrl;
  private bibleData: BibleData;
  private isBrowser: boolean;
  
  private preferencesSubject = new BehaviorSubject<{includeApocrypha: boolean}>({
    includeApocrypha: false
  });
  
  public preferences$ = this.preferencesSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.bibleData = new BibleData();
  }

  getBibleData(): BibleData {
    return this.bibleData;
  }

  updateUserPreferences(includeApocrypha: boolean): void {
    this.bibleData.includeApocrypha = includeApocrypha;
    this.preferencesSubject.next({ includeApocrypha });
  }

  getUserVerses(userId: number, includeApocrypha?: boolean): Observable<UserVerseDetail[]> {
    let params = new HttpParams();
    if (includeApocrypha !== undefined) {
      params = params.set('include_apocrypha', includeApocrypha.toString());
    }

    const endpoint = `${this.apiUrl}/user-verses/${userId}`;
    
    return this.http.get<UserVerseDetail[]>(endpoint, { params }).pipe(
      tap(verses => {
        console.log(`Loaded ${verses?.length || 0} verses`);
        this.bibleData.mapUserVersesToModel(verses);
      }),
      catchError(error => {
        console.error('Error loading verses:', error);
        return of([]);
      })
    );
  }

  /**
   * Save or update a single verse
   */
  saveVerse(userId: number, bookId: string, chapterNum: number, verseNum: number, practiceCount: number): Observable<any> {
    const verseId = `${bookId}-${chapterNum}-${verseNum}`;
    console.log(`Saving verse: ${verseId}, practice_count: ${practiceCount}`);
    
    // If practice count is 0, delete the verse
    if (practiceCount === 0) {
      return this.deleteVerse(userId, verseId);
    }
    
    // Otherwise, save/update the verse
    const payload = { 
      practice_count: practiceCount,
      last_practiced: new Date().toISOString()
    };
    
    return this.http.put(`${this.apiUrl}/user-verses/${userId}/${verseId}`, payload).pipe(
      tap(response => console.log('Verse saved:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error saving verse:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a verse (unmemorize)
   */
  deleteVerse(userId: number, verseId: string): Observable<any> {
    console.log(`Deleting verse: ${verseId}`);
    
    return this.http.delete(`${this.apiUrl}/user-verses/${userId}/${verseId}`).pipe(
      tap(response => console.log('Verse deleted:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting verse:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Save all verses in a chapter as memorized
   */
  saveChapter(userId: number, bookId: string, chapterNum: number): Observable<any> {
    console.log(`Saving chapter: ${bookId} ${chapterNum}`);
    
    return this.http.post(`${this.apiUrl}/user-verses/${userId}/chapters/${bookId}/${chapterNum}`, {}).pipe(
      tap(response => console.log('Chapter saved:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error saving chapter:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Save all verses in a book as memorized
   */
  saveBook(userId: number, bookId: string): Observable<any> {
    console.log(`Saving book: ${bookId}`);
    
    return this.http.post(`${this.apiUrl}/user-verses/${userId}/books/${bookId}`, {}).pipe(
      tap(response => console.log('Book saved:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error saving book:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear all memorized verses in a chapter
   */
  clearChapter(userId: number, bookId: string, chapterNum: number): Observable<any> {
    console.log(`Clearing chapter: ${bookId} ${chapterNum}`);
    
    return this.http.delete(`${this.apiUrl}/user-verses/${userId}/chapters/${bookId}/${chapterNum}`).pipe(
      tap(response => console.log('Chapter cleared:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error clearing chapter:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear all memorized verses in a book
   */
  clearBook(userId: number, bookId: string): Observable<any> {
    console.log(`Clearing book: ${bookId}`);
    
    return this.http.delete(`${this.apiUrl}/user-verses/${userId}/books/${bookId}`).pipe(
      tap(response => console.log('Book cleared:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error clearing book:', error);
        return throwError(() => error);
      })
    );
  }
}