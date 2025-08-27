// frontend/src/app/layouts/components/main-layout/navigation/navigation.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as AuthActions from '../../../state/auth/actions/auth.actions';
import { selectCurrentUser, selectUserInitial, selectUserFullName } from '../../../state/auth/selectors/auth.selectors';
import { UserService } from '@services/api/user.service';

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
  currentUser$: Observable<any>;
  userInitial$: Observable<string>;
  userFullName$: Observable<string>;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private store: Store,
    private userService: UserService
  ) {
    this.currentUser$ = this.store.select(selectCurrentUser);
    this.userInitial$ = this.store.select(selectUserInitial);
    this.userFullName$ = this.store.select(selectUserFullName);
  }

  ngOnInit() {
    // Dispatch action to load current user on navigation init
    this.store.dispatch(AuthActions.loadCurrentUser());
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

  hasTranslation(): boolean {
    // For now, return true - this should be updated to check user preferences
    // This would ideally be another selector
    return true;
  }

  logout() {
    this.closeMenu();
    this.store.dispatch(AuthActions.logout());
  }
}
