/**
 * Token Refresh Integration Tests
 * ================================
 * Integration tests for the complete token refresh flow including:
 * - Interceptor and service interaction
 * - Multiple concurrent requests during refresh
 * - Error scenarios
 * - State management
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../../../frontend/src/app/interceptors/auth.interceptor';
import { AuthService } from '../../../frontend/src/app/services/auth/auth.service';
import { of, delay } from 'rxjs';

describe('Token Refresh Integration', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let authService: AuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup initial auth state
    localStorage.setItem('access_token', 'initial-token');
    localStorage.setItem('refresh_token', 'refresh-token');
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple 401 responses with single refresh', fakeAsync(() => {
      const requests = [
        httpClient.get('/api/data1'),
        httpClient.get('/api/data2'),
        httpClient.get('/api/data3')
      ];

      const results: any[] = [];
      requests.forEach((req, index) => {
        req.subscribe(
          data => results.push({ index, data }),
          error => results.push({ index, error })
        );
      });

      // All initial requests fail with 401
      tick();
      const initialRequests = httpTestingController.match(/\/api\/data\d/);
      expect(initialRequests.length).toBe(3);
      initialRequests.forEach(req => {
        req.flush(null, { status: 401, statusText: 'Unauthorized' });
      });

      // Expect single refresh request
      tick();
      const refreshReq = httpTestingController.expectOne('/auth/refresh');
      refreshReq.flush({
        access_token: 'new-token',
        token_type: 'Bearer',
        expires_in: 3600
      });

      // All requests should be retried with new token
      tick();
      const retriedRequests = httpTestingController.match(/\/api\/data\d/);
      expect(retriedRequests.length).toBe(3);
      retriedRequests.forEach((req, index) => {
        expect(req.request.headers.get('Authorization')).toBe('Bearer new-token');
        req.flush({ data: `response-${index}` });
      });

      tick();
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.data).toBeDefined();
        expect(result.error).toBeUndefined();
      });
    }));

    it('should not refresh for auth endpoints', () => {
      const authEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password'
      ];

      authEndpoints.forEach(endpoint => {
        httpClient.post(endpoint, {}).subscribe(
          () => {},
          () => {}
        );

        const req = httpTestingController.expectOne(endpoint);
        expect(req.request.headers.has('Authorization')).toBeFalsy();
        req.flush(null, { status: 401, statusText: 'Unauthorized' });
      });

      // Should not trigger any refresh requests
      httpTestingController.verify();
    });
  });

  describe('Token Expiry Handling', () => {
    it('should proactively refresh expired token', fakeAsync(() => {
      // Set expired token
      localStorage.setItem('token_expiry', (Date.now() - 1000).toString());

      // Getting token should trigger refresh
      const token = authService.getToken();
      expect(token).toBe('initial-token'); // Returns old token while refreshing

      tick();
      const refreshReq = httpTestingController.expectOne('/auth/refresh');
      refreshReq.flush({
        access_token: 'refreshed-token',
        token_type: 'Bearer',
        expires_in: 3600
      });

      tick();
      expect(localStorage.getItem('access_token')).toBe('refreshed-token');
    }));

    it('should handle refresh token expiry gracefully', fakeAsync(() => {
      httpClient.get('/api/protected').subscribe(
        () => fail('Should have failed'),
        error => expect(error).toBeDefined()
      );

      tick();
      const req = httpTestingController.expectOne('/api/protected');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();
      const refreshReq = httpTestingController.expectOne('/auth/refresh');
      refreshReq.flush(null, { status: 403, statusText: 'Forbidden' });

      tick();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    }));
  });

  describe('Error Recovery', () => {
    it('should handle network errors during refresh', fakeAsync(() => {
      httpClient.get('/api/data').subscribe(
        () => fail('Should have failed'),
        error => expect(error).toBeDefined()
      );

      tick();
      const req = httpTestingController.expectOne('/api/data');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();
      const refreshReq = httpTestingController.expectOne('/auth/refresh');
      refreshReq.error(new ErrorEvent('Network error', {
        message: 'Connection failed'
      }));

      tick();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should not enter infinite loop on persistent 401', fakeAsync(() => {
      let requestCount = 0;
      
      httpClient.get('/api/data').subscribe(
        () => fail('Should have failed'),
        error => expect(error).toBeDefined()
      );

      // Initial request
      tick();
      let req = httpTestingController.expectOne('/api/data');
      requestCount++;
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Refresh attempt
      tick();
      const refreshReq = httpTestingController.expectOne('/auth/refresh');
      refreshReq.flush({
        access_token: 'new-token',
        token_type: 'Bearer',
        expires_in: 3600
      });

      // Retry with new token
      tick();
      req = httpTestingController.expectOne('/api/data');
      requestCount++;
      req.flush(null, { status: 401, statusText: 'Still Unauthorized' });

      // Should not attempt another refresh
      tick(1000);
      httpTestingController.verify(); // No pending requests
      expect(requestCount).toBe(2); // Only initial and one retry
    }));
  });

  describe('State Synchronization', () => {
    it('should update auth state after successful refresh', fakeAsync(() => {
      let isAuthenticated = false;
      authService.isAuthenticated$.subscribe(value => isAuthenticated = value);

      httpClient.get('/api/data').subscribe();

      tick();
      const req = httpTestingController.expectOne('/api/data');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();
      const refreshReq = httpTestingController.expectOne('/auth/refresh');
      refreshReq.flush({
        access_token: 'new-token',
        token_type: 'Bearer',
        expires_in: 3600
      });

      tick();
      const retryReq = httpTestingController.expectOne('/api/data');
      retryReq.flush({ data: 'success' });

      tick();
      expect(isAuthenticated).toBe(true);
      expect(localStorage.getItem('access_token')).toBe('new-token');
    }));

    it('should clear auth state after failed refresh', fakeAsync(() => {
      let isAuthenticated = true;
      authService.isAuthenticated$.subscribe(value => isAuthenticated = value);

      httpClient.get('/api/data').subscribe(
        () => {},
        () => {}
      );

      tick();
      const req = httpTestingController.expectOne('/api/data');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick();
      const refreshReq = httpTestingController.expectOne('/auth/refresh');
      refreshReq.flush(null, { status: 401, statusText: 'Refresh failed' });

      tick();
      expect(isAuthenticated).toBe(false);
      expect(localStorage.getItem('access_token')).toBeNull();
    }));
  });
});