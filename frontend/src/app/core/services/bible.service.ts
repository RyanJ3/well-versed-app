import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject, Subject } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { BibleData, UserVerseDetail, BibleBook } from '../models/bible';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';
import { BookProgress } from '../../state/bible-tracker/models/bible-tracker.model';

// Bible version tracking for citations
export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  isPublicDomain: boolean;
  copyright?: string;
  copyrightUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  private apiUrl = environment.apiUrl;
  private bibleData: BibleData;
  private isBrowser: boolean;
  private verseTextCache = new Map<string, string>();

  private preferencesSubject = new BehaviorSubject<{ includeApocrypha: boolean }>({
    includeApocrypha: false
  });

  // Emits wait time in seconds when ESV API limits are hit
  private esvRetrySubject = new Subject<number>();
  public esvRetry$ = this.esvRetrySubject.asObservable();

  // Current Bible version for citations
  private currentBibleVersionSubject = new BehaviorSubject<BibleVersion>({
    id: 'de4e12af7f28f599-02',
    name: 'King James Version', 
    abbreviation: 'KJV',
    isPublicDomain: true
  });
  public currentBibleVersion$ = this.currentBibleVersionSubject.asObservable();

  public preferences$ = this.preferencesSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object,
    private notifications: NotificationService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.bibleData = new BibleData();
  }

  getBibleData(): BibleData {
    return this.bibleData;
  }

  getBooks(): Observable<BibleBook[]> {
    return this.http.get<BibleBook[]>(`${this.apiUrl}/books`);
  }

  updateUserPreferences(includeApocrypha: boolean): void {
    this.bibleData.includeApocrypha = includeApocrypha;
    this.preferencesSubject.next({ includeApocrypha });
  }

  /**
   * Return cached texts for the given verse codes if available
   */
  getCachedVerseTexts(verseCodes: string[]): Record<string, string> | null {
    if (verseCodes.every((c) => this.verseTextCache.has(c))) {
      const result: Record<string, string> = {};
      verseCodes.forEach((c) => {
        result[c] = this.verseTextCache.get(c) || '';
      });
      return result;
    }
    return null;
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
   * Now handles both POST (create) and PUT (update) cases
   */
  saveVerse(userId: number, bookId: number, chapterNum: number, verseNum: number, practiceCount: number): Observable<any> {
    const verseId = `${bookId}-${chapterNum}-${verseNum}`;
    console.log(`Saving verse: ${verseId}, practice_count: ${practiceCount}`);

    // If practice count is 0, delete the verse
    if (practiceCount === 0) {
      return this.deleteVerse(userId, bookId, chapterNum, verseNum);
    }

    // Otherwise, save/update the verse
    const payload = {
      practice_count: practiceCount,
      last_practiced: new Date().toISOString()
    };

    return this.http.put(`${this.apiUrl}/user-verses/${userId}/${bookId}/${chapterNum}/${verseNum}`, payload).pipe(
      tap(response => console.log('Verse updated:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error saving verse:', error);
        return throwError(() => error);
      })
    );
  }

  // Fixed deleteVerse method in bible.service.ts
  deleteVerse(userId: number, bookId: number, chapterNum: number, verseNum: number): Observable<any> {
    console.log(`Deleting verse: ${bookId}-${chapterNum}-${verseNum}`);

    // Use the correct URL format that matches your backend route
    const deleteUrl = `${this.apiUrl}/user-verses/${userId}/${bookId}/${chapterNum}/${verseNum}`;

    return this.http.delete(deleteUrl).pipe(
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
  saveChapter(userId: number, bookId: number, chapterNum: number): Observable<any> {
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
  saveBook(userId: number, bookId: number): Observable<any> {
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
  clearChapter(userId: number, bookId: number, chapterNum: number): Observable<any> {
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
  clearBook(userId: number, bookId: number): Observable<any> {
    console.log(`Clearing book: ${bookId}`);

    return this.http.delete(`${this.apiUrl}/user-verses/${userId}/books/${bookId}`).pipe(
      tap(response => console.log('Book cleared:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error clearing book:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get verse texts from API.Bible through backend
   */
  getVerseTexts(userId: number, verseCodes: string[], bibleId?: string): Observable<Record<string, string>> {
    console.log(`Getting texts for ${verseCodes.length} verses`);

    const cached = this.getCachedVerseTexts(verseCodes);
    if (cached) {
      return of(cached);
    }

    const payload = {
      verse_codes: verseCodes,
      bible_id: bibleId,
    };

    return this.http.post<Record<string, string>>(`${this.apiUrl}/user-verses/${userId}/verses/texts`, payload).pipe(
      tap((texts) => {
        console.log(`Received texts for ${Object.keys(texts).length} verses`);
        Object.entries(texts).forEach(([code, text]) => {
          this.verseTextCache.set(code, text);
        });
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error getting verse texts:', error);
        if (error.status === 429) {
          const wait = error.error?.wait_seconds ?? error.error?.detail?.wait_seconds;
          if (wait) {
            this.notifications.warning(`ESV API limit reached. Try again in ${wait} seconds.`);
            this.esvRetrySubject.next(wait);
          }
        }
        const emptyTexts: Record<string, string> = {};
        verseCodes.forEach((code) => (emptyTexts[code] = ''));
        return of(emptyTexts);
      })
    );
  }

  updateVerseConfidence(userId: number, verseId: number, confidence: number) {
    const payload = {
      confidence_score: confidence,
      last_reviewed: new Date().toISOString(),
    };
    return this.http.put(
      `${this.apiUrl}/user-verses/confidence/${userId}/${verseId}`,
      payload,
    );
  }

  /**
   * Updates the current Bible version (for citations)
   */
  setCurrentBibleVersion(version: BibleVersion): void {
    this.currentBibleVersionSubject.next(version);
  }

  // ----- Bible Tracker Progress Methods (stub implementations) -----

  getUserReadingProgress(): Observable<{ [bookId: string]: BookProgress }> {
    // TODO: Replace with real HTTP call
    return of({});
  }

  markVersesAsRead(bookId: string, chapter: number, verses: number[]): Observable<void> {
    // TODO: Replace with real HTTP call
    return of(void 0);
  }

  markChapterAsComplete(bookId: string, chapter: number): Observable<void> {
    // TODO: Replace with real HTTP call
    return of(void 0);
  }

  syncProgress(progress: { [bookId: string]: BookProgress }): Observable<void> {
    // TODO: Replace with real HTTP call
    return of(void 0);
  }

}
