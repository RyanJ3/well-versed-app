/**
 * Authentication Models
 * =====================
 * TypeScript interfaces for authentication-related data structures
 */

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
}

export interface AuthUser {
  user_id: string;
  email: string;
  username: string;
  name?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  attributes?: Record<string, any>;
  groups?: string[];
  enabled: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: TokenResponse;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
  tokens?: TokenResponse;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthHealthResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  auth_provider?: string;
  timestamp?: string;
}

export interface AuthError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}