import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService } from '../../services/utils/notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  returnUrl: string = '/';
  showPassword = false;
  errorMessage: string = '';
  isDevelopment = !environment.production;
  attemptsRemaining: number = 3;
  isAccountLocked = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Clear any previous error messages
    this.errorMessage = '';
    
    // If already logged in, redirect
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (user) => {
        this.notificationService.showSuccess(`Welcome back, ${user.username}!`);
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        
        // Parse attempts remaining from headers or error detail
        const rateLimitHeader = error.headers?.get('X-RateLimit-Remaining');
        if (rateLimitHeader !== null) {
          this.attemptsRemaining = parseInt(rateLimitHeader, 10);
        }
        
        if (error.status === 429) {
          // Rate limit exceeded - account locked
          this.isAccountLocked = true;
          this.attemptsRemaining = 0;
          this.errorMessage = error.error?.detail || 'Too many failed attempts. Account temporarily locked.';
        } else if (error.status === 401) {
          // Parse attempts from error detail if available
          const detail = error.error?.detail || '';
          if (detail.includes('attempt') && detail.includes('remaining')) {
            const match = detail.match(/(\d+) attempts? remaining/);
            if (match) {
              this.attemptsRemaining = parseInt(match[1], 10);
            }
          } else if (detail.includes('Account locked')) {
            this.isAccountLocked = true;
            this.attemptsRemaining = 0;
          }
          this.errorMessage = detail || 'Invalid email or password';
        } else if (error.status === 403) {
          this.errorMessage = 'Authentication error. Please try again.';
        } else if (error.error?.detail) {
          this.errorMessage = error.error.detail;
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'An error occurred. Please try again.';
        }
        
        // Show warning if only 1 attempt remaining
        if (this.attemptsRemaining === 1) {
          this.notificationService.showWarning('Warning: Only 1 login attempt remaining before account lockout');
        } else if (this.isAccountLocked) {
          this.notificationService.showError('Account locked. Please wait before trying again.');
        } else {
          this.notificationService.showError(this.errorMessage);
        }
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Test account helper - only shown in development mode
  useTestAccount(): void {
    // Only available in development environments
    if (!environment.production) {
      // Credentials should be provided via environment or user documentation
      this.notificationService.showInfo('Please refer to development documentation for test credentials');
    }
  }
}