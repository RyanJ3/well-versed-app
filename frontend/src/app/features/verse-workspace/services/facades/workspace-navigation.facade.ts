import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BibleBook, BibleChapter } from '@models/bible';
import { WorkspaceMode } from '../../models/workspace-mode.enum';

export interface NavigationState {
  currentBook: BibleBook | null;
  currentChapter: number;
  currentBibleChapter: BibleChapter | null;
  mode: WorkspaceMode;
  availableChapters: BibleChapter[];
}

/**
 * Facade for workspace navigation and mode management
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceNavigationFacade {
  // State
  private stateSubject = new BehaviorSubject<NavigationState>({
    currentBook: null,
    currentChapter: 1,
    currentBibleChapter: null,
    mode: WorkspaceMode.CHAPTER,
    availableChapters: []
  });

  // Public observables
  state$ = this.stateSubject.asObservable();
  
  currentBook$ = this.state$.pipe(map(s => s.currentBook));
  currentChapter$ = this.state$.pipe(map(s => s.currentChapter));
  currentBibleChapter$ = this.state$.pipe(map(s => s.currentBibleChapter));
  mode$ = this.state$.pipe(map(s => s.mode));
  availableChapters$ = this.state$.pipe(map(s => s.availableChapters));

  // Computed
  hasNextChapter$ = this.state$.pipe(
    map(s => s.currentBook ? s.currentChapter < s.currentBook.totalChapters : false)
  );
  
  hasPreviousChapter$ = this.state$.pipe(
    map(s => s.currentChapter > 1)
  );

  constructor(private router: Router) {}

  // Actions
  setCurrentBook(book: BibleBook | null): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      currentBook: book,
      availableChapters: book?.chapters || []
    });
  }

  setCurrentChapter(chapter: number, bibleChapter: BibleChapter | null = null): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      currentChapter: chapter,
      currentBibleChapter: bibleChapter
    });
  }

  setMode(mode: WorkspaceMode): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      mode
    });
  }

  navigateToChapter(bookId: number, chapter: number): void {
    this.router.navigate([], {
      queryParams: { bookId, chapter },
      queryParamsHandling: 'merge'
    });
  }

  goToNextChapter(): void {
    const state = this.stateSubject.value;
    if (state.currentBook && state.currentChapter < state.currentBook.totalChapters) {
      this.navigateToChapter(state.currentBook.id, state.currentChapter + 1);
    }
  }

  goToPreviousChapter(): void {
    const state = this.stateSubject.value;
    if (state.currentBook && state.currentChapter > 1) {
      this.navigateToChapter(state.currentBook.id, state.currentChapter - 1);
    }
  }

  // Getters
  getCurrentState(): NavigationState {
    return this.stateSubject.value;
  }

  getCurrentMode(): WorkspaceMode {
    return this.stateSubject.value.mode;
  }

  hasNextChapter(): boolean {
    const state = this.stateSubject.value;
    return state.currentBook ? state.currentChapter < state.currentBook.totalChapters : false;
  }

  hasPreviousChapter(): boolean {
    return this.stateSubject.value.currentChapter > 1;
  }
}