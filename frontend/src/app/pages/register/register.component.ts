import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/api/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  error = '';
  showPassword = false;
  showConfirmPassword = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}
  
  ngOnInit() {
    // Initialize the form with validation
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }
  
  // Custom validator to check if passwords match
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }
  
  onSubmit() {
    if (this.registerForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    const { name, email, password } = this.registerForm.value;
    
    this.authService.register(email, password, name).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        // Auto-login after successful registration
        this.authService.login(email, password).subscribe({
          next: () => {
            // Fetch fresh user data after login to ensure navigation shows correct name
            this.userService.fetchCurrentUser().subscribe({
              next: () => {
                this.router.navigate(['/']);
              },
              error: () => {
                // Even if user fetch fails, still navigate
                this.router.navigate(['/']);
              }
            });
          },
          error: (error) => {
            // Registration succeeded but login failed - redirect to login
            this.router.navigate(['/login']);
          }
        });
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.detail || error.error?.error || 'Registration failed. Please try again.';
        console.error('Registration error:', error);
      }
    });
  }
  
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  hasError(field: string, error?: string): boolean {
    const control = this.registerForm.get(field);
    if (error) {
      return !!(control?.touched && control?.hasError(error));
    }
    return !!(control?.touched && control?.invalid);
  }
  
  goToLogin() {
    this.router.navigate(['/login']);
  }
}