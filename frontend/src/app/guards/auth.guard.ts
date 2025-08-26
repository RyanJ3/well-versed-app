import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          // Check for required groups if specified
          const requiredGroups = route.data['groups'] as string[] | undefined;
          
          if (requiredGroups && requiredGroups.length > 0) {
            const hasRequiredGroup = this.authService.hasAnyGroup(requiredGroups);
            
            if (!hasRequiredGroup) {
              this.router.navigate(['/unauthorized']);
              return false;
            }
          }
          
          return true;
        }
        
        // Store the attempted URL for redirecting after login
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }
}