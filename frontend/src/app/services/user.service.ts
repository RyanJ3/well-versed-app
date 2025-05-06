// src/app/services/user.service.ts
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
  private apiUrl = 'http://localhost:8000/api/users';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Only try to access localStorage in browser environment
    if (this.isBrowser) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          this.currentUserSubject.next(parsedUser);
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
    }
    
    // For development, set a dummy user if none exists
    if (!this.currentUserSubject.value) {
      this.setDummyUser();
    }
  }

  // Temporary dummy user for development
  private setDummyUser(): void {
    const dummyUser: User = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date()
    };
    this.currentUserSubject.next(dummyUser);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateUser(userData: Partial<User>): Observable<User> {
    const updatedUser = { ...this.getCurrentUser(), ...userData } as User;
    this.currentUserSubject.next(updatedUser);
    
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    
    return of(updatedUser);
  }

  logout(): void {
    this.currentUserSubject.next(null);
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
  }
}