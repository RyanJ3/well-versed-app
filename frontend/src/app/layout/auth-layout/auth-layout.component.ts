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

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent {
  // This layout is intentionally minimal
  // All auth-related pages will be rendered within this layout
}