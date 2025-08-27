/**
 * Authentication Service
 * ======================
 * Handles all authentication operations for the Angular frontend.
 * 
 * Features:
 * - Login/logout functionality
 * - Token management (stored in localStorage)
 * - User state management
 * - Auth guard support
 * - Automatic token refresh
 */

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Interfaces for type safety
interface LoginRequest {
  username: string;  // Email address
  password: string;
}

interface RegisterRequest {
  username: string;  // Email address
  password: string;
  name?: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface UserInfo {
  user_id: string;
  email: string;
  name?: string;
}

@Injectable({ 
  providedIn: 'root' 
})
export class AuthService {
  private readonly API_URL = '/api/auth';  // Proxied to backend
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private isBrowser: boolean;
  
  // Observable user state
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Track authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Check for existing token on service initialization
    this.checkAuthStatus();
  }
  
  /**
   * Check if user is already authenticated (has valid token)
   */
  private checkAuthStatus(): void {
    const token = this.getToken();
    if (token) {
      // Verify token is still valid by fetching user info
      this.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        },
        error: () => {
          // Token is invalid, clear it silently (don't redirect if already on auth pages)
          this.clearAuthSilently();
        }
      });
    }
  }
  
  /**
   * Clear authentication without redirecting (for initialization checks)
   */
  private clearAuthSilently(): void {
    // Clear tokens
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
    
    // Clear user state
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Don't redirect - let the route guards handle it
  }
  
  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<boolean> {
    const loginRequest: LoginRequest = {
      username: email,  // Backend expects 'username' but it's an email
      password: password
    };
    
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, loginRequest)
      .pipe(
        tap(response => {
          // Store tokens
          this.setToken(response.access_token);
          this.setRefreshToken(response.refresh_token);
          
          // Update auth state
          this.isAuthenticatedSubject.next(true);
          
          // Fetch user info
          this.getCurrentUser().subscribe(user => {
            this.currentUserSubject.next(user);
          });
        }),
        map(() => true),
        catchError(error => {
          console.error('Login failed:', error);
          return of(false);
        })
      );
  }
  
  /**
   * Logout the current user
   */
  logout(): Observable<void> {
    // Call backend logout endpoint (optional, for server-side cleanup)
    return this.http.post<void>(`${this.API_URL}/logout`, {})
      .pipe(
        tap(() => this.clearAuth()),
        catchError(() => {
          // Even if backend logout fails, clear local auth
          this.clearAuth();
          return of(void 0);
        })
      );
  }
  
  /**
   * Register a new user
   */
  register(email: string, password: string, name?: string): Observable<any> {
    const registerRequest: RegisterRequest = {
      username: email,
      password: password,
      name: name
    };
    
    return this.http.post(`${this.API_URL}/register`, registerRequest);
  }
  
  /**
   * Get current user information
   */
  getCurrentUser(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.API_URL}/me`);
  }
  
  /**
   * Refresh the access token using the refresh token
   */
  refreshToken(): Observable<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(false);
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${refreshToken}`
    });
    
    return this.http.post<any>(`${this.API_URL}/refresh`, {}, { headers })
      .pipe(
        tap(response => {
          if (response.access_token) {
            this.setToken(response.access_token);
          }
        }),
        map(() => true),
        catchError(() => {
          this.clearAuth();
          return of(false);
        })
      );
  }
  
  /**
   * Get the stored access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  /**
   * Store the access token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  /**
   * Get the stored refresh token
   */
  private getRefreshToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
  
  /**
   * Store the refresh token
   */
  private setRefreshToken(token: string): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }
  
  /**
   * Clear all authentication data
   */
  private clearAuth(): void {
    // Clear tokens
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
    
    // Clear user state
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Navigate to login page
    this.router.navigate(['/login']);
  }
  
  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
  
  /**
   * Get the current user (synchronous)
   */
  getCurrentUserValue(): UserInfo | null {
    return this.currentUserSubject.value;
  }
  
  /**
   * Handle API health check
   */
  checkAuthHealth(): Observable<any> {
    return this.http.get(`${this.API_URL}/health`);
  }
}