/**
 * Login Component
 * ===============
 * Provides user authentication interface with:
 * - Email/password login form
 * - "Use test account" button for local development
 * - Form validation
 * - Error handling
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error = '';
  returnUrl = '/';
  showPassword = false;
  
  // Test account credentials for local development
  readonly testEmail = 'test@example.com';
  readonly testPassword = 'password123';
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit() {
    // Initialize the form
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    
    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }
  
  // Getter for easy access to form fields
  get f() { 
    return this.loginForm.controls; 
  }
  
  /**
   * Fill form with test credentials for easy local testing
   */
  useTestAccount() {
    this.loginForm.patchValue({
      email: this.testEmail,
      password: this.testPassword
    });
  }
  
  /**
   * Toggle password visibility
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  
  /**
   * Handle form submission
   */
  onSubmit() {
    // Stop if form is invalid
    if (this.loginForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    const email = this.f['email'].value;
    const password = this.f['password'].value;
    
    // Attempt login
    this.authService.login(email, password).subscribe({
      next: (success) => {
        if (success) {
          // Navigate to return URL or home
          this.router.navigate([this.returnUrl]);
        } else {
          this.error = 'Invalid email or password';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.error = error?.error?.detail || 'An error occurred during login';
        this.loading = false;
      }
    });
  }
  
  /**
   * Navigate to registration page
   */
  goToRegister() {
    this.router.navigate(['/register']);
  }
  
  /**
   * Check if a form field has an error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const control = this.loginForm.get(fieldName);
    if (!control) return false;
    
    if (errorType) {
      return control.hasError(errorType) && (control.dirty || control.touched);
    }
    return control.invalid && (control.dirty || control.touched);
  }
}