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

    // For debugging - log the type of the includeApocrypha field
    console.log('includeApocrypha type:', typeof formData.includeApocrypha, 'value:', formData.includeApocrypha);

    // Ensure includeApocrypha is a proper boolean
    const includeApocrypha = formData.includeApocrypha === true;
    
    // Convert camelCase form data to snake_case for API
    const apiRequestData: UserProfileUpdate = {
      first_name: formData.firstName || formData.first_name,
      last_name: formData.lastName || formData.last_name,
      denomination: formData.denomination,
      preferred_bible: formData.preferredBible || formData.preferred_bible,
      // Use the normalized boolean value
      include_apocrypha: includeApocrypha
    };

    console.log('Converted to API format:', apiRequestData);
    console.log('include_apocrypha value after normalization:', apiRequestData.include_apocrypha);

    return this.http.put<UserApiResponse>(`${this.apiUrl}/users/1`, apiRequestData).pipe(
      map(apiResponse => this.mapApiResponseToUser(apiResponse)),
      tap(updatedUser => {
        console.log('User updated successfully, mapped response:', updatedUser);
        // Make sure the boolean is preserved
        console.log('Updated includeApocrypha value:', updatedUser.includeApocrypha);
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
    const userId = this.getCurrentUser()?.id || 1;
    return this.http.delete(`${this.apiUrl}/user-verses/${userId}`).pipe(
      catchError(error => {
        console.error('Error clearing data:', error);
        throw error;
      })
    );
  }

  // Helper method to convert API response (snake_case) to User model (camelCase)
  private mapApiResponseToUser(apiResponse: UserApiResponse): User {
    // Convert include_apocrypha to a proper boolean if it exists
    const includeApocrypha = apiResponse.include_apocrypha !== undefined 
      ? apiResponse.include_apocrypha === true
      : false;
    
    console.log('Mapping API response - includeApocrypha:', includeApocrypha, 
      'Original value:', apiResponse.include_apocrypha, 
      'Type:', typeof apiResponse.include_apocrypha);
    
    return {
      id: apiResponse.id,
      name: apiResponse.name,
      email: apiResponse.email,
      createdAt: new Date(apiResponse.created_at),

      denomination: apiResponse.denomination,
      preferredBible: apiResponse.preferred_bible,
      includeApocrypha: includeApocrypha,

      versesMemorized: apiResponse.verses_memorized,
      streakDays: apiResponse.streak_days,
      booksStarted: apiResponse.books_started,

      // Add default empty array for currently memorizing verses
      currentlyMemorizing: []
    };
  }
}