import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User, MemorizationProgress } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Dummy user with extended profile data
  private defaultUser: User = {
    id: 1,
    name: 'Mike Wazouski',
    email: 'mike@monsters.inc',
    createdAt: new Date(2024, 2, 15), // March 15, 2024
    
    // Profile details
    denomination: 'Non-denominational',
    preferredBible: 'NIV',
    includeApocrypha: false,
    
    // Statistics
    versesMemorized: 47,
    streakDays: 12,
    booksStarted: 3,
    
    // Current progress
    currentlyMemorizing: [
      {
        reference: 'Psalms 23',
        progress: 80,
        lastPracticed: new Date(2025, 4, 3) // May 3, 2025
      },
      {
        reference: 'Romans 8:28-39',
        progress: 35,
        lastPracticed: new Date(2025, 4, 4) // May 4, 2025
      },
      {
        reference: 'Philippians 4:4-9',
        progress: 15,
        lastPracticed: new Date(2025, 4, 5) // May 5, 2025
      }
    ]
  };

  private apiUrl = 'http://localhost:8000/api/users';
  private currentUserSubject = new BehaviorSubject<User>(this.defaultUser);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Only try to access localStorage in browser environment
    if (this.isBrowser) {
      // Load user from localStorage if available
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Convert string dates back to Date objects
          if (parsedUser.createdAt) {
            parsedUser.createdAt = new Date(parsedUser.createdAt);
          }
          
          if (parsedUser.currentlyMemorizing) {
            parsedUser.currentlyMemorizing.forEach((item: MemorizationProgress) => {
              if (item.lastPracticed) {
                item.lastPracticed = new Date(item.lastPracticed);
              }
            });
          }
          
          this.currentUserSubject.next(parsedUser);
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
      
      // In a real app, fetch fresh data from the backend
      // this.fetchCurrentUser().subscribe();
    }
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/current`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        // Only try to access localStorage in browser environment
        if (this.isBrowser) {
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      }),
      catchError(error => {
        console.error('Error fetching user data:', error);
        // Return default user if API fails
        return of(this.defaultUser);
      })
    );
  }

  getCurrentUser(): User {
    return this.currentUserSubject.value;
  }

  // For now, just a placeholder method to update the user
  updateUser(user: Partial<User>): Observable<User> {
    // In a real app, first update API
    // For now, just update local state with dummy implementation
    const updatedUser = { ...this.currentUserSubject.value, ...user };
    this.currentUserSubject.next(updatedUser);
    
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    
    return of(updatedUser);
  }

  // Placeholder for future API integration
  getUserProfile(userId: string | number): Observable<User> {
    // In a real app: return this.http.get<User>(`${this.apiUrl}/${userId}`);
    // For now, return dummy data
    return of(this.defaultUser);
  }

  // Logout placeholder
  logout(): void {
    console.log('User logged out');
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    
    // Reset to default user
    this.currentUserSubject.next(this.defaultUser);
  }
}