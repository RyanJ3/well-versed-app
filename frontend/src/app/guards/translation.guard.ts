import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
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
    return this.userService.currentUser$.pipe(
      take(1),
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
      })
    );
  }
}
