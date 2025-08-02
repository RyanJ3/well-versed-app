// src/app/services/user.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from './../../../environments/environment';
import { User, UserApiResponse, UserProfileUpdate } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    // Initial check to load current user
    this.fetchCurrentUser();
  }

  fetchCurrentUser(): void {
    // For testing, we'll use user ID 1
    this.http.get<UserApiResponse>(`${this.apiUrl}/users/1`).pipe(
      map(apiResponse => this.mapApiResponseToUser(apiResponse)),
      tap(user => {
        console.log('Fetched user from API:', user);
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Error fetching user:', error);
        return of(null);
      })
    ).subscribe();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
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
        this.currentUserSubject.next(updatedUser);
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

  // Helper method to convert API response (snake_case) to User model (camelCase)
  private mapApiResponseToUser(apiResponse: UserApiResponse): User {
    console.log('Mapping API response:', apiResponse);

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
