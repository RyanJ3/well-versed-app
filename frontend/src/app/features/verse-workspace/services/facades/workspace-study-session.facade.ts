import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WorkspaceUIStateService } from '../state/workspace-ui-state.service';
import { WorkspaceSelectionService } from '../state/workspace-selection.service';
import { WorkspaceVerse, ModalVerse } from '../../models/workspace.models';
import { BibleBook } from '@models/bible';

@Injectable()
export class WorkspaceStudySessionFacade {
  private modalVersesSubject = new BehaviorSubject<ModalVerse[]>([]);
  public modalVerses$ = this.modalVersesSubject.asObservable();

  constructor(
    private uiStateService: WorkspaceUIStateService,
    private selectionService: WorkspaceSelectionService
  ) {}

  get modalVerses(): ModalVerse[] {
    return this.modalVersesSubject.value;
  }

  get showModal$(): Observable<boolean> {
    return this.uiStateService.state$.pipe(
      state => new Observable(observer => {
        observer.next((state as any).showModal);
      })
    );
  }

  get modalChapterName$(): Observable<string> {
    return this.uiStateService.state$.pipe(
      state => new Observable(observer => {
        observer.next((state as any).modalChapterName);
      })
    );
  }

  get showModal(): boolean {
    return this.uiStateService.currentState.showModal;
  }

  get modalChapterName(): string {
    return this.uiStateService.currentState.modalChapterName;
  }

  startStudySession(verses: WorkspaceVerse[], currentBook: BibleBook | null, currentChapter: number) {
    const selectedVerseObjects = verses.filter(v =>
      this.selectionService.selectedVerses.has(v.verseCode)
    );
    
    const modalVerses = selectedVerseObjects.map(v => ({
      code: v.verseCode,
      text: v.text.replace(/¶\s*/g, ''),
      reference: v.reference,
      bookId: currentBook?.id || 0,
      chapter: v.chapter,
      verse: v.verse
    }));
    
    this.modalVersesSubject.next(modalVerses);
    this.uiStateService.setModalState(true, `${currentBook?.name} ${currentChapter}`);
  }

  startFullChapterSession(verses: WorkspaceVerse[], currentBook: BibleBook | null, currentChapter: number) {
    const modalVerses = verses.map(v => ({
      code: v.verseCode,
      text: v.text.replace(/¶\s*/g, ''),
      reference: v.reference,
      bookId: currentBook?.id || 0,
      chapter: v.chapter,
      verse: v.verse
    }));
    
    this.modalVersesSubject.next(modalVerses);
    this.uiStateService.setModalState(true, `${currentBook?.name} ${currentChapter}`);
  }

  onModalCompleted(event: { memorized: boolean }): { shouldReload: boolean; bookId?: number; chapter?: number } {
    this.uiStateService.setModalState(false);
    
    if (event.memorized) {
      const firstVerse = this.modalVersesSubject.value[0];
      if (firstVerse) {
        return {
          shouldReload: true,
          bookId: firstVerse.bookId,
          chapter: firstVerse.chapter
        };
      }
    }
    
    return { shouldReload: false };
  }

  clearModalVerses() {
    this.modalVersesSubject.next([]);
  }
}