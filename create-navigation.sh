#!/bin/bash

# Create Navigation Component Script
# Run this from your Angular project root directory

echo "Creating Navigation Component files..."

# Create directory structure
mkdir -p frontend/src/app/shared/components/navigation

# Create navigation.component.ts
cat > frontend/src/app/shared/components/navigation/navigation.component.ts << 'EOF'
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
EOF

# Create navigation.component.html
cat > frontend/src/app/shared/components/navigation/navigation.component.html << 'EOF'
<!-- frontend/src/app/shared/components/navigation/navigation.component.html -->
<header class="app-header">
  <div class="header-container">
    <div class="logo-container">
      <h1 class="app-title">
        <a routerLink="/" class="app-title-text">Well Versed</a>
      </h1>
    </div>

    <button class="menu-toggle" (click)="toggleMenu()" [class.active]="menuActive">
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>

    <nav class="app-nav" [class.active]="menuActive">
      <a routerLink="/" class="nav-link" routerLinkActive="active" 
         [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Home</a>

      <!-- Memorize dropdown menu -->
      <div class="nav-dropdown memorize">
        <button class="nav-link dropdown-toggle" [class.active]="memorizeMenuActive"
          (click)="toggleMemorizeMenu($event)">
          Memorize
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
               class="dropdown-icon" [class.rotate]="memorizeMenuActive">
            <path fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clip-rule="evenodd" />
          </svg>
        </button>

        <div class="dropdown-menu" [class.active]="memorizeMenuActive">
          <a routerLink="/flow" class="dropdown-item" routerLinkActive="active" (click)="closeMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            FLOW Method
          </a>
          <a routerLink="/flashcard" class="dropdown-item" routerLinkActive="active" (click)="closeMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Flashcards
          </a>
        </div>
      </div>

      <!-- Profile dropdown menu -->
      <div class="nav-dropdown profile">
        <button class="nav-link profile-button dropdown-toggle" [class.active]="profileMenuActive"
          (click)="toggleProfileMenu($event)">
          <div class="user-avatar-small">
            {{ getUserInitial() }}
          </div>
          <span class="user-name-nav">{{ getUserDisplayName() }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
               class="dropdown-icon" [class.rotate]="profileMenuActive">
            <path fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clip-rule="evenodd" />
          </svg>
        </button>

        <div class="dropdown-menu profile-menu" [class.active]="profileMenuActive">
          <div class="profile-menu-header">
            <div class="user-avatar-large">
              {{ getUserInitial() }}
            </div>
            <div class="user-info">
              <div class="user-full-name">{{ currentUser?.name || 'User' }}</div>
              <div class="user-email">{{ currentUser?.email || 'user@example.com' }}</div>
            </div>
          </div>
          
          <div class="dropdown-divider"></div>
          
          <a routerLink="/tracker" class="dropdown-item" routerLinkActive="active" (click)="closeMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Bible Tracker
          </a>
          <a routerLink="/stats" class="dropdown-item" routerLinkActive="active" (click)="closeMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zM13 19v-9a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2h2a2 2 0 002-2zM21 19v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
            My Stats
          </a>
          <a routerLink="/profile" class="dropdown-item" routerLinkActive="active" (click)="closeMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </a>
          
          <div class="dropdown-divider"></div>
          
          <button class="dropdown-item logout-item" (click)="logout()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  </div>
</header>
EOF

# Create navigation.component.scss
cat > frontend/src/app/shared/components/navigation/navigation.component.scss << 'EOF'
// frontend/src/app/shared/components/navigation/navigation.component.scss

// Glassmorphism Header
.app-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

// Logo
.app-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.app-title-text {
  background: linear-gradient(90deg, #1e3a8a, #3b82f6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
}

// Navigation
.app-nav {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-link {
  padding: 10px 16px;
  text-decoration: none;
  color: #4b5563;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: #2563eb;
    background: linear-gradient(135deg, rgba(241, 245, 249, 0.8), rgba(226, 232, 240, 0.8));
    transform: translateY(-1px);
  }

  &.active {
    background: linear-gradient(135deg, rgba(224, 242, 254, 0.8), rgba(219, 234, 254, 0.8));
    color: #1d4ed8;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  }
}

// Dropdown Styles
.nav-dropdown {
  position: relative;

  &:hover .dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  }
}

.dropdown-toggle {
  &:hover .dropdown-icon {
    transform: rotate(180deg);
  }
}

.dropdown-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.rotate {
    transform: rotate(180deg);
  }
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 220px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 
              0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px) scale(0.95);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(229, 231, 235, 0.5);

  &.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #4b5563;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  &:hover {
    background: linear-gradient(135deg, rgba(239, 246, 255, 0.8), transparent);
    color: #2563eb;
    padding-left: 20px;

    svg {
      transform: translateX(2px);
    }
  }

  &.active {
    background: linear-gradient(135deg, rgba(224, 242, 254, 0.8), rgba(219, 234, 254, 0.8));
    color: #1d4ed8;
    font-weight: 600;
  }
}

// Profile Dropdown
.nav-dropdown.profile {
  .profile-button {
    gap: 10px;
    
    &:hover .user-avatar-small {
      transform: scale(1.05);
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
    }
  }

  .user-avatar-small {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: white;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  }

  .user-name-nav {
    font-weight: 500;
    display: none;
    
    @media (min-width: 768px) {
      display: inline;
    }
  }
}

.profile-menu {
  min-width: 280px;
  right: 0;
  left: auto;
  
  .profile-menu-header {
    padding: 20px;
    background: linear-gradient(135deg, rgba(240, 249, 255, 0.8), rgba(224, 242, 254, 0.8));
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  }

  .user-avatar-large {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  }

  .user-info {
    overflow: hidden;
    flex: 1;
  }

  .user-full-name {
    font-weight: 600;
    color: #1e293b;
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-email {
    font-size: 14px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.dropdown-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(229, 231, 235, 0.5), transparent);
  margin: 8px 0;
}

.logout-item {
  color: #dc2626;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;

  &:hover {
    background: linear-gradient(135deg, rgba(254, 242, 242, 0.8), transparent);
    color: #b91c1c;
  }
}

// Mobile Menu Toggle
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 20;

  .bar {
    width: 100%;
    height: 3px;
    background-color: #4b5563;
    border-radius: 3px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }

  &:hover .bar {
    background-color: #3b82f6;
  }

  &.active {
    .bar:nth-child(1) {
      transform: translateY(10px) rotate(45deg);
    }
    
    .bar:nth-child(2) {
      opacity: 0;
      transform: scaleX(0);
    }
    
    .bar:nth-child(3) {
      transform: translateY(-10px) rotate(-45deg);
    }
  }
}

// Mobile Responsive
@media (max-width: 768px) {
  .app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }

  .header-container {
    padding: 12px 20px;
  }

  .menu-toggle {
    display: flex;
  }

  .app-nav {
    position: fixed;
    right: -100%;
    top: 0;
    width: 75%;
    max-width: 320px;
    height: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    flex-direction: column;
    padding: 80px 20px 30px;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
    overflow-y: auto;

    &.active {
      right: 0;
    }
  }

  .nav-link {
    padding: 14px 16px;
    width: 100%;
    text-align: left;
    border-bottom: 1px solid rgba(229, 231, 235, 0.3);
    border-radius: 0;
    font-size: 16px;

    &:hover {
      transform: none;
      padding-left: 24px;
    }
  }

  .dropdown-menu {
    position: static;
    width: 100%;
    box-shadow: none;
    border-radius: 8px;
    background: rgba(248, 250, 252, 0.95);
    margin: 8px 0;
    transform: none;
    border: 1px solid rgba(229, 231, 235, 0.3);
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease;

    &.active {
      max-height: 400px;
    }
  }

  .dropdown-item {
    padding-left: 32px;
    font-size: 15px;
  }

  .app-title {
    font-size: 20px;
  }
}
EOF

# Update app.component.html
cat > frontend/src/app/app.component.html << 'EOF'
<!-- frontend/src/app/app.component.html -->
<div class="app-container">
  <!-- Navigation Component -->
  <app-navigation></app-navigation>

  <!-- Main Content -->
  <main class="app-content">
    <router-outlet></router-outlet>
  </main>

  <!-- Footer -->
  <footer class="app-footer">
    <p>&copy; 2025 Well Versed. Empowering scripture memorization.</p>
  </footer>

  <!-- Global Modal Component -->
  <app-modal></app-modal>
</div>
EOF

# Update app.component.scss
cat > frontend/src/app/app.component.scss << 'EOF'
// frontend/src/app/app.component.scss

// App Container
.app-container {
  font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb;
}

// Main Content Area
.app-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  
  // Smooth page transitions
  animation: fadeIn 0.4s ease;
  
  @media (max-width: 768px) {
    padding: 80px 16px 16px; // Account for fixed mobile header
  }
}

// Footer
.app-footer {
  margin-top: auto;
  padding: 32px 20px;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
  text-align: center;
  background: linear-gradient(to bottom, transparent, rgba(249, 250, 251, 0.5));
  
  p {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
    opacity: 0.8;
    transition: opacity 0.3s ease;
    
    &:hover {
      opacity: 1;
    }
  }
}

// Page transition animation
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Global utility classes
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
EOF

# Update app.component.ts
cat > frontend/src/app/app.component.ts << 'EOF'
// frontend/src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './shared/components/navigation/navigation.component';
import { ModalComponent } from './shared/components/modal/modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    NavigationComponent,
    ModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Well Versed';
}
EOF

echo "✅ Navigation component files created successfully!"
echo ""
echo "Files created:"
echo "  - frontend/src/app/shared/components/navigation/navigation.component.ts"
echo "  - frontend/src/app/shared/components/navigation/navigation.component.html"
echo "  - frontend/src/app/shared/components/navigation/navigation.component.scss"
echo ""
echo "Files updated:"
echo "  - frontend/src/app/app.component.html"
echo "  - frontend/src/app/app.component.scss"
echo "  - frontend/src/app/app.component.ts"
echo ""
echo "Remember to:"
echo "  1. Fix any import paths as needed"
echo "  2. Ensure ModalComponent exists or remove it from imports"
echo "  3. Run 'ng serve' to test the changes"
EOF