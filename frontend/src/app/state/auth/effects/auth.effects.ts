import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../../../services/auth/auth.service';
import { UserService } from '../../../services/api/user.service';
import * as AuthActions from '../actions/auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          switchMap(success => {
            if (success) {
              // After successful login, fetch current user data
              return this.userService.fetchCurrentUser().pipe(
                switchMap(() => {
                  // Get the auth user info from auth service
                  return this.authService.getCurrentUser().pipe(
                    map(authUser => {
                      // Map auth user to state user model
                      const user = {
                        id: 1, // Placeholder ID
                        email: authUser.email,
                        username: authUser.email,
                        firstName: authUser.name?.split(' ')[0] || '',
                        lastName: authUser.name?.split(' ').slice(1).join(' ') || ''
                      };
                      const token = this.authService.getToken() || '';
                      return AuthActions.loginSuccess({ user, token });
                    }),
                    catchError(() => {
                      // If fetching user fails, still try to proceed with basic info
                      const token = this.authService.getToken() || '';
                      const user = {
                        id: 1,
                        email: email,
                        username: email,
                        firstName: '',
                        lastName: ''
                      };
                      return of(AuthActions.loginSuccess({ user, token }));
                    })
                  );
                })
              );
            } else {
              return of(AuthActions.loginFailure({ error: 'Invalid credentials' }));
            }
          }),
          catchError(error => 
            of(AuthActions.loginFailure({ 
              error: error?.error?.detail || 'Login failed' 
            }))
          )
        )
      )
    )
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ email, password, name }) => {
        // Parse the combined name into first and last
        const [firstName, ...lastNameParts] = (name || '').split(' ');
        const lastName = lastNameParts.join(' ');
        
        return this.authService.register(email, password, firstName || '', lastName || '').pipe(
          switchMap(() => {
            // After successful registration, auto-login
            return this.authService.login(email, password).pipe(
              switchMap(success => {
                if (success) {
                  // Fetch user data after login
                  return this.userService.fetchCurrentUser().pipe(
                    switchMap(() => {
                      return this.authService.getCurrentUser().pipe(
                        map(authUser => {
                          const user = {
                            id: 1,
                            email: authUser.email,
                            username: authUser.email,
                            firstName: authUser.name?.split(' ')[0] || '',
                            lastName: authUser.name?.split(' ').slice(1).join(' ') || ''
                          };
                          const token = this.authService.getToken() || '';
                          return AuthActions.registerSuccess({ user, token });
                        })
                      );
                    })
                  );
                } else {
                  return of(AuthActions.registerFailure({ 
                    error: 'Registration succeeded but login failed' 
                  }));
                }
              })
            );
          }),
          catchError(error => 
            of(AuthActions.registerFailure({ 
              error: error?.error?.detail || error?.error?.error || 'Registration failed' 
            }))
          )
        );
      })
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ user }) => {
        console.log('Login successful, navigating to home. User:', user);
        this.router.navigate(['/']);
      })
    ),
    { dispatch: false }
  );

  registerSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerSuccess),
      tap(({ user }) => {
        console.log('Registration successful, navigating to home. User:', user);
        this.router.navigate(['/']);
      })
    ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess()))
        )
      )
    )
  );

  logoutSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutSuccess),
      tap(() => {
        this.router.navigate(['/login']);
      })
    ),
    { dispatch: false }
  );

  loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      switchMap(() =>
        this.authService.getCurrentUser().pipe(
          switchMap(authUser => {
            // Also fetch full user data from UserService
            return this.userService.fetchCurrentUser().pipe(
              map(() => {
                const user = {
                  id: 1,
                  email: authUser.email,
                  username: authUser.email,
                  firstName: authUser.name?.split(' ')[0] || '',
                  lastName: authUser.name?.split(' ').slice(1).join(' ') || ''
                };
                return AuthActions.loadCurrentUserSuccess({ user });
              })
            );
          }),
          catchError(error => 
            of(AuthActions.loadCurrentUserFailure({ 
              error: 'Failed to load user' 
            }))
          )
        )
      )
    )
  );
}