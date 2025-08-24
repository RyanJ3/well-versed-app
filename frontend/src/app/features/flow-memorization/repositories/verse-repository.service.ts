import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, forkJoin, throwError } from 'rxjs';
import { map, catchError, shareReplay, switchMap, tap, retry, timeout } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
}

// Request coalescing entry
interface PendingRequest {
  observable: Observable<any>;
  timestamp: number;
}

// Verse data interfaces
export interface VerseData {
  verseCode: string;
  bookId: number;
  chapter: number;
  verseNumber: number;
  text: string;
  bookName?: string;
  translation?: string;
}

export interface ChapterData {
  bookId: number;
  bookName: string;
  chapter: number;
  verses: VerseData[];
  totalVerses: number;
}

export interface BookData {
  bookId: number;
  bookName: string;
  totalChapters: number;
  totalVerses: number;
  testament: 'OLD' | 'NEW';
}

export interface CrossReferenceData {
  sourceVerseCode: string;
  targetVerseCode: string;
  confidence: number;
  relationship?: string;
  bidirectional: boolean;
}

export interface TopicalVerseData {
  verseCode: string;
  topicId: string;
  topicName: string;
  relevance: number;
  subtopic?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VerseRepositoryService {
  private readonly apiUrl = environment.apiUrl || '/api';
  private readonly cachePrefix = 'verse_repo_';
  private readonly defaultCacheDuration = 15 * 60 * 1000; // 15 minutes
  
  // In-memory cache
  private memoryCache = new Map<string, CacheEntry<any>>();
  
  // Request coalescing map
  private pendingRequests = new Map<string, PendingRequest>();
  
  // Configuration
  private readonly maxCacheSize = 100;
  private readonly maxBatchSize = 50;
  private readonly requestTimeout = 10000; // 10 seconds
  private readonly maxRetries = 2;
  
  constructor(private http: HttpClient) {
    this.initializeCache();
    this.startCacheCleanup();
  }
  
  /**
   * Get verses for a specific chapter
   */
  getChapterVerses(bookId: number, chapter: number, translation = 'ESV'): Observable<ChapterData> {
    const cacheKey = this.getCacheKey('chapter', bookId, chapter, translation);
    
    // Check cache first
    const cached = this.getFromCache<ChapterData>(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    // Check for pending request (request coalescing)
    const pending = this.getPendingRequest(cacheKey);
    if (pending) {
      return pending;
    }
    
    // Make API request
    const request$ = this.http.get<ChapterData>(
      `${this.apiUrl}/verses/chapter/${bookId}/${chapter}`,
      { params: { translation } }
    ).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      map(data => this.transformChapterData(data)),
      tap(data => this.setCache(cacheKey, data)),
      catchError(error => this.handleError(error, 'getChapterVerses')),
      shareReplay(1)
    );
    
    // Store pending request
    this.setPendingRequest(cacheKey, request$);
    
    return request$;
  }
  
  /**
   * Get multiple verses by their codes (with batching)
   */
  getVersesByCode(verseCodes: string[], translation = 'ESV'): Observable<Map<string, VerseData>> {
    if (verseCodes.length === 0) {
      return of(new Map());
    }
    
    // Split into cached and uncached
    const result = new Map<string, VerseData>();
    const uncachedCodes: string[] = [];
    
    verseCodes.forEach(code => {
      const cacheKey = this.getCacheKey('verse', code, translation);
      const cached = this.getFromCache<VerseData>(cacheKey);
      
      if (cached) {
        result.set(code, cached);
      } else {
        uncachedCodes.push(code);
      }
    });
    
    // If all verses are cached, return immediately
    if (uncachedCodes.length === 0) {
      return of(result);
    }
    
    // Batch fetch uncached verses
    return this.batchFetchVerses(uncachedCodes, translation).pipe(
      map(fetchedVerses => {
        // Merge fetched verses with cached ones
        fetchedVerses.forEach((verse, code) => {
          result.set(code, verse);
        });
        return result;
      })
    );
  }
  
  /**
   * Get cross references for a verse
   */
  getCrossReferences(verseCode: string, limit = 10): Observable<CrossReferenceData[]> {
    const cacheKey = this.getCacheKey('crossrefs', verseCode, limit);
    
    const cached = this.getFromCache<CrossReferenceData[]>(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    return this.http.get<CrossReferenceData[]>(
      `${this.apiUrl}/cross-references/${verseCode}`,
      { params: { limit: limit.toString() } }
    ).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      tap(data => this.setCache(cacheKey, data, 30 * 60 * 1000)), // Cache for 30 minutes
      catchError(error => this.handleError(error, 'getCrossReferences')),
      shareReplay(1)
    );
  }
  
  /**
   * Get topical verses
   */
  getTopicalVerses(topicId: string, limit = 50): Observable<TopicalVerseData[]> {
    const cacheKey = this.getCacheKey('topical', topicId, limit);
    
    const cached = this.getFromCache<TopicalVerseData[]>(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    return this.http.get<TopicalVerseData[]>(
      `${this.apiUrl}/topics/${topicId}/verses`,
      { params: { limit: limit.toString() } }
    ).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      tap(data => this.setCache(cacheKey, data, 30 * 60 * 1000)),
      catchError(error => this.handleError(error, 'getTopicalVerses')),
      shareReplay(1)
    );
  }
  
  /**
   * Get book metadata
   */
  getBookData(bookId: number): Observable<BookData> {
    const cacheKey = this.getCacheKey('book', bookId);
    
    const cached = this.getFromCache<BookData>(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    return this.http.get<BookData>(`${this.apiUrl}/books/${bookId}`).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      tap(data => this.setCache(cacheKey, data, 60 * 60 * 1000)), // Cache for 1 hour
      catchError(error => this.handleError(error, 'getBookData')),
      shareReplay(1)
    );
  }
  
  /**
   * Get all books
   */
  getAllBooks(): Observable<BookData[]> {
    const cacheKey = this.getCacheKey('allbooks');
    
    const cached = this.getFromCache<BookData[]>(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    return this.http.get<BookData[]>(`${this.apiUrl}/books`).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      tap(data => this.setCache(cacheKey, data, 24 * 60 * 60 * 1000)), // Cache for 24 hours
      catchError(error => this.handleError(error, 'getAllBooks')),
      shareReplay(1)
    );
  }
  
  /**
   * Search verses
   */
  searchVerses(query: string, bookId?: number, chapter?: number): Observable<VerseData[]> {
    const params: any = { q: query };
    if (bookId) params.bookId = bookId;
    if (chapter) params.chapter = chapter;
    
    return this.http.get<VerseData[]>(`${this.apiUrl}/verses/search`, { params }).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      catchError(error => this.handleError(error, 'searchVerses')),
      shareReplay(1)
    );
  }
  
