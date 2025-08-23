// src/app/services/api/user.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { User, UserApiResponse, UserProfileUpdate } from '@models/user';

declare const require: any;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;
  private bibleService?: any;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Check localStorage for stored preferences if in the browser
    if (this.isBrowser) {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        try {
          const prefs = JSON.parse(stored);
          if (prefs.preferredBible) {
            this.syncBibleVersion(prefs);
          }
          // Pre-populate user with cached preferences if available
          if (prefs.preferredBible || prefs.esvApiToken) {
            const cachedUser: Partial<User> = {
              preferredBible: prefs.preferredBible,
              preferredLanguage: prefs.preferredLanguage,
              useEsvApi: prefs.useEsvApi,
              esvApiToken: prefs.esvApiToken
            };
            // Only set if we have meaningful data
            if (prefs.esvApiToken || prefs.preferredBible) {
              console.log('Loading cached user preferences:', cachedUser);
            }
          }
        } catch (e) {
          console.error('Error parsing cached preferences:', e);
        }
      }
    }

    // Initial check to load current user
    this.loadCurrentUser();
  }

  private getBibleService() {
    if (!this.bibleService) {
      const { BibleService } = require('./bible.service');
      const injector = (window as any).angularInjector;
      this.bibleService = injector.get(BibleService);
    }
    return this.bibleService;
  }

  private syncBibleVersion(user: { preferredBible?: string }): void {
    if (!user?.preferredBible) return;

    try {
      const bibleService = this.getBibleService();
      if (bibleService) {
        bibleService.setCurrentBibleVersion({
          id: user.preferredBible === 'ESV' ? 'esv' : user.preferredBible,
          name: user.preferredBible,
          abbreviation: user.preferredBible,
          isPublicDomain: user.preferredBible !== 'ESV'
        });
      }
    } catch (e) {
      console.log('Bible service not available yet');
    }
  }

  fetchCurrentUser(): Observable<User | null> {
    // For testing, we'll use user ID 1
    return this.http.get<UserApiResponse>(`${this.apiUrl}/users/1`).pipe(
      map(apiResponse => this.mapApiResponseToUser(apiResponse)),
      tap(user => {
        console.log('Fetched user from API:', user);
        console.log('ESV API Token present:', !!(user?.esvApiToken));
        this.currentUserSubject.next(user);

        // Store preferences if in browser
        if (user && this.isBrowser) {
          const preferences = {
            preferredBible: user.preferredBible,
            preferredLanguage: user.preferredLanguage,
            useEsvApi: user.useEsvApi,
            esvApiToken: user.esvApiToken
          };
          console.log('Storing preferences to localStorage:', preferences);
          localStorage.setItem('userPreferences', JSON.stringify(preferences));
          this.syncBibleVersion(user);
        }
      }),
      catchError(error => {
        console.error('Error fetching user:', error);
        
        // Try to restore from localStorage on error
        if (this.isBrowser) {
          try {
            const stored = localStorage.getItem('userPreferences');
            if (stored) {
              const prefs = JSON.parse(stored);
              console.log('Restoring user preferences from localStorage due to API error:', prefs);
              // Create a minimal user object with cached preferences
              const fallbackUser: Partial<User> = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                preferredBible: prefs.preferredBible,
                preferredLanguage: prefs.preferredLanguage || 'eng',
                useEsvApi: prefs.useEsvApi,
                esvApiToken: prefs.esvApiToken,
                includeApocrypha: false,
                firstName: 'Test',
                lastName: 'User',
                createdAt: new Date()
              };
              this.currentUserSubject.next(fallbackUser as User);
              return of(fallbackUser as User);
            }
          } catch (e) {
            console.error('Error restoring from localStorage:', e);
          }
        }
        
        return of(null);
      })
    );
  }

  // Legacy method for backwards compatibility
  loadCurrentUser(): void {
    this.fetchCurrentUser().subscribe();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current user with localStorage fallback for missing data
   */
  getCurrentUserWithFallback(): User | null {
    const user = this.currentUserSubject.value;
    
    if (!user) return null;

    // If user is missing critical data, try to restore from localStorage
    if (this.isBrowser && (!user.preferredBible || (user.preferredBible === 'ESV' && !user.esvApiToken))) {
      try {
        const stored = localStorage.getItem('userPreferences');
        if (stored) {
          const prefs = JSON.parse(stored);
          return {
            ...user,
            preferredBible: user.preferredBible || prefs.preferredBible,
            preferredLanguage: user.preferredLanguage || prefs.preferredLanguage,
            useEsvApi: user.useEsvApi ?? prefs.useEsvApi,
            esvApiToken: user.esvApiToken || prefs.esvApiToken
          };
        }
      } catch (e) {
        console.error('Error restoring user data from localStorage:', e);
      }
    }

    return user;
  }

  updateUser(formData: any): Observable<User> {
    console.log('Updating user with form data:', formData);

    // Ensure includeApocrypha is a proper boolean
    const includeApocrypha = formData.includeApocrypha === true;
    
    // Determine if ESV is selected
    const isEsvSelected = formData.preferredBible === 'ESV' || formData.useEsvApi === true;

    // Convert camelCase form data to snake_case for API
    const apiRequestData: UserProfileUpdate = {
      first_name: formData.firstName || formData.first_name,
      last_name: formData.lastName || formData.last_name,
      denomination: formData.denomination,
      preferred_bible: formData.preferredBible || formData.preferred_bible,
      preferred_language: formData.preferredLanguage || formData.preferred_language,
      include_apocrypha: includeApocrypha,
      use_esv_api: isEsvSelected,
      esv_api_token: isEsvSelected ? formData.esvApiToken : null
    };

    console.log('Converted to API format:', apiRequestData);

    return this.http.put<UserApiResponse>(`${this.apiUrl}/users/1`, apiRequestData).pipe(
      map(apiResponse => this.mapApiResponseToUser(apiResponse)),
      tap(updatedUser => {
        console.log('User updated successfully, mapped response:', updatedUser);
        console.log('Updated ESV API Token present:', !!(updatedUser?.esvApiToken));
        this.currentUserSubject.next(updatedUser);

        if (updatedUser && this.isBrowser) {
          const preferences = {
            preferredBible: updatedUser.preferredBible,
            preferredLanguage: updatedUser.preferredLanguage,
            useEsvApi: updatedUser.useEsvApi,
            esvApiToken: updatedUser.esvApiToken
          };
          console.log('Updating localStorage with new preferences:', preferences);
          localStorage.setItem('userPreferences', JSON.stringify(preferences));
          this.syncBibleVersion(updatedUser);
        }
      }),
      catchError(error => {
        console.error('Error updating user:', error);
        throw error;
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
  }

  clearMemorizationData(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/verses/all`).pipe(
      catchError(error => {
        console.error('Error clearing data:', error);
        throw error;
      })
    );
  }

  hasValidTranslation(): Observable<boolean> {
    return this.ensureUserLoaded().pipe(
      map(user => {
        // Try to get preferences from user or localStorage as fallback
        let preferredBible = user?.preferredBible;
        let esvApiToken = user?.esvApiToken;

        if (this.isBrowser && (!preferredBible || (preferredBible === 'ESV' && !esvApiToken))) {
          try {
            const stored = localStorage.getItem('userPreferences');
            if (stored) {
              const prefs = JSON.parse(stored);
              preferredBible = preferredBible || prefs.preferredBible;
              esvApiToken = esvApiToken || prefs.esvApiToken;
            }
          } catch (e) {
            console.error('Error reading cached preferences:', e);
          }
        }

        // No Bible selected
        if (!preferredBible || preferredBible === '') {
          return false;
        }

        // ESV selected but no token
        if (
          preferredBible === 'ESV' &&
          (!esvApiToken || esvApiToken.trim() === '')
        ) {
          return false;
        }

        return true;
      }),
      catchError(() => of(false))
    );
  }

  // Legacy synchronous method for backwards compatibility
  hasValidTranslationSync(): boolean {
    const user = this.currentUserSubject.value;

    // Try to get preferences from localStorage as fallback
    let preferredBible = user?.preferredBible;
    let esvApiToken = user?.esvApiToken;

    if (this.isBrowser && (!preferredBible || (preferredBible === 'ESV' && !esvApiToken))) {
      try {
        const stored = localStorage.getItem('userPreferences');
        if (stored) {
          const prefs = JSON.parse(stored);
          preferredBible = preferredBible || prefs.preferredBible;
          esvApiToken = esvApiToken || prefs.esvApiToken;
        }
      } catch (e) {
        console.error('Error reading cached preferences:', e);
      }
    }

    // No Bible selected
    if (!preferredBible || preferredBible === '') {
      return false;
    }

    // ESV selected but no token
    if (
      preferredBible === 'ESV' &&
      (!esvApiToken || esvApiToken.trim() === '')
    ) {
      return false;
    }

    return true;
  }

  /**
   * Force refresh user data from API and sync with localStorage
   */
  refreshUserData(): void {
    console.log('Forcing user data refresh...');
    this.loadCurrentUser();
  }

  /**
   * Ensure user data is loaded, returns observable that completes when user is loaded
   */
  ensureUserLoaded(): Observable<User | null> {
    const currentUser = this.currentUserSubject.value;
    
    // If user is already loaded, return immediately
    if (currentUser) {
      return of(currentUser);
    }
    
    // If no user loaded, fetch from API
    console.log('User not loaded, fetching from database...');
    return this.fetchCurrentUser();
  }

  // Helper method to convert API response (snake_case) to User model (camelCase)
  private mapApiResponseToUser(apiResponse: UserApiResponse): User {
    // Convert include_apocrypha to a proper boolean if it exists
    const includeApocrypha = apiResponse.include_apocrypha !== undefined
      ? apiResponse.include_apocrypha === true
      : false;

    // Extract first and last names - handle both snake_case and existing data
    const firstName = apiResponse.first_name || '';
    const lastName = apiResponse.last_name || '';

    // Compute full name - use the stored name or combine first/last
    let fullName = apiResponse.name;
    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName} ${lastName}`.trim();
    }

    // Determine if ESV is being used
    const useEsvApi = apiResponse.use_esv_api === true || apiResponse.preferred_bible === 'ESV';

    const mappedUser: User = {
      id: apiResponse.id,
      name: fullName || '',
      email: apiResponse.email,
      createdAt: new Date(apiResponse.created_at),

      // Include separate name fields
      firstName: firstName,
      lastName: lastName,

      denomination: apiResponse.denomination,
      preferredBible: apiResponse.preferred_bible,
      preferredLanguage: apiResponse.preferred_language || 'eng',
      includeApocrypha: includeApocrypha,
      useEsvApi: useEsvApi,
      esvApiToken: apiResponse.esv_api_token ? "****" : "no token",

      versesMemorized: apiResponse.verses_memorized || 0,
      streakDays: apiResponse.streak_days || 0,
      booksStarted: apiResponse.books_started || 0,

      // Add default empty array for currently memorizing verses
      currentlyMemorizing: []
    };

    console.log('Mapped user:', mappedUser);
    return mappedUser;
  }
}
