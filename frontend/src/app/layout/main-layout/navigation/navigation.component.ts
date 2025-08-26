// frontend/src/app/layouts/components/main-layout/navigation/navigation.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '@services/api/user.service';
import { AuthService, User as AuthUser } from '@services/auth/auth.service';
import { User } from '@models/user';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit, OnDestroy {
  menuActive = false;
  memorizeMenuActive = false;
  learningMenuActive = false;
  profileMenuActive = false;
  currentUser: User | null = null;
  authUser: AuthUser | null = null;
  isAuthenticated = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Subscribe to authentication state
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
        
        // Only load user data when authenticated and not on login page
        if (isAuth && !this.router.url.includes('/login')) {
          // Add a small delay to ensure auth is fully settled
          setTimeout(() => {
            this.userService.ensureUserLoaded().subscribe(() => {
              // Subscribe to user changes after ensuring data is loaded
              this.userService.currentUser$
                .pipe(takeUntil(this.destroy$))
                .subscribe((user: User | null) => {
                  this.currentUser = user;
                  console.log('Navigation: User data loaded', user);
                });
            });
          }, 500);
        } else {
          this.currentUser = null;
        }
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authUser => {
        this.authUser = authUser;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMenu() {
    this.menuActive = !this.menuActive;
    if (this.menuActive) {
      this.memorizeMenuActive = false;
      this.learningMenuActive = false;
      this.profileMenuActive = false;
    }
  }

  closeMenu() {
    this.menuActive = false;
    this.memorizeMenuActive = false;
    this.learningMenuActive = false;
    this.profileMenuActive = false;
  }

  openMemorizeMenu() {
    if (!this.hasTranslation()) { return; }
    this.memorizeMenuActive = true;
    this.learningMenuActive = false;
    this.profileMenuActive = false;
  }

  closeMemorizeMenu() {
    this.memorizeMenuActive = false;
  }

  openLearningMenu() {
    this.learningMenuActive = true;
    this.memorizeMenuActive = false;
    this.profileMenuActive = false;
  }

  closeLearningMenu() {
    this.learningMenuActive = false;
  }

  openProfileMenu() {
    this.profileMenuActive = true;
    this.memorizeMenuActive = false;
    this.learningMenuActive = false;
  }

  closeProfileMenu() {
    this.profileMenuActive = false;
  }

  getUserInitial(): string {
    if (this.currentUser?.firstName) {
      return this.currentUser.firstName.charAt(0).toUpperCase();
    } else if (this.currentUser?.name) {
      return this.currentUser.name.charAt(0).toUpperCase();
    }
    return 'U';
  }

  getUserDisplayName(): string {
    const user = this.userService.getCurrentUser();
    if (user?.firstName) {
      return user.firstName;
    } else if (user?.name) {
      return user.name.split(' ')[0];
    }
    return '';
  }

  getFullName(): string {
    if (this.currentUser?.firstName || this.currentUser?.lastName) {
      return `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim();
    }
    return this.currentUser?.name || 'User';
  }

  hasTranslation(): boolean {
    // In local/dev mode with auth, assume translation is available
    if (this.isAuthenticated && !this.currentUser) {
      // User is authenticated but user preferences haven't loaded yet
      // Default to true to allow memorization features
      return true;
    }
    
    // Check basic translation
    if (!this.currentUser?.preferredBible) {
      return false;
    }

    // Check ESV token if ESV is selected
    if (
      this.currentUser.preferredBible === 'ESV' &&
      (!this.currentUser.esvApiToken || this.currentUser.esvApiToken.trim() === '')
    ) {
      return false;
    }

    return true;
  }

  logout() {
    this.closeMenu();
    this.authService.logout(); // This will navigate to /login automatically
  }
}
