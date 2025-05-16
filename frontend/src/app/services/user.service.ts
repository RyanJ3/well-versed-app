// src/app/services/user.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments';

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
    this.http.get<User>(`${this.apiUrl}/users/1`).pipe(
      tap(user => {
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

  updateUser(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/1`, userData).pipe(
      tap(updatedUser => {
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
}