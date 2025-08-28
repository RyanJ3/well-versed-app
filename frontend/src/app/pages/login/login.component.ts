/**
 * Login Component
 * ===============
 * Provides user authentication interface with:
 * - Email/password login form
 * - "Use test account" button for local development
 * - Form validation
 * - Error handling
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as AuthActions from '../../state/auth/actions/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../state/auth/selectors/auth.selectors';
import { LoginBackgroundComponent } from './login-background/login-background.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoginBackgroundComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  returnUrl = '/';
  showPassword = false;
  private destroy$ = new Subject<void>();
  
  // Test account credentials for local development
  readonly testEmail = 'test@example.com';
  readonly testPassword = 'password123';
  
  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
  }
  
  ngOnInit() {
    // Initialize the form
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    
    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    
    const email = this.f['email'].value;
    const password = this.f['password'].value;
    
    // Dispatch login action to NgRx
    this.store.dispatch(AuthActions.login({ email, password }));
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