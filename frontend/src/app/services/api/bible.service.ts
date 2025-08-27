import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject, Subject } from 'rxjs';
import { tap, catchError, switchMap, mergeMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { BibleData, UserVerseDetail, BibleBook } from '@models/bible';
import { NotificationService } from '@services/utils/notification.service';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';

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

  /**
   * Normalize the provided user id so API calls never include an undefined
   * value. If the id is not a positive integer, fall back to `1` which matches
   * the development seed user.
   */
  private normalizeUserId(id: any): number {
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }

  private preferencesSubject = new BehaviorSubject<{ includeApocrypha: boolean }>({
    includeApocrypha: false
  });

  // Emits wait time in seconds when ESV API limits are hit
  private esvRetrySubject = new Subject<number>();
  public esvRetry$ = this.esvRetrySubject.asObservable();

  // Current Bible version for citations
  private currentBibleVersionSubject = new BehaviorSubject<BibleVersion | null>(null);
  public currentBibleVersion$ = this.currentBibleVersionSubject.asObservable();

  public preferences$ = this.preferencesSubject.asObservable();

  hasValidVersion(): boolean {
    return this.currentBibleVersionSubject.value !== null;
  }

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object,
    private notifications: NotificationService,
    private userService: UserService
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

    const endpoint = `${this.apiUrl}/verses`;

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

    return this.http.put(`${this.apiUrl}/verses/${bookId}/${chapterNum}/${verseNum}`, payload).pipe(
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

    const deleteUrl = `${this.apiUrl}/verses/${bookId}/${chapterNum}/${verseNum}`;

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

    return this.http.post(`${this.apiUrl}/verses/chapters`, {
      book_id: bookId,
      chapter: chapterNum
    }).pipe(
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

    return this.http.post(`${this.apiUrl}/verses/books`, {
      book_id: bookId
    }).pipe(
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

    return this.http.delete(`${this.apiUrl}/verses/chapters/${bookId}/${chapterNum}`).pipe(
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

    return this.http.delete(`${this.apiUrl}/verses/books/${bookId}`).pipe(
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
    if (!this.hasValidVersion() && !bibleId) {
      console.warn('No Bible translation selected');
      const empty: Record<string, string> = {};
      verseCodes.forEach(code => empty[code] = 'Please select a Bible translation');
      return of(empty);
    }

    console.log(`Getting texts for ${verseCodes.length} verses`);

    const cached = this.getCachedVerseTexts(verseCodes);
    if (cached) {
      return of(cached);
    }
    
    // Ensure ESV token is loaded before making the request
    return this.userService.ensureEsvTokenLoaded().pipe(
      mergeMap(() => {
        const payload = {
          verse_codes: verseCodes,
          bible_id: bibleId,
        };

        return this.http.post<Record<string, string>>(`${this.apiUrl}/verses/texts`, payload).pipe(
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
      })
    );
  }

  updateVerseConfidence(userId: number, verseId: string, confidence: number) {
    const payload = {
      confidence_score: confidence,
      last_reviewed: new Date().toISOString(),
    };
    const [bookId, chapter, verse] = verseId.split('-');
    return this.http.put(
      `${this.apiUrl}/verses/${bookId}/${chapter}/${verse}/confidence`,
      payload,
    );
  }

  /**
   * Clears the verse text cache (useful when Bible translation changes)
   */
  clearVerseTextCache(): void {
    const cacheSize = this.verseTextCache.size;
    this.verseTextCache.clear();
    console.log(`Verse text cache cleared (${cacheSize} entries removed)`);
  }

  /**
   * Updates the current Bible version (for citations)
   */
  setCurrentBibleVersion(version: BibleVersion | null): void {
    // Clear cache when Bible version changes
    const previousVersion = this.currentBibleVersionSubject.value;
    if (previousVersion?.id !== version?.id) {
      this.clearVerseTextCache();
    }
    
    this.currentBibleVersionSubject.next(version);

    // Store in localStorage - only if in the browser
    if (version && this.isBrowser) {
      localStorage.setItem('currentBibleVersion', JSON.stringify(version));
    } else if (!version && this.isBrowser) {
      localStorage.removeItem('currentBibleVersion');
    }
  }

  setBibleVersionFromAbbreviation(abbreviation: string): void {
    if (!abbreviation) {
      this.setCurrentBibleVersion(null);
      return;
    }

    // Try to fetch the actual Bible information from the API
    this.http.get<any>(`${this.apiUrl}/bibles/available`).pipe(
      map(response => {
        const bibles = response.bibles || [];
        
        // Find the Bible by abbreviation or abbreviationLocal
        const bible = bibles.find((b: any) => 
          b.abbreviation === abbreviation || 
          b.abbreviationLocal === abbreviation ||
          b.id === abbreviation
        );

        if (bible) {
          return {
            id: bible.id,
            name: bible.name,
            abbreviation: bible.abbreviation || bible.abbreviationLocal || abbreviation,
            // Don't make assumptions about copyright - let the API or metadata provide this
            isPublicDomain: undefined,
            copyright: undefined
          } as BibleVersion;
        }

        // Fallback: create a basic version object if not found
        return {
          id: abbreviation.toLowerCase(),
          name: abbreviation, // Use abbreviation as name if not found
          abbreviation: abbreviation,
          isPublicDomain: undefined,
          copyright: undefined
        } as BibleVersion;
      }),
      catchError(error => {
        console.error('Error fetching Bible version info:', error);
        // On error, create a basic version object
        return of({
          id: abbreviation.toLowerCase(),
          name: abbreviation,
          abbreviation: abbreviation,
          isPublicDomain: undefined,
          copyright: undefined
        } as BibleVersion);
      })
    ).subscribe(version => {
      this.setCurrentBibleVersion(version);
    });
  }

  // ----- Bible Tracker Progress Methods (stub implementations) -----

  getUserReadingProgress(): Observable<{ [bookId: string]: BibleBook }> {
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

  syncProgress(progress: { [bookId: string]: BibleBook }): Observable<void> {
    // TODO: Replace with real HTTP call
    return of(void 0);
  }

  // ----- Cross-References Methods -----
  
  getCrossReferences(verseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/verses/${verseId}/cross-references`).pipe(
      catchError(error => {
        console.error('Error fetching cross-references:', error);
        return of([]);
      })
    );
  }
  
  getCrossReferencesForVerse(bookId: number, chapter: number, verse: number): Observable<any[]> {
    // Validate inputs
    if (bookId === undefined || bookId === null || 
        chapter === undefined || chapter === null || 
        verse === undefined || verse === null) {
      console.error('Invalid parameters for getCrossReferencesForVerse:', { bookId, chapter, verse });
      return of([]);
    }
    
    // First get the verse ID
    return this.http.get<any>(`${this.apiUrl}/verses/lookup`, {
      params: {
        book_id: bookId.toString(),
        chapter: chapter.toString(),
        verse: verse.toString()
      }
    }).pipe(
      switchMap(verseData => {
        if (verseData && verseData.id) {
          return this.getCrossReferences(verseData.id);
        }
        return of([]);
      }),
      catchError(error => {
        console.error('Error fetching cross-references:', error);
        return of([]);
      })
    );
  }

  // ----- Topical Verses Methods -----
  
  getTopics(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/topical/topics`).pipe(
      catchError(error => {
        console.error('Error fetching topics:', error);
        return of([]);
      })
    );
  }
  
  getTopicalVerses(topicId: number, limit: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/topical/topics/${topicId}/verses`, {
      params: {
        limit: limit.toString()
      }
    }).pipe(
      catchError(error => {
        console.error('Error fetching topical verses:', error);
        return of([]);
      })
    );
  }
  
  searchTopics(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/topical/search`, {
      params: {
        query: query
      }
    }).pipe(
      catchError(error => {
        console.error('Error searching topics:', error);
        return of([]);
      })
    );
  }

}
