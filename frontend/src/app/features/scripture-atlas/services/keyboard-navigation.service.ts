import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeyboardNavigationService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private shortcuts = new Map<string, () => void>();
  private isEnabled = true;
  
  constructor() {
    this.initializeKeyboardListeners();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeKeyboardListeners() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (!this.isEnabled) return;
        
        // Don't trigger if user is typing in an input
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.tagName === 'SELECT') {
          return;
        }
        
        // Build shortcut key
        const key = this.buildShortcutKey(event);
        
        // Execute shortcut if exists
        const handler = this.shortcuts.get(key);
        if (handler) {
          event.preventDefault();
          handler();
        }
      });
  }
  
  private buildShortcutKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');
    
    // Normalize key
    let key = event.key.toLowerCase();
    
    // Handle special keys
    switch (key) {
      case 'arrowleft': key = 'left'; break;
      case 'arrowright': key = 'right'; break;
      case 'arrowup': key = 'up'; break;
      case 'arrowdown': key = 'down'; break;
      case ' ': key = 'space'; break;
      case 'escape': key = 'esc'; break;
    }
    
    parts.push(key);
    
    return parts.join('+');
  }
  
  /**
   * Register a keyboard shortcut
   * @param shortcut - e.g., 'ctrl+s', 'j', 'shift+left'
   * @param handler - Function to execute
   * @param description - Optional description for accessibility
   */
  registerShortcut(shortcut: string, handler: () => void, description?: string): void {
    this.shortcuts.set(shortcut.toLowerCase(), handler);
    
    // Store description for help dialog
    if (description) {
      this.storeShortcutDescription(shortcut, description);
    }
  }
  
  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(shortcut: string): void {
    this.shortcuts.delete(shortcut.toLowerCase());
  }
  
  /**
   * Temporarily disable all shortcuts
   */
  disable(): void {
    this.isEnabled = false;
  }
  
  /**
   * Re-enable shortcuts
   */
  enable(): void {
    this.isEnabled = true;
  }
  
  /**
   * Get all registered shortcuts (for help dialog)
   */
  getShortcuts(): Map<string, string> {
    return this.shortcutDescriptions;
  }
  
  private shortcutDescriptions = new Map<string, string>();
  
  private storeShortcutDescription(shortcut: string, description: string): void {
    this.shortcutDescriptions.set(shortcut, description);
  }
  
  /**
   * Common shortcuts for atlas navigation
   */
  registerAtlasShortcuts(handlers: {
    toggleJourneyPanel?: () => void;
    toggleSegmentDetails?: () => void;
    nextSegment?: () => void;
    previousSegment?: () => void;
    resetView?: () => void;
    changeView?: (view: string) => void;
    showHelp?: () => void;
  }): void {
    // Journey panel
    if (handlers.toggleJourneyPanel) {
      this.registerShortcut('j', handlers.toggleJourneyPanel, 'Toggle journey panel');
    }
    
    // Segment details
    if (handlers.toggleSegmentDetails) {
      this.registerShortcut('d', handlers.toggleSegmentDetails, 'Toggle segment details');
      this.registerShortcut('i', handlers.toggleSegmentDetails, 'Show segment info');
    }
    
    // Navigation
    if (handlers.nextSegment) {
      this.registerShortcut('right', handlers.nextSegment, 'Next segment');
      this.registerShortcut('n', handlers.nextSegment, 'Next segment');
    }
    
    if (handlers.previousSegment) {
      this.registerShortcut('left', handlers.previousSegment, 'Previous segment');
      this.registerShortcut('p', handlers.previousSegment, 'Previous segment');
    }
    
    if (handlers.resetView) {
      this.registerShortcut('r', handlers.resetView, 'Reset view (show full journey)');
      this.registerShortcut('0', handlers.resetView, 'Reset view');
    }
    
    // View modes
    if (handlers.changeView) {
      this.registerShortcut('1', () => handlers.changeView!('2d'), '2D map view');
      this.registerShortcut('2', () => handlers.changeView!('3d'), '3D terrain view');
      this.registerShortcut('3', () => handlers.changeView!('historical'), 'Historical view');
    }
    
    // Help
    if (handlers.showHelp) {
      this.registerShortcut('?', handlers.showHelp, 'Show keyboard shortcuts');
      this.registerShortcut('shift+/', handlers.showHelp, 'Show help');
      this.registerShortcut('h', handlers.showHelp, 'Show help');
    }
    
    // Escape key for closing panels
    this.registerShortcut('esc', () => {
      // This will be handled by individual components
      document.dispatchEvent(new CustomEvent('escape-pressed'));
    }, 'Close active panel');
  }
}