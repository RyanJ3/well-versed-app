/**
 * Auth Interceptor Tests
 * ======================
 * Tests for the auth interceptor functionality including:
 * - Token injection
 * - Token refresh on 401
 * - Request queuing during refresh
 * - Error handling
 */

import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, HttpRequest, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authInterceptor } from '../../app/interceptors/auth.interceptor';
import { AuthService } from '../../app/services/auth/auth.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'refreshToken',
      'logout'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Token Injection', () => {
    it('should add Authorization header when token exists', () => {
      const mockToken = 'test-token-123';
      authService.getToken.and.returnValue(mockToken);

      httpClient.get('/api/test').subscribe();

      const req = httpTestingController.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should not add Authorization header when no token exists', () => {
      authService.getToken.and.returnValue(null);

      httpClient.get('/api/test').subscribe();

      const req = httpTestingController.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBeFalsy();
      req.flush({});
    });

    it('should not add token to auth endpoints', () => {
      authService.getToken.and.returnValue('test-token');

      httpClient.post('/auth/login', {}).subscribe();

      const req = httpTestingController.expectOne('/auth/login');
      expect(req.request.headers.has('Authorization')).toBeFalsy();
      req.flush({});
    });
  });

  describe('401 Error Handling', () => {
    it('should attempt token refresh on 401 error', (done) => {
      authService.getToken.and.returnValue('old-token');
      authService.refreshToken.and.returnValue(of(true));

      httpClient.get('/api/test').subscribe({
        next: () => done(),
        error: () => fail('Should have succeeded after refresh')
      });

      // First request fails with 401
      const req1 = httpTestingController.expectOne('/api/test');
      req1.flush(null, { status: 401, statusText: 'Unauthorized' });

      // After refresh, retry should succeed
      setTimeout(() => {
        const req2 = httpTestingController.expectOne('/api/test');
        req2.flush({});
      }, 100);
    });

    it('should redirect to login when refresh fails', (done) => {
      authService.getToken.and.returnValue('old-token');
      authService.refreshToken.and.returnValue(of(false));

      httpClient.get('/api/test').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(authService.logout).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        }
      });

      const req = httpTestingController.expectOne('/api/test');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });

    it('should queue multiple requests during token refresh', (done) => {
      authService.getToken.and.returnValue('old-token');
      authService.refreshToken.and.returnValue(of(true));

      let completedRequests = 0;
      const checkComplete = () => {
        completedRequests++;
        if (completedRequests === 3) done();
      };

      // Fire 3 requests simultaneously
      httpClient.get('/api/test1').subscribe({ next: checkComplete });
      httpClient.get('/api/test2').subscribe({ next: checkComplete });
      httpClient.get('/api/test3').subscribe({ next: checkComplete });

      // All requests should fail with 401
      const req1 = httpTestingController.expectOne('/api/test1');
      const req2 = httpTestingController.expectOne('/api/test2');
      const req3 = httpTestingController.expectOne('/api/test3');

      req1.flush(null, { status: 401, statusText: 'Unauthorized' });
      req2.flush(null, { status: 401, statusText: 'Unauthorized' });
      req3.flush(null, { status: 401, statusText: 'Unauthorized' });

      // After refresh, all should be retried
      setTimeout(() => {
        httpTestingController.match((req) => /\/api\/test\d/.test(req.url)).forEach(req => {
          req.flush({});
        });
      }, 100);
    });
  });

  describe('403 Error Handling', () => {
    it('should logout and redirect on 403 from refresh endpoint', (done) => {
      authService.getToken.and.returnValue('refresh-token');

      httpClient.post('/auth/refresh', {}).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Session expired');
          expect(authService.logout).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        }
      });

      const req = httpTestingController.expectOne('/auth/refresh');
      req.flush(null, { status: 403, statusText: 'Forbidden' });
    });

    it('should pass through 403 errors from non-refresh endpoints', (done) => {
      authService.getToken.and.returnValue('token');

      httpClient.get('/api/forbidden').subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(403);
          expect(authService.logout).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpTestingController.expectOne('/api/forbidden');
      req.flush(null, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('Auth Endpoint Handling', () => {
    const authEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password'
    ];

    authEndpoints.forEach(endpoint => {
      it(`should skip auth for ${endpoint}`, () => {
        authService.getToken.and.returnValue('token');

        httpClient.post(endpoint, {}).subscribe();

        const req = httpTestingController.expectOne(endpoint);
        expect(req.request.headers.has('Authorization')).toBeFalsy();
        req.flush({});
      });
    });
  });
});