// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { User } from './models/user';
import { RouterModule } from '@angular/router';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, RouterLinkActive]
})
export class AppComponent implements OnInit {
  title = 'Well Versed';
  menuActive = false;
  userMenuActive = false;
  currentUser: User | undefined | null = null;

  constructor(private userService: UserService) {
    this.currentUser = this.userService.getCurrentUser();
  }

  ngOnInit(): void {
    // Subscribe to user changes
    this.userService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });
  }

  toggleMenu(): void {
    this.menuActive = !this.menuActive;
    // Close other menus when main menu is toggled
    this.userMenuActive = false;
  }

  toggleUserMenu(): void {
    this.userMenuActive = !this.userMenuActive;
    // Close other menus when user menu is toggled
    this.menuActive = false;
  }

  closeMenu(): void {
    this.menuActive = false;
  }

  closeUserMenu(): void {
    this.userMenuActive = false;
  }

  logout(): void {
    this.userService.logout();
    this.closeUserMenu();
  }
}