import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService } from '@services/api/user.service';

@Injectable({ providedIn: 'root' })
export class TranslationGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.userService.getCurrentUser();
    const hasTranslation = !!(user && user.preferredBible && user.preferredBible !== '');

    if (!hasTranslation) {
      sessionStorage.setItem('redirectAfterTranslation', state.url);
      this.router.navigate(['/select-translation']);
      return false;
    }

    return true;
  }
}
