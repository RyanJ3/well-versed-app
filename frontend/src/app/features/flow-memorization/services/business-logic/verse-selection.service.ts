import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { BaseVerse } from '../../models/verse-types.model';

export interface SelectionState {
  selectedVerseIds: Set<string>;
  lastSelectedIndex: number;
  selectionMode: 'single' | 'multiple' | 'range';
  anchor: string | null; // For range selection
}

/**
 * Service responsible for managing verse selection logic
 * Single responsibility: Handle all selection-related operations
 */
@Injectable({
  providedIn: 'root'
})
export class VerseSelectionService {
  private selectionState$ = new BehaviorSubject<SelectionState>({
    selectedVerseIds: new Set(),
    lastSelectedIndex: -1,
    selectionMode: 'single',
    anchor: null
  });
  
  // Public observables
  readonly selectedVerseIds$ = this.selectionState$.pipe(
    map(state => state.selectedVerseIds),
    distinctUntilChanged((a, b) => this.setsEqual(a, b))
  );
  
  readonly selectionCount$ = this.selectedVerseIds$.pipe(
    map(ids => ids.size)
  );
  
  readonly hasSelection$ = this.selectionCount$.pipe(
    map(count => count > 0)
  );
  
  readonly selectionMode$ = this.selectionState$.pipe(
    map(state => state.selectionMode),
    distinctUntilChanged()
  );
  
  /**
   * Select a single verse
   */
  selectSingle(verseCode: string, index = -1): void {
    const state = this.selectionState$.value;
    
    this.selectionState$.next({
      selectedVerseIds: new Set([verseCode]),
      lastSelectedIndex: index,
      selectionMode: 'single',
      anchor: verseCode
    });
  }
  
  /**
   * Toggle verse selection
   */
  toggleSelection(verseCode: string, index = -1): void {
    const state = this.selectionState$.value;
    const newSelectedIds = new Set(state.selectedVerseIds);
    
    if (newSelectedIds.has(verseCode)) {
      newSelectedIds.delete(verseCode);
    } else {
      newSelectedIds.add(verseCode);
    }
    
    this.selectionState$.next({
      ...state,
      selectedVerseIds: newSelectedIds,
      lastSelectedIndex: index,
      selectionMode: 'multiple'
    });
  }
  
  /**
   * Select range of verses
   */
  selectRange(verses: BaseVerse[], startIndex: number, endIndex: number): void {
    const [from, to] = startIndex < endIndex 
      ? [startIndex, endIndex] 
      : [endIndex, startIndex];
    
    const selectedVerseIds = new Set<string>();
    
    for (let i = from; i <= to && i < verses.length; i++) {
      selectedVerseIds.add(verses[i].verseCode);
    }
    
    this.selectionState$.next({
      selectedVerseIds,
      lastSelectedIndex: endIndex,
      selectionMode: 'range',
      anchor: verses[startIndex].verseCode
    });
  }
  
  /**
   * Add to selection
   */
  addToSelection(verseCodes: string[]): void {
    const state = this.selectionState$.value;
    const newSelectedIds = new Set(state.selectedVerseIds);
    
    verseCodes.forEach(code => newSelectedIds.add(code));
    
    this.selectionState$.next({
      ...state,
      selectedVerseIds: newSelectedIds,
      selectionMode: 'multiple'
    });
  }
  
  /**
   * Remove from selection
   */
  removeFromSelection(verseCodes: string[]): void {
    const state = this.selectionState$.value;
    const newSelectedIds = new Set(state.selectedVerseIds);
    
    verseCodes.forEach(code => newSelectedIds.delete(code));
    
    this.selectionState$.next({
      ...state,
      selectedVerseIds: newSelectedIds
    });
  }
  
  /**
   * Select all verses
   */
  selectAll(verses: BaseVerse[]): void {
    const selectedVerseIds = new Set(verses.map(v => v.verseCode));
    
    this.selectionState$.next({
      selectedVerseIds,
      lastSelectedIndex: verses.length - 1,
      selectionMode: 'multiple',
      anchor: verses[0]?.verseCode || null
    });
  }
  
  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectionState$.next({
      selectedVerseIds: new Set(),
      lastSelectedIndex: -1,
      selectionMode: 'single',
      anchor: null
    });
  }
  
  /**
   * Handle complex selection with keyboard modifiers
   */
  handleSelection(
    verse: BaseVerse,
    index: number,
    verses: BaseVerse[],
    event: MouseEvent | KeyboardEvent
  ): void {
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const state = this.selectionState$.value;
    
    if (shift && state.lastSelectedIndex >= 0) {
      // Range selection
      this.selectRange(verses, state.lastSelectedIndex, index);
    } else if (ctrl) {
      // Multi-selection
      this.toggleSelection(verse.verseCode, index);
    } else {
      // Single selection
      this.selectSingle(verse.verseCode, index);
    }
  }
  
  /**
   * Get selected verses from a list
   */
  getSelectedVerses(verses: BaseVerse[]): BaseVerse[] {
    const selectedIds = this.selectionState$.value.selectedVerseIds;
    return verses.filter(v => selectedIds.has(v.verseCode));
  }
  
  /**
   * Check if verse is selected
   */
  isSelected(verseCode: string): boolean {
    return this.selectionState$.value.selectedVerseIds.has(verseCode);
  }
  
  /**
   * Get selection statistics
   */
  getSelectionStats(): {
    count: number;
    mode: string;
    hasAnchor: boolean;
  } {
    const state = this.selectionState$.value;
    return {
      count: state.selectedVerseIds.size,
      mode: state.selectionMode,
      hasAnchor: state.anchor !== null
    };
  }
  
  /**
   * Invert selection
   */
  invertSelection(allVerses: BaseVerse[]): void {
    const state = this.selectionState$.value;
    const newSelectedIds = new Set<string>();
    
    allVerses.forEach(verse => {
      if (!state.selectedVerseIds.has(verse.verseCode)) {
        newSelectedIds.add(verse.verseCode);
      }
    });
    
    this.selectionState$.next({
      ...state,
      selectedVerseIds: newSelectedIds,
      selectionMode: 'multiple'
    });
  }
  
  /**
   * Select by predicate
   */
  selectByPredicate(verses: BaseVerse[], predicate: (verse: BaseVerse) => boolean): void {
    const selectedVerseIds = new Set<string>();
    
    verses.forEach(verse => {
      if (predicate(verse)) {
        selectedVerseIds.add(verse.verseCode);
      }
    });
    
    this.selectionState$.next({
      selectedVerseIds,
      lastSelectedIndex: -1,
      selectionMode: 'multiple',
      anchor: null
    });
  }
  
  /**
   * Save selection
   */
  saveSelection(): SelectionState {
    return { ...this.selectionState$.value };
  }
  
  /**
   * Restore selection
   */
  restoreSelection(state: SelectionState): void {
    this.selectionState$.next(state);
  }
  
  /**
   * Check if two sets are equal
   */
  private setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }
}