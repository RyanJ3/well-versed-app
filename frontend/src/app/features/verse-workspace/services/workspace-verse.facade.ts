import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WorkspaceVerse } from '../models/workspace.models';

/**
 * Facade service for verse state management
 * 
 * This facade currently manages state internally but is designed to be easily
 * converted to NgRx by:
 * 1. Injecting Store instead of managing BehaviorSubjects
 * 2. Replacing state updates with store.dispatch() calls
 * 3. Replacing state selectors with store.select() calls
 * 
 * The public API will remain the same, making the transition seamless.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceVerseFacade {
  // State (will be replaced with Store selectors)
  private versesSubject = new BehaviorSubject<WorkspaceVerse[]>([]);
  private selectedVersesSubject = new BehaviorSubject<Set<string>>(new Set());
  private isSelectingMultipleSubject = new BehaviorSubject<boolean>(false);

  // Public observables (will be replaced with store.select())
  verses$ = this.versesSubject.asObservable();
  selectedVerses$ = this.selectedVersesSubject.asObservable();
  isSelectingMultiple$ = this.isSelectingMultipleSubject.asObservable();

  // Computed selectors
  selectedVersesArray$ = this.selectedVerses$.pipe(
    map(set => Array.from(set))
  );

  hasSelection$ = this.selectedVerses$.pipe(
    map(set => set.size > 0)
  );

  // When we add NgRx, constructor will inject Store
  constructor() {}

  // Actions (will become store.dispatch() calls)
  loadVerses(verses: WorkspaceVerse[]): void {
    // Future: this.store.dispatch(loadVerses({ verses }));
    this.versesSubject.next(verses);
  }

  selectVerse(verseCode: string, multiSelect: boolean = false): void {
    // Future: this.store.dispatch(selectVerse({ verseCode, multiSelect }));
    const currentSelection = new Set(this.selectedVersesSubject.value);
    
    if (multiSelect) {
      if (currentSelection.has(verseCode)) {
        currentSelection.delete(verseCode);
      } else {
        currentSelection.add(verseCode);
      }
    } else {
      currentSelection.clear();
      currentSelection.add(verseCode);
    }
    
    this.selectedVersesSubject.next(currentSelection);
  }

  selectRange(startIndex: number, endIndex: number): void {
    // Future: this.store.dispatch(selectRange({ startIndex, endIndex }));
    const verses = this.versesSubject.value;
    const selection = new Set<string>();
    const min = Math.min(startIndex, endIndex);
    const max = Math.max(startIndex, endIndex);
    
    for (let i = min; i <= max; i++) {
      if (verses[i]) {
        selection.add(verses[i].verseCode);
      }
    }
    
    this.selectedVersesSubject.next(selection);
    this.isSelectingMultipleSubject.next(true);
  }

  clearSelection(): void {
    // Future: this.store.dispatch(clearSelection());
    this.selectedVersesSubject.next(new Set());
    this.isSelectingMultipleSubject.next(false);
  }

  selectAll(): void {
    // Future: this.store.dispatch(selectAll());
    const verses = this.versesSubject.value;
    const selection = new Set<string>();
    
    verses.forEach(verse => selection.add(verse.verseCode));
    this.selectedVersesSubject.next(selection);
  }

  toggleVerseMemorized(verse: WorkspaceVerse): void {
    // Future: this.store.dispatch(toggleVerseMemorized({ verseCode: verse.verseCode }));
    const verses = [...this.versesSubject.value];
    const index = verses.findIndex(v => v.verseCode === verse.verseCode);
    
    if (index !== -1) {
      verses[index] = {
        ...verses[index],
        isMemorized: !verses[index].isMemorized
      };
      this.versesSubject.next(verses);
    }
  }

  markSelectedAsMemorized(memorized: boolean): void {
    // Future: this.store.dispatch(markSelectedAsMemorized({ memorized }));
    const verses = [...this.versesSubject.value];
    const selection = this.selectedVersesSubject.value;
    
    selection.forEach(verseCode => {
      const index = verses.findIndex(v => v.verseCode === verseCode);
      if (index !== -1) {
        verses[index] = {
          ...verses[index],
          isMemorized: memorized
        };
      }
    });
    
    this.versesSubject.next(verses);
    this.clearSelection();
  }

  // Getters for current state (will use store snapshot)
  getCurrentVerses(): WorkspaceVerse[] {
    return this.versesSubject.value;
  }

  getSelectedVerses(): Set<string> {
    return this.selectedVersesSubject.value;
  }

  isVerseSelected(verseCode: string): boolean {
    return this.selectedVersesSubject.value.has(verseCode);
  }
  
  isVerseSelectedByIndex(index: number): boolean {
    const verses = this.versesSubject.value;
    if (verses[index]) {
      return this.selectedVersesSubject.value.has(verses[index].verseCode);
    }
    return false;
  }
}