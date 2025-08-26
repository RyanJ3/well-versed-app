import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface AuthTokens {
  access_token?: string;  // Optional - stored in httpOnly cookie
  id_token?: string;      // Optional - stored in httpOnly cookie
  refresh_token?: string;  // Optional - stored in httpOnly cookie
  expires_in: number;
  token_type: string;
}

export interface User {
  user_id: string;
  email: string;
  email_verified: boolean;
  username: string;
  groups: string[];
}

interface StoredTokens {
  expires_in: number;
  expires_at: number;
  token_type: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'current_user';
  private readonly REFRESH_BUFFER = 300; // Refresh 5 minutes before expiry
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private refreshTimer: any;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.initializeAuth();
    }
  }

  private initializeAuth(): void {
    const user = this.getStoredUser();
    
    if (user) {
      // Check if user session is still valid by making a test request
      this.fetchCurrentUser().subscribe({
        next: (validUser) => {
          this.currentUserSubject.next(validUser);
          this.isAuthenticatedSubject.next(true);
          this.storeUser(validUser);
          // Schedule refresh based on default expiry
          this.scheduleTokenRefresh({ expires_in: 3600, expires_at: Date.now() + 3600000, token_type: 'Bearer' });
        },
        error: () => {
          // Session expired or invalid, try to refresh
          this.refreshToken().subscribe({
            next: () => {
              // Refresh successful, fetch user again
              this.fetchCurrentUser().subscribe({
                next: (validUser) => {
                  this.currentUserSubject.next(validUser);
                  this.isAuthenticatedSubject.next(true);
                  this.storeUser(validUser);
                },
                error: () => this.clearAuth()
              });
            },
            error: () => this.clearAuth()
          });
        }
      });
    } else {
      this.clearAuth();
    }
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<AuthTokens>(`${environment.apiUrl}/auth/login`, {
      username,
      password
    }, {
      withCredentials: true // Important: Include cookies in request
    }).pipe(
      switchMap(response => {
        // Tokens are now in httpOnly cookies, response just contains metadata
        this.isAuthenticatedSubject.next(true);
        
        // Schedule token refresh based on expires_in
        const tokenMeta: StoredTokens = {
          expires_in: response.expires_in,
          expires_at: Date.now() + (response.expires_in * 1000),
          token_type: response.token_type
        };
        this.scheduleTokenRefresh(tokenMeta);
        
        // Fetch user info using the cookie-based auth
        return this.fetchCurrentUser().pipe(
          map(user => user),
          catchError(error => {
            console.warn('Failed to fetch user details after login:', error);
            // Still return a basic user object
            const basicUser: User = {
              user_id: 'pending',
              email: username,
              email_verified: false,
              username: username.split('@')[0],
              groups: []
            };
            return of(basicUser);
          })
        );
      }),
      tap(user => {
        this.storeUser(user);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError(error => {
        this.clearAuth();
        throw error;
      })
    );
  }

  logout(): void {
    // Call logout endpoint to clear httpOnly cookie and invalidate session
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, {
      withCredentials: true // Include cookies to clear them
    }).subscribe({
      complete: () => this.clearAuth()
    });
    
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthTokens> {
    // The refresh token is now in an httpOnly cookie, so we don't need to send it
    // The backend will read it from the cookie
    return this.http.post<AuthTokens>(`${environment.apiUrl}/auth/refresh`, {}, {
      withCredentials: true // Include cookies in request
    }).pipe(
      tap(response => {
        // Tokens are refreshed in httpOnly cookies
        // Schedule next refresh based on expires_in
        const tokenMeta: StoredTokens = {
          expires_in: response.expires_in,
          expires_at: Date.now() + (response.expires_in * 1000),
          token_type: response.token_type
        };
        this.scheduleTokenRefresh(tokenMeta);
      }),
      catchError(error => {
        this.clearAuth();
        // Only navigate to login if we're not already there
        if (!this.router.url.includes('/login')) {
          this.router.navigate(['/login']);
        }
        throw error;
      })
    );
  }

  private fetchCurrentUser(): Observable<User> {
    // Auth is now handled via httpOnly cookies
    return this.http.get<User>(`${environment.apiUrl}/auth/me`, {
      withCredentials: true  // Include cookies in request
    });
  }

  getAccessToken(): string | null {
    // Tokens are now in httpOnly cookies, not accessible from JavaScript
    console.warn('getAccessToken() deprecated - tokens are now in secure httpOnly cookies');
    return null;
  }

  getIdToken(): string | null {
    // Tokens are now in httpOnly cookies, not accessible from JavaScript
    console.warn('getIdToken() deprecated - tokens are now in secure httpOnly cookies');
    return null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  hasGroup(group: string): boolean {
    const user = this.getCurrentUser();
    return user?.groups?.includes(group) || false;
  }

  hasAnyGroup(groups: string[]): boolean {
    const user = this.getCurrentUser();
    return groups.some(group => user?.groups?.includes(group));
  }

  // Tokens are no longer stored in browser storage - they're in httpOnly cookies
  private getStoredTokens(): StoredTokens | null {
    // This method is deprecated but kept for compatibility
    return null;
  }

  private storeUser(user: User): void {
    if (!this.isBrowser) return;
    
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    if (!this.isBrowser) return null;
    
    const userStr = sessionStorage.getItem(this.USER_KEY);
    
    if (!userStr) {
      return null;
    }
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private isTokenValid(tokens: StoredTokens): boolean {
    if (!tokens || !tokens.expires_at) {
      return false;
    }
    
    // Check if token expires in more than 1 minute
    return tokens.expires_at > Date.now() + 60000;
  }

  private scheduleTokenRefresh(tokens: StoredTokens): void {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Calculate when to refresh (5 minutes before expiry)
    const refreshTime = tokens.expires_at - Date.now() - (this.REFRESH_BUFFER * 1000);
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().subscribe();
      }, refreshTime);
    }
  }

  private clearAuth(): void {
    // Clear timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    // Clear storage (only user data, tokens are in httpOnly cookies)
    if (this.isBrowser) {
      sessionStorage.removeItem(this.USER_KEY);
    }
    
    // Clear subjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}