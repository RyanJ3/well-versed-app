/**
 * Auth HTTP Interceptor
 * =====================
 * Handles authentication token injection and automatic refresh
 * - Adds Bearer token to outgoing requests
 * - Automatically refreshes expired tokens on 401 responses
 * - Queues requests during token refresh
 * - Uses the functional interceptor pattern
 */

import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { catchError, switchMap, throwError, BehaviorSubject, Observable, filter, take } from 'rxjs';

// Track refresh state globally
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Skip auth for certain endpoints
  if (isAuthEndpoint(req)) {
    return next(req);
  }
  
  // Add token to request
  const token = authService.getToken();
  if (token) {
    req = addToken(req, token);
  }
  
  // Handle the request and errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401 && !isRefreshRequest(req)) {
        return handle401Error(req, next, authService, router);
      }
      
      // Handle 403 on refresh endpoint (refresh token expired)
      if (error.status === 403 && isRefreshRequest(req)) {
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => new Error('Session expired. Please login again.'));
      }
      
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);
    
    return authService.refreshToken().pipe(
      switchMap((success: boolean) => {
        isRefreshing = false;
        
        if (success) {
          const newToken = authService.getToken();
          refreshTokenSubject.next(newToken);
          // Retry original request with new token
          return next(addToken(req, newToken!));
        } else {
          // Refresh failed
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => new Error('Authentication failed. Please login again.'));
        }
      }),
      catchError((error) => {
        isRefreshing = false;
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  } else {
    // Wait for refresh to complete, then retry
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addToken(req, token!)))
    );
  }
}

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function isAuthEndpoint(req: HttpRequest<unknown>): boolean {
  const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
  return authPaths.some(path => req.url.includes(path));
}

function isRefreshRequest(req: HttpRequest<unknown>): boolean {
  return req.url.includes('/auth/refresh');
}