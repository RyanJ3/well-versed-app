/**
 * Auth Layout Component
 * ====================
 * Minimal layout for authentication pages (login, register, password reset, etc.)
 * 
 * Features:
 * - Clean, minimal design
 * - No navigation header
 * - No footer
 * - Centered content area
 * - Background styling for auth pages
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent implements OnInit {
  subtitle: string = 'Bible Memorization Platform';
  
  constructor(private router: Router) {}
  
  ngOnInit() {
    // Update subtitle based on current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateSubtitle(event.url);
    });
    
    // Set initial subtitle
    this.updateSubtitle(this.router.url);
  }
  
  private updateSubtitle(url: string) {
    if (url.includes('register')) {
      this.subtitle = 'Create Your Account';
    } else {
      this.subtitle = 'Bible Memorization Platform';
    }
  }
}