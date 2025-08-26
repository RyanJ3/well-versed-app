import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth for auth endpoints but still include credentials
    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request.clone({ withCredentials: true }));
    }

    // For all other requests, include credentials (cookies)
    // Tokens are now in httpOnly cookies, no need to add Authorization header
    request = request.clone({ withCredentials: true });

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          // Don't try to refresh on login page
          if (this.router.url.includes('/login')) {
            return throwError(() => error);
          }
          
          if (error.status === 401) {
            return this.handle401Error(request, next);
          } else if (error.status === 403) {
            // Handle 403 silently - just pass through
            return throwError(() => error);
          }
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(() => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(true);
          // Retry the request with updated cookies
          return next.handle(request.clone({ withCredentials: true }));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          // Only logout if not on login page
          if (!this.router.url.includes('/login')) {
            this.authService.logout();
          }
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(value => value != null),
        take(1),
        switchMap(() => {
          // Retry the request with updated cookies
          return next.handle(request.clone({ withCredentials: true }));
        })
      );
    }
  }

  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = ['/auth/login', '/auth/refresh', '/auth/register', '/auth/health'];
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }
}