import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { User } from './models/user';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true
})
export class AppComponent implements OnInit {
  title = 'Well Versed';
  menuActive = false;
  userMenuActive = false;
  memorizeMenuActive = false;
  currentUser: User | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleMenu(): void {
    this.menuActive = !this.menuActive;
    // Close other menus when main menu is toggled
    this.userMenuActive = false;
    this.memorizeMenuActive = false;
  }

  toggleUserMenu(): void {
    this.userMenuActive = !this.userMenuActive;
    // Close other menus when user menu is toggled
    this.menuActive = false;
    this.memorizeMenuActive = false;
  }

  toggleMemorizeMenu(event: Event): void {
    event.stopPropagation(); // Prevent the click from closing the main nav on mobile
    this.memorizeMenuActive = !this.memorizeMenuActive;
  }

  closeMenu(): void {
    this.menuActive = false;
    this.memorizeMenuActive = false;
  }

  closeUserMenu(): void {
    this.userMenuActive = false;
  }

  closeMemorizeMenu(): void {
    this.memorizeMenuActive = false;
  }

  logout(): void {
    this.userService.logout();
    this.closeUserMenu();
  }
}