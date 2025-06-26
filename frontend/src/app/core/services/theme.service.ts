import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storageKey = 'darkMode';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'true') {
        this.setDarkMode(true);
      }
    }
  }

  setDarkMode(enabled: boolean): void {
    if (!this.isBrowser) return;
    const html = document.documentElement;
    if (enabled) {
      html.classList.add('dark-mode');
    } else {
      html.classList.remove('dark-mode');
    }
    localStorage.setItem(this.storageKey, String(enabled));
  }

  isDarkMode(): boolean {
    if (!this.isBrowser) return false;
    return document.documentElement.classList.contains('dark-mode');
  }
}

