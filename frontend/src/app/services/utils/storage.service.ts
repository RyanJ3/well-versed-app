import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getItem(key: string): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(key);
  }

  getSessionItem(key: string): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(key);
  }

  setSessionItem(key: string, value: string): void {
    if (!this.isBrowser) return;
    sessionStorage.setItem(key, value);
  }

  removeSessionItem(key: string): void {
    if (!this.isBrowser) return;
    sessionStorage.removeItem(key);
  }
}
