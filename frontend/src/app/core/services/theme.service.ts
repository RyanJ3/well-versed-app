import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storageKey = 'darkMode';

  initializeTheme(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (stored === 'true') {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }
  }

  isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark-mode');
  }

  setDarkMode(enabled: boolean): void {
    if (enabled) {
      this.enableDarkMode();
      localStorage.setItem(this.storageKey, 'true');
    } else {
      this.disableDarkMode();
      localStorage.setItem(this.storageKey, 'false');
    }
  }

  private enableDarkMode(): void {
    document.documentElement.classList.add('dark-mode');
  }

  private disableDarkMode(): void {
    document.documentElement.classList.remove('dark-mode');
  }
}
