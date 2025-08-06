import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { UserService } from '@services/api/user.service';

@Injectable({ providedIn: 'root' })
export class TranslationGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.userService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user?.preferredBible || user.preferredBible === '') {
          // Store the attempted URL for later redirect
          sessionStorage.setItem('redirectAfterTranslation', state.url);
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
