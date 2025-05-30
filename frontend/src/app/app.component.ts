// src/app/app.component.ts
import { Component, OnInit, HostListener  } from '@angular/core';
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
  memorizeMenuActive = false;
  currentUser: User | undefined | null = null;

  constructor(private userService: UserService) {
    this.currentUser = this.userService.getCurrentUser();
  }

  toggleMenu() {
    this.menuActive = !this.menuActive;
  }

  closeMenu() {
    this.menuActive = false;
    this.memorizeMenuActive = false;
  }

  toggleMemorizeMenu(event: Event) {
    event.stopPropagation();
    this.memorizeMenuActive = !this.memorizeMenuActive;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.nav-dropdown');
    
    if (!dropdown) {
      this.memorizeMenuActive = false;
    }
  }

  ngOnInit(): void {
    // Subscribe to user changes
    this.userService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });
  }

  toggleUserMenu(): void {
    this.userMenuActive = !this.userMenuActive;
    // Close other menus when user menu is toggled
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