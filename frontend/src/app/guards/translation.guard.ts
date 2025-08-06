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
        // Check if no Bible selected
        const noBibleSelected = !user?.preferredBible || user.preferredBible === '';

        // Check if ESV is selected but token is missing
        const esvWithoutToken =
          user?.preferredBible === 'ESV' &&
          (!user.esvApiToken || user.esvApiToken.trim() === '');

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
