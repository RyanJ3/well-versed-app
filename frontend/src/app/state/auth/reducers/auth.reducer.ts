import { createReducer, on } from '@ngrx/store';
import { initialAuthState } from '../models/auth.model';
import * as AuthActions from '../actions/auth.actions';

export const authReducer = createReducer(
  initialAuthState,
  
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true
  })),
  
  on(AuthActions.logoutSuccess, () => initialAuthState),
  
  on(AuthActions.loadCurrentUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.loadCurrentUserSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  
  on(AuthActions.loadCurrentUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(AuthActions.updateUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.updateUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null
  })),
  
  on(AuthActions.updateUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(AuthActions.clearAuthError, (state) => ({
    ...state,
    error: null
  }))
);