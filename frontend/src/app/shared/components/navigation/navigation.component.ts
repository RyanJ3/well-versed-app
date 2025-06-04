// frontend/src/app/shared/components/navigation/navigation.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user';

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
  profileMenuActive = false;
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleMenu() {
    this.menuActive = !this.menuActive;
    if (this.menuActive) {
      this.memorizeMenuActive = false;
      this.profileMenuActive = false;
    }
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

  getUserInitial(): string {
    if (this.currentUser?.name) {
      return this.currentUser.name.charAt(0).toUpperCase();
    }
    return 'U';
  }

  getUserDisplayName(): string {
    if (this.currentUser?.name) {
      const firstName = this.currentUser.name.split(' ')[0];
      return firstName;
    }
    return 'User';
  }

  logout() {
    this.userService.logout();
    this.closeMenu();
    this.router.navigate(['/']);
  }
}
