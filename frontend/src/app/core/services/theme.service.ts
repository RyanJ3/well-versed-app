import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storageKey = 'darkMode';
  private isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  initializeTheme(): void {
    if (!this.isBrowser) {
      return;
    }

    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(this.storageKey) : null;

    if (stored === 'true') {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }
  }

  isDarkMode(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return document.documentElement.classList.contains('dark-mode');
  }

  setDarkMode(enabled: boolean): void {
    if (!this.isBrowser) {
      return;
    }

    if (enabled) {
      this.enableDarkMode();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, 'true');
      }
    } else {
      this.disableDarkMode();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, 'false');
      }
    }
  }

  private enableDarkMode(): void {
    if (!this.isBrowser) {
      return;
    }
    document.documentElement.classList.add('dark-mode');
  }

  private disableDarkMode(): void {
    if (!this.isBrowser) {
      return;
    }
    document.documentElement.classList.remove('dark-mode');
  }
}
