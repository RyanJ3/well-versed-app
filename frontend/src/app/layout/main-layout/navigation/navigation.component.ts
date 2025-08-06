// frontend/src/app/layouts/components/main-layout/navigation/navigation.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '@services/api/user.service';
import { User } from '@models/user';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  menuActive = false;
  memorizeMenuActive = false;
  learningMenuActive = false;
  profileMenuActive = false;
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.userService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });
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
    this.userService.logout();
    this.closeMenu();
    this.router.navigate(['/']);
  }
}
