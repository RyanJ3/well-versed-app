/**
 * Auth HTTP Interceptor
 * =====================
 * Automatically adds authentication token to outgoing requests
 * and handles 401 responses
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Get the auth token from localStorage
  const token = localStorage.getItem('access_token');
  
  // Clone the request and add the authorization header if we have a token
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  // Pass the request through and handle errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Only redirect to login if we're not already on an auth page
        const currentUrl = router.url;
        const isAuthPage = currentUrl.includes('/login') || 
                          currentUrl.includes('/register') || 
                          currentUrl.includes('/forgot-password') ||
                          currentUrl.includes('/reset-password');
        
        if (!isAuthPage) {
          // Token is invalid or expired
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.navigate(['/login']);
        }
      }
      
      return throwError(() => error);
    })
  );
};