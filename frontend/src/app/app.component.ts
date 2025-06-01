
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from './core/services/user.service';
import { User } from './core/models/user';
import { ModalComponent } from './shared/components/modal/modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'frontend';
  menuActive = false;
  memorizeMenuActive = false;
  profileMenuActive = false;
  currentUser: User | null = null;

  constructor(
    private userService: UserService,
    private router: Router
  ) {
    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleMenu() {
    this.menuActive = !this.menuActive;
  }

  closeMenu() {
    this.menuActive = false;
    this.memorizeMenuActive = false;
    this.profileMenuActive = false;
  }

  toggleMemorizeMenu(event: Event) {
    event.stopPropagation();
    this.memorizeMenuActive = !this.memorizeMenuActive;
    this.profileMenuActive = false;
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.profileMenuActive = !this.profileMenuActive;
    this.memorizeMenuActive = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const memorizeDropdown = target.closest('.nav-dropdown.memorize');
    const profileDropdown = target.closest('.nav-dropdown.profile');
    
    if (!memorizeDropdown) {
      this.memorizeMenuActive = false;
    }
    if (!profileDropdown) {
      this.profileMenuActive = false;
    }
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/']);
    this.closeMenu();
  }

  getUserInitial(): string {
    if (this.currentUser?.name) {
      return this.currentUser.name.charAt(0).toUpperCase();
    }
    return 'U';
  }

  getUserDisplayName(): string {
    if (this.currentUser?.name) {
      const nameParts = this.currentUser.name.split(' ');
      return nameParts[0]; // First name only
    }
    return 'User';
  }
}