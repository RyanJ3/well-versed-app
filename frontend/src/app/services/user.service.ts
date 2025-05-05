import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Mike Wazouski as our fallback user in case the API fails
  private defaultUser: User = {
    id: 1,
    name: 'Mike Wazouski',
    email: 'mike@monsters.inc',
    createdAt: new Date()
  };

  private apiUrl = 'http://localhost:8000/api/user';
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
          this.currentUserSubject.next(JSON.parse(savedUser));
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
      
      // Always fetch fresh data from the backend
      this.fetchCurrentUser().subscribe();
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
    // First update API
    return this.http.put<User>(`${this.apiUrl}/${this.currentUserSubject.value.id}`, user).pipe(
      tap(updatedUser => {
        // Then update local state
        this.currentUserSubject.next(updatedUser);
        // Only try to access localStorage in browser environment
        if (this.isBrowser) {
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }),
      catchError(error => {
        console.error('Error updating user:', error);
        // Fall back to local update if API fails
        const updatedUser = { ...this.currentUserSubject.value, ...user };
        this.currentUserSubject.next(updatedUser);
        if (this.isBrowser) {
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        return of(updatedUser);
      })
    );
  }

  // Logout placeholder
  logout(): void {
    console.log('User logged out');
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
  }
}