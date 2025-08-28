/**
 * Auth Service Tests
 * ==================
 * Tests for the authentication service including:
 * - Login/logout functionality
 * - Token management
 * - Token refresh
 * - Type safety of responses
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../app/services/auth/auth.service';
import { TokenResponse, RegisterResponse, AuthHealthResponse } from '../../app/models/auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    // Mock localStorage
    const store: { [key: string]: string } = {};
    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem', 'removeItem', 'clear']);
    localStorageSpy.getItem.and.callFake((key: string) => store[key] || null);
    localStorageSpy.setItem.and.callFake((key: string, value: string) => {
      store[key] = value;
    });
    localStorageSpy.removeItem.and.callFake((key: string) => {
      delete store[key];
    });
    localStorageSpy.clear.and.callFake(() => {
      Object.keys(store).forEach(key => delete store[key]);
    });

    Object.defineProperty(window, 'localStorage', {
      value: localStorageSpy,
      writable: true
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
    localStorageSpy.clear();
  });

  describe('Type Safety', () => {
    it('should return RegisterResponse type from register()', (done) => {
      const mockResponse: RegisterResponse = {
        message: 'Registration successful',
        user: {
          user_id: '123',
          email: 'test@example.com',
          username: 'test@example.com',
          email_verified: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          enabled: true
        }
      };

      service.register('test@example.com', 'password', 'Test User').subscribe((response: RegisterResponse) => {
        expect(response.message).toBe(mockResponse.message);
        expect(response.user.email).toBe(mockResponse.user.email);
        done();
      });

      const req = httpMock.expectOne(`${service['API_URL']}/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should return AuthHealthResponse type from checkAuthHealth()', (done) => {
      const mockResponse: AuthHealthResponse = {
        status: 'healthy',
        message: 'Auth service is healthy',
        auth_provider: 'local',
        timestamp: '2024-01-01T00:00:00Z'
      };

      service.checkAuthHealth().subscribe((response: AuthHealthResponse) => {
        expect(response.status).toBe('healthy');
        expect(response.auth_provider).toBe('local');
        done();
      });

      const req = httpMock.expectOne(`${service['API_URL']}/health`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Token Management', () => {
    it('should store token with expiry time', () => {
      const token = 'test-token';
      const expiresIn = 3600; // 1 hour
      
      service['setToken'](token, expiresIn);
      
      expect(localStorageSpy.setItem).toHaveBeenCalledWith('access_token', token);
      expect(localStorageSpy.setItem).toHaveBeenCalledWith(
        'token_expiry',
        jasmine.stringMatching(/^\d+$/)
      );
    });

    it('should return null for expired token', () => {
      const token = 'expired-token';
      const pastExpiry = (new Date().getTime() - 1000).toString();
      
      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'access_token') return token;
        if (key === 'token_expiry') return pastExpiry;
        return null;
      });

      spyOn(service, 'refreshToken').and.returnValue(of(true));
      
      const result = service.getToken();
      
      expect(result).toBe(token); // Returns token while refresh happens
      expect(service.refreshToken).toHaveBeenCalled();
    });

    it('should return token when not expired', () => {
      const token = 'valid-token';
      const futureExpiry = (new Date().getTime() + 10000).toString();
      
      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'access_token') return token;
        if (key === 'token_expiry') return futureExpiry;
        return null;
      });

      const result = service.getToken();
      
      expect(result).toBe(token);
    });
  });

  describe('Login', () => {
    it('should login successfully and store tokens', (done) => {
      const mockResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'Bearer'
      };

      service.login('test@example.com', 'password').subscribe(result => {
        expect(result).toBe(true);
        expect(localStorageSpy.setItem).toHaveBeenCalledWith('access_token', 'access-token');
        expect(localStorageSpy.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
        expect(localStorageSpy.setItem).toHaveBeenCalledWith('token_expiry', jasmine.any(String));
        done();
      });

      const req = httpMock.expectOne(`${service['API_URL']}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        username: 'test@example.com',
        password: 'password'
      });
      req.flush(mockResponse);

      // Verify getCurrentUser is called after login
      const userReq = httpMock.expectOne(`${service['API_URL']}/me`);
      userReq.flush({ id: 1, email: 'test@example.com' });
    });

    it('should handle login failure', (done) => {
      service.login('test@example.com', 'wrong-password').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(localStorageSpy.setItem).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(`${service['API_URL']}/login`);
      req.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', (done) => {
      const mockResponse: RefreshTokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'refresh_token') return 'refresh-token';
        return null;
      });

      service.refreshToken().subscribe(result => {
        expect(result).toBe(true);
        expect(localStorageSpy.setItem).toHaveBeenCalledWith('access_token', 'new-access-token');
        done();
      });

      const req = httpMock.expectOne(`${service['API_URL']}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer refresh-token');
      req.flush(mockResponse);
    });

    it('should return false when no refresh token available', (done) => {
      localStorageSpy.getItem.and.returnValue(null);

      service.refreshToken().subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should handle refresh token failure', (done) => {
      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'refresh_token') return 'invalid-refresh-token';
        return null;
      });

      service.refreshToken().subscribe(result => {
        expect(result).toBe(false);
        expect(localStorageSpy.removeItem).toHaveBeenCalledWith('access_token');
        expect(localStorageSpy.removeItem).toHaveBeenCalledWith('refresh_token');
        done();
      });

      const req = httpMock.expectOne(`${service['API_URL']}/refresh`);
      req.flush({ error: 'Invalid token' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Logout', () => {
    it('should clear all auth data and redirect to login', () => {
      service.logout();

      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('token_expiry');
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should update observables on logout', (done) => {
      service.isAuthenticated$.subscribe(isAuth => {
        if (!isAuth) {
          expect(isAuth).toBe(false);
          done();
        }
      });

      service.logout();
    });
  });

  describe('Register', () => {
    it('should register with name', (done) => {
      const mockResponse: RegisterResponse = {
        message: 'Registration successful',
        user: {
          user_id: '123',
          email: 'test@example.com',
          username: 'test@example.com',
          name: 'Test User',
          email_verified: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          enabled: true
        }
      };

      service.register('test@example.com', 'password', 'Test User').subscribe(response => {
        expect(response.user.name).toBe('Test User');
        done();
      });

      const req = httpMock.expectOne(`${service['API_URL']}/register`);
      expect(req.request.body).toEqual({
        username: 'test@example.com',
        password: 'password',
        name: 'Test User'
      });
      req.flush(mockResponse);
    });

    it('should register without name', (done) => {
      const mockResponse: RegisterResponse = {
        message: 'Registration successful',
        user: {
          user_id: '123',
          email: 'test@example.com',
          username: 'test@example.com',
          email_verified: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          enabled: true
        }
      };

      service.register('test@example.com', 'password').subscribe(response => {
        expect(response.user.name).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne(`${service['API_URL']}/register`);
      expect(req.request.body.name).toBeUndefined();
      req.flush(mockResponse);
    });
  });
});

// Import for RefreshTokenResponse
import { of } from 'rxjs';
import { RefreshTokenResponse } from '../../app/models/auth.models';