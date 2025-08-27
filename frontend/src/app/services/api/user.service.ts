// src/app/services/api/user.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { User, UserApiResponse, UserProfileUpdate } from '@models/user';
import { AuthService } from '../auth/auth.service';

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
    private authService: AuthService,
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
    // Get current user info from auth service
    return this.authService.getCurrentUser().pipe(
      map(authUser => {
        // Create a User object from auth service data
        const user: User = {
          id: 1, // We don't have a numeric ID from auth, using 1 as placeholder
          email: authUser.email,
          name: authUser.name || authUser.email.split('@')[0],
          firstName: authUser.name?.split(' ')[0] || '',
          lastName: authUser.name?.split(' ').slice(1).join(' ') || '',
          createdAt: new Date(),
          
          // Default preferences - these will be loaded from user preferences API later
          preferredBible: '',
          preferredLanguage: 'eng',
          includeApocrypha: false,
          useEsvApi: false,
          esvApiToken: '',
          denomination: '',
          
          // Stats
          versesMemorized: 0,
          streakDays: 0,
          booksStarted: 0,
          currentlyMemorizing: []
        };
        
        // Try to load saved preferences from localStorage
        if (this.isBrowser) {
          try {
            const stored = localStorage.getItem('userPreferences');
            if (stored) {
              const prefs = JSON.parse(stored);
              // Only use stored prefs if they match the current user's email
              const storedEmail = localStorage.getItem('userEmail');
              if (storedEmail === authUser.email) {
                user.preferredBible = prefs.preferredBible || user.preferredBible;
                user.preferredLanguage = prefs.preferredLanguage || user.preferredLanguage;
                user.useEsvApi = prefs.useEsvApi || user.useEsvApi;
                user.esvApiToken = prefs.esvApiToken || user.esvApiToken;
                user.includeApocrypha = prefs.includeApocrypha || user.includeApocrypha;
                user.denomination = prefs.denomination || user.denomination;
              }
            }
          } catch (e) {
            console.error('Error loading preferences from localStorage:', e);
          }
        }
        
        return user;
      }),
      tap(user => {
        console.log('Fetched user from auth service:', user);
        this.currentUserSubject.next(user);

        // Store preferences and email if in browser
        if (user && this.isBrowser) {
          const preferences = {
            preferredBible: user.preferredBible,
            preferredLanguage: user.preferredLanguage,
            useEsvApi: user.useEsvApi,
            esvApiToken: user.esvApiToken,
            includeApocrypha: user.includeApocrypha,
            denomination: user.denomination
          };
          console.log('Storing preferences to localStorage:', preferences);
          localStorage.setItem('userPreferences', JSON.stringify(preferences));
          localStorage.setItem('userEmail', user.email);
          this.syncBibleVersion(user);
        }
      }),
      catchError(error => {
        console.error('Error fetching user:', error);
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

    // Get current user to preserve existing values
    const currentUser = this.currentUserSubject.value;
    
    // Merge with existing user data to prevent data loss
    const mergedData = currentUser ? {
      firstName: formData.firstName ?? currentUser.firstName,
      lastName: formData.lastName ?? currentUser.lastName,
      denomination: formData.denomination ?? currentUser.denomination,
      preferredBible: formData.preferredBible ?? currentUser.preferredBible,
      preferredLanguage: formData.preferredLanguage ?? currentUser.preferredLanguage,
      includeApocrypha: formData.includeApocrypha ?? currentUser.includeApocrypha,
      useEsvApi: formData.useEsvApi ?? currentUser.useEsvApi,
      esvApiToken: formData.esvApiToken ?? currentUser.esvApiToken
    } : formData;

    // Ensure includeApocrypha is a proper boolean
    const includeApocrypha = mergedData.includeApocrypha === true;
    
    // Determine if ESV is selected
    const isEsvSelected = mergedData.preferredBible === 'ESV' || mergedData.useEsvApi === true;

    // Convert camelCase form data to snake_case for API
    const apiRequestData: UserProfileUpdate = {
      first_name: mergedData.firstName || mergedData.first_name,
      last_name: mergedData.lastName || mergedData.last_name,
      denomination: mergedData.denomination,
      preferred_bible: mergedData.preferredBible || mergedData.preferred_bible,
      preferred_language: mergedData.preferredLanguage || mergedData.preferred_language,
      include_apocrypha: includeApocrypha,
      use_esv_api: isEsvSelected,
      esv_api_token: isEsvSelected ? mergedData.esvApiToken : null
    };

    console.log('Converted to API format:', apiRequestData);

    // For now, we'll still use user ID 1 for the update endpoint
    // In a full implementation, this would be handled differently
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

  /**
   * Update only the apocrypha preference without affecting other user data
   */
  updateApocryphaPreference(includeApocrypha: boolean): Observable<User> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      console.error('Cannot update apocrypha preference: no user loaded');
      return throwError(() => new Error('No user loaded'));
    }

    // Only update the apocrypha field, preserve all other data
    return this.updateUser({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      denomination: currentUser.denomination,
      preferredBible: currentUser.preferredBible,
      preferredLanguage: currentUser.preferredLanguage,
      includeApocrypha: includeApocrypha,
      useEsvApi: currentUser.useEsvApi,
      esvApiToken: currentUser.esvApiToken
    });
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
   * Check and refresh ESV API token if missing
   * Call this when navigating to pages that need the ESV API
   */
  ensureEsvTokenLoaded(): Observable<boolean> {
    const currentUser = this.currentUserSubject.value;
    
    if (!currentUser) {
      // No user loaded, fetch from database
      return this.fetchCurrentUser().pipe(
        map(user => {
          const hasToken = !!(user?.esvApiToken);
          console.log('ESV token loaded from database:', hasToken);
          return hasToken;
        })
      );
    }
    
    const isEsvSelected = currentUser.preferredBible === 'ESV' || currentUser.useEsvApi;
    
    // If ESV is not selected, no token needed
    if (!isEsvSelected) {
      return of(true);
    }
    
    // If ESV is selected but token is missing, refresh from database
    if (!currentUser.esvApiToken) {
      console.log('ESV selected but token missing, refreshing from database...');
      return this.fetchCurrentUser().pipe(
        map(user => {
          const hasToken = !!(user?.esvApiToken);
          console.log('ESV token refreshed from database:', hasToken);
          return hasToken;
        })
      );
    }
    
    // Token is already present
    return of(true);
  }

  /**
   * Ensure user data is loaded, returns observable that completes when user is loaded
   */
  ensureUserLoaded(): Observable<User | null> {
    const currentUser = this.currentUserSubject.value;
    
    // Check if user exists but is missing critical data (ESV API token)
    if (currentUser) {
      const isEsvSelected = currentUser.preferredBible === 'ESV' || currentUser.useEsvApi;
      const missingEsvToken = isEsvSelected && !currentUser.esvApiToken;
      
      // If ESV is selected but token is missing, refetch from database
      if (missingEsvToken) {
        console.log('ESV selected but token missing, refetching user data from database...');
        return this.fetchCurrentUser();
      }
      
      // User data is complete, return immediately
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
      esvApiToken: apiResponse.esv_api_token,

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
