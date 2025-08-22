import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, filter, timeout, catchError } from 'rxjs/operators';
import { UserService } from '@services/api/user.service';

@Injectable({ providedIn: 'root' })
export class TranslationGuard implements CanActivate {
  private isBrowser: boolean;

  constructor(
    private userService: UserService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    // Ensure user data is loaded from database before checking
    return this.userService.ensureUserLoaded().pipe(
      timeout(5000), // 5 second timeout
      map(user => {
        // Get values from user or fallback to localStorage
        let preferredBible = user?.preferredBible;
        let esvApiToken = user?.esvApiToken;

        // Try localStorage as fallback if user data is incomplete
        if (this.isBrowser && (!preferredBible || (preferredBible === 'ESV' && !esvApiToken))) {
          try {
            const stored = localStorage.getItem('userPreferences');
            if (stored) {
              const prefs = JSON.parse(stored);
              preferredBible = preferredBible || prefs.preferredBible;
              esvApiToken = esvApiToken || prefs.esvApiToken;
            }
          } catch (e) {
            console.error('Error reading cached preferences in guard:', e);
          }
        }

        // Check if no Bible selected
        const noBibleSelected = !preferredBible || preferredBible === '';

        // Check if ESV is selected but token is missing
        const esvWithoutToken =
          preferredBible === 'ESV' &&
          (!esvApiToken || esvApiToken.trim() === '');

        // Redirect if either condition is true
        if (noBibleSelected || esvWithoutToken) {
          // Store the attempted URL only if in browser
          if (this.isBrowser) {
            sessionStorage.setItem('redirectAfterTranslation', state.url);
          }

          // Redirect to profile with setup flag
          return this.router.createUrlTree(['/profile'], {
            queryParams: { setup: 'bible' }
          });
        }

        return true;
      }),
      catchError(error => {
        console.error('Translation guard timeout or error:', error);
        // On timeout or error, try localStorage as last resort
        if (this.isBrowser) {
          try {
            const stored = localStorage.getItem('userPreferences');
            if (stored) {
              const prefs = JSON.parse(stored);
              const preferredBible = prefs.preferredBible;
              const esvApiToken = prefs.esvApiToken;
              
              if (preferredBible && (preferredBible !== 'ESV' || esvApiToken)) {
                console.log('Translation guard: Using cached preferences due to timeout');
                return of(true);
              }
            }
          } catch (e) {
            console.error('Error reading cached preferences on timeout:', e);
          }
        }
        
        // Redirect to profile if we can't determine translation status
        return of(this.router.createUrlTree(['/profile'], {
          queryParams: { setup: 'bible' }
        }));
      })
    );
  }
}