  /**
   * Prefetch data for better performance
   */
  prefetchChapter(bookId: number, chapter: number, translation = 'ESV'): void {
    this.getChapterVerses(bookId, chapter, translation).subscribe();
  }
  
  prefetchAdjacentChapters(bookId: number, currentChapter: number, translation = 'ESV'): void {
    // Prefetch previous and next chapters
    if (currentChapter > 1) {
      this.prefetchChapter(bookId, currentChapter - 1, translation);
    }
    
    this.getBookData(bookId).subscribe(book => {
      if (currentChapter < book.totalChapters) {
        this.prefetchChapter(bookId, currentChapter + 1, translation);
      }
    });
  }
  
  /**
   * Batch fetch verses
   */
  private batchFetchVerses(verseCodes: string[], translation: string): Observable<Map<string, VerseData>> {
    const batches: string[][] = [];
    
    // Split into batches
    for (let i = 0; i < verseCodes.length; i += this.maxBatchSize) {
      batches.push(verseCodes.slice(i, i + this.maxBatchSize));
    }
    
    // Fetch all batches in parallel
    const batchRequests = batches.map(batch => 
      this.http.post<VerseData[]>(
        `${this.apiUrl}/verses/batch`,
        { verseCodes: batch, translation }
      ).pipe(
        timeout(this.requestTimeout),
        retry(this.maxRetries),
        catchError(error => {
          console.error('Batch fetch error:', error);
          return of([]);
        })
      )
    );
    
    return forkJoin(batchRequests).pipe(
      map(results => {
        const verseMap = new Map<string, VerseData>();
        
        results.forEach(batch => {
          batch.forEach(verse => {
            verseMap.set(verse.verseCode, verse);
            // Cache individual verses
            const cacheKey = this.getCacheKey('verse', verse.verseCode, translation);
            this.setCache(cacheKey, verse);
          });
        });
        
        return verseMap;
      })
    );
  }
  
  /**
   * Transform chapter data
   */
  private transformChapterData(data: any): ChapterData {
    return {
      bookId: data.bookId,
      bookName: data.bookName,
      chapter: data.chapter,
      verses: data.verses || [],
      totalVerses: data.verses?.length || 0
    };
  }
  
  /**
   * Cache management
   */
  private initializeCache(): void {
    // Load persistent cache from localStorage if needed
    try {
      const stored = localStorage.getItem(this.cachePrefix + 'data');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only load non-expired entries
        Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
          if (entry.expiresAt > Date.now()) {
            this.memoryCache.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }
  
  private startCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      this.memoryCache.forEach((entry, key) => {
        if (entry.expiresAt < now) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.memoryCache.delete(key));
      
      // Also clean up old pending requests
      this.pendingRequests.forEach((request, key) => {
        if (now - request.timestamp > 30000) { // 30 seconds
          this.pendingRequests.delete(key);
        }
      });
    }, 5 * 60 * 1000);
  }
  
  private getCacheKey(...parts: any[]): string {
    return parts.join('_');
  }
  
  private getFromCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data as T;
    }
    
    return null;
  }
  
  private setCache<T>(key: string, data: T, duration = this.defaultCacheDuration): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    };
    
    this.memoryCache.set(key, entry);
    
    // Enforce cache size limit
    if (this.memoryCache.size > this.maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }
  
  private getPendingRequest(key: string): Observable<any> | null {
    const pending = this.pendingRequests.get(key);
    
    if (pending && Date.now() - pending.timestamp < 30000) {
      return pending.observable;
    }
    
    return null;
  }
  
  private setPendingRequest(key: string, request$: Observable<any>): void {
    this.pendingRequests.set(key, {
      observable: request$,
      timestamp: Date.now()
    });
    
    // Clean up after request completes
    request$.subscribe({
      complete: () => this.pendingRequests.delete(key),
      error: () => this.pendingRequests.delete(key)
    });
  }
  
  private handleError(error: any, context: string): Observable<never> {
    console.error(`Error in ${context}:`, error);
    
    // You could emit error events to the event bus here
    // this.eventBus.emitError(error, context);
    
    return throwError(() => ({
      message: error.message || 'An error occurred',
      context,
      timestamp: Date.now()
    }));
  }
  
  /**
   * Clear all cache
   */
  clearCache(): void {
    this.memoryCache.clear();
    this.pendingRequests.clear();
    localStorage.removeItem(this.cachePrefix + 'data');
  }
  
  /**
   * Clear cache for specific key pattern
   */
  clearCacheByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.memoryCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }
  
  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    size: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let oldest = Date.now();
    let newest = 0;
    
    this.memoryCache.forEach(entry => {
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    });
    
    return {
      size: this.memoryCache.size,
      hitRate: 0, // Would need to track hits/misses
      oldestEntry: oldest,
      newestEntry: newest
    };
  }
}