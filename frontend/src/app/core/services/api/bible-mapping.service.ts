// frontend/src/app/core/services/api/bible-mapping.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';

interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  abbreviationLocal: string;
  language: string;
  languageId: string;
  description?: string;
}

interface CachedBibles {
  data: BibleVersion[];
  expiry: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BibleMappingService {
  private apiUrl = `${environment.apiUrl}/bibles`;
  private biblesCache = new Map<string, CachedBibles>();
  private currentBibleIdSubject = new BehaviorSubject<string>('');
  
  public currentBibleId$ = this.currentBibleIdSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get Bible ID from abbreviation
   * @param abbreviation Bible abbreviation (e.g., "KJV", "NIV")
   * @param languageId Language ID (default: "eng")
   * @returns Observable of Bible ID or empty string if not found
   */
  getBibleIdByAbbreviation(abbreviation: string, languageId: string = 'eng'): Observable<string> {
    if (!abbreviation) return of('');
    
    return this.getAvailableBibles(languageId).pipe(
      map(bibles => {
        const bible = bibles.find(b => 
          b.abbreviation === abbreviation || 
          b.abbreviationLocal === abbreviation
        );
        
        const bibleId = bible?.id || '';
        if (bibleId) {
          this.currentBibleIdSubject.next(bibleId);
        }
        
        return bibleId;
      })
    );
  }

  /**
   * Get Bible details by ID
   * @param bibleId Bible ID
   * @returns Observable of BibleVersion or null
   */
  getBibleById(bibleId: string): Observable<BibleVersion | null> {
    if (!bibleId) return of(null);
    
    // Check all cached languages for this Bible ID
    for (const [key, cached] of this.biblesCache.entries()) {
      const bible = cached.data.find(b => b.id === bibleId);
      if (bible) {
        return of(bible);
      }
    }
    
    // Not in cache, fetch from API
    return this.http.get<BibleVersion>(`${this.apiUrl}/bible/${bibleId}`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Get available Bibles for a language with caching
   * @param languageId Language ID (default: "eng")
   * @returns Observable of Bible versions
   */
  getAvailableBibles(languageId: string = 'eng'): Observable<BibleVersion[]> {
    const cacheKey = `bibles_${languageId}`;
    const cached = this.biblesCache.get(cacheKey);
    
    // Check cache validity (29 days)
    if (cached && cached.expiry > new Date()) {
      console.log(`Returning cached Bibles for language ${languageId}`);
      return of(cached.data);
    }
    
    // Fetch from API
    const url = `${this.apiUrl}/available?language=${languageId}`;
    return this.http.get<{bibles: BibleVersion[], cacheExpiry: string}>(url).pipe(
      tap(response => {
        // Cache the results
        this.biblesCache.set(cacheKey, {
          data: response.bibles,
          expiry: new Date(response.cacheExpiry)
        });
        console.log(`Cached ${response.bibles.length} Bibles for language ${languageId}`);
      }),
      map(response => response.bibles),
      catchError(error => {
        console.error('Error fetching available Bibles:', error);
        return of([]);
      })
    );
  }

  /**
   * Clear the local cache
   */
  clearCache(): void {
    this.biblesCache.clear();
    console.log('Bible cache cleared');
  }

  /**
   * Map common abbreviations to their API.Bible IDs
   * This is a fallback for common Bibles if the API is unavailable
   */
  private readonly commonBibleMap: Record<string, string> = {
    'KJV': 'de4e12af7f28f599-02',
    'NIV': '71c22aeeea9e0455-01',
    'ESV': '01b29f4b342acc35-01',
    'NASB': 'c6a99f3cf7f6c33a-01',
    'NLT': '97d87738c5d34d3e-01',
    'CSB': 'a556c5305ee15c3f-01',
    'NKJV': '2f0fd81a7b85b923-01',
    'RSV': '40072c4a5aba4022-01',
    'MSG': '66c22e845f5e6b9f-01',
    'AMP': '1588f6c26af13a37-01'
  };

  /**
   * Get Bible ID using fallback map
   * @param abbreviation Bible abbreviation
   * @returns Bible ID or empty string
   */
  getBibleIdFallback(abbreviation: string): string {
    return this.commonBibleMap[abbreviation] || '';
  }
}