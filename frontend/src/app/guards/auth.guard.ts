/**
 * Authentication Guard
 * ====================
 * Protects routes that require authentication.
 * Redirects to login page if user is not authenticated.
 */

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    
    // Check if user has a valid token
    const token = this.authService.getToken();
    
    if (token) {
      // Token exists, verify it's still valid
      return this.authService.isAuthenticated$.pipe(
        take(1),
        map(isAuthenticated => {
          if (isAuthenticated) {
            return true;
          } else {
            // Token is invalid, redirect to login
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: state.url }
            });
            return false;
          }
        })
      );
    } else {
      // No token, redirect to login
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
  }
}