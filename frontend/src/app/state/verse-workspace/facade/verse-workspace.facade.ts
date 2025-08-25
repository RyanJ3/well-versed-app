import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../app.state';
import * as VerseWorkspaceActions from '../actions/verse-workspace.actions';
import * as VerseWorkspaceSelectors from '../selectors/verse-workspace.selectors';
import { WorkspaceVerse, ModalVerse } from '@features/verse-workspace/models/workspace.models';
import { BibleBook, BibleChapter } from '@models/bible';
import { CrossReferenceSelection, Topic, ContextMenuState } from '../models/verse-workspace.state';

@Injectable({
  providedIn: 'root'
})
export class VerseWorkspaceFacade {
  // Core observables
  currentBook$ = this.store.select(VerseWorkspaceSelectors.selectCurrentBook);
  currentChapter$ = this.store.select(VerseWorkspaceSelectors.selectCurrentChapter);
  currentBibleChapter$ = this.store.select(VerseWorkspaceSelectors.selectCurrentBibleChapter);
  verses$ = this.store.select(VerseWorkspaceSelectors.selectVerses);
  filteredVerses$ = this.store.select(VerseWorkspaceSelectors.selectFilteredVerses);
  
  // Cross References
  crossReferenceVerses$ = this.store.select(VerseWorkspaceSelectors.selectCrossReferenceVerses);
  selectedCrossRefVerse$ = this.store.select(VerseWorkspaceSelectors.selectSelectedCrossRefVerse);
  crossReferencesLoading$ = this.store.select(VerseWorkspaceSelectors.selectCrossReferencesLoading);
  crossReferenceCount$ = this.store.select(VerseWorkspaceSelectors.selectCrossReferenceCount);
  
  // Topical
  topicalVerses$ = this.store.select(VerseWorkspaceSelectors.selectTopicalVerses);
  selectedTopic$ = this.store.select(VerseWorkspaceSelectors.selectSelectedTopic);
  availableTopics$ = this.store.select(VerseWorkspaceSelectors.selectAvailableTopics);
  topicalLoading$ = this.store.select(VerseWorkspaceSelectors.selectTopicalLoading);
  topicalVerseCount$ = this.store.select(VerseWorkspaceSelectors.selectTopicalVerseCount);
  
  // Selection
  selectedVerses$ = this.store.select(VerseWorkspaceSelectors.selectSelectedVerses);
  selectedVersesCount$ = this.store.select(VerseWorkspaceSelectors.selectSelectedVersesCount);
  isDragging$ = this.store.select(VerseWorkspaceSelectors.selectIsDragging);
  
  // Memorization
  modalVerses$ = this.store.select(VerseWorkspaceSelectors.selectModalVerses);
  verseReviewData$ = this.store.select(VerseWorkspaceSelectors.selectVerseReviewData);
  
  // UI
  mode$ = this.store.select(VerseWorkspaceSelectors.selectMode);
  showFullText$ = this.store.select(VerseWorkspaceSelectors.selectShowFullText);
  fontSize$ = this.store.select(VerseWorkspaceSelectors.selectFontSize);
  layoutMode$ = this.store.select(VerseWorkspaceSelectors.selectLayoutMode);
  activeFilter$ = this.store.select(VerseWorkspaceSelectors.selectActiveFilter);
  showSettings$ = this.store.select(VerseWorkspaceSelectors.selectShowSettings);
  showModal$ = this.store.select(VerseWorkspaceSelectors.selectShowModal);
  modalChapterName$ = this.store.select(VerseWorkspaceSelectors.selectModalChapterName);
  contextMenu$ = this.store.select(VerseWorkspaceSelectors.selectContextMenu);
  showEncouragement$ = this.store.select(VerseWorkspaceSelectors.selectShowEncouragement);
  
  // Loading
  versesLoading$ = this.store.select(VerseWorkspaceSelectors.selectVersesLoading);
  
  // Computed
  memorizedVersesCount$ = this.store.select(VerseWorkspaceSelectors.selectMemorizedVersesCount);
  unmemorizedVersesCount$ = this.store.select(VerseWorkspaceSelectors.selectUnmemorizedVersesCount);
  needsReviewCount$ = this.store.select(VerseWorkspaceSelectors.selectNeedsReviewCount);
  progressPercentage$ = this.store.select(VerseWorkspaceSelectors.selectProgressPercentage);
  progressBarWidth$ = this.store.select(VerseWorkspaceSelectors.selectProgressBarWidth);
  currentVerses$ = this.store.select(VerseWorkspaceSelectors.selectCurrentVerses);
  filteredCurrentVerses$ = this.store.select(VerseWorkspaceSelectors.selectFilteredCurrentVerses);
  shouldShowMarkAsMemorized$ = this.store.select(VerseWorkspaceSelectors.selectShouldShowMarkAsMemorized);
  shouldShowMarkAsUnmemorized$ = this.store.select(VerseWorkspaceSelectors.selectShouldShowMarkAsUnmemorized);

  constructor(private store: Store<AppState>) {}

  // Chapter Actions
  loadChapter(bookId: number, chapter: number, userId: number): void {
    this.store.dispatch(VerseWorkspaceActions.loadChapter({ bookId, chapter, userId }));
  }

  // Memorization Actions
  toggleVerseMemorized(verse: WorkspaceVerse, userId: number): void {
    this.store.dispatch(VerseWorkspaceActions.toggleVerseMemorized({ verse, userId }));
  }

  markMultipleVersesMemorized(verseCodes: string[], isMemorized: boolean, userId: number): void {
    this.store.dispatch(VerseWorkspaceActions.markMultipleVersesMemorized({ 
      verseCodes, 
      isMemorized, 
      userId 
    }));
  }

  // Selection Actions
  selectVerse(verseCode: string, clearPrevious = true): void {
    this.store.dispatch(VerseWorkspaceActions.selectVerse({ verseCode, clearPrevious }));
  }

  selectVerseRange(startIndex: number, endIndex: number, verses: WorkspaceVerse[]): void {
    this.store.dispatch(VerseWorkspaceActions.selectVerseRange({ startIndex, endIndex, verses }));
  }

  clearSelection(): void {
    this.store.dispatch(VerseWorkspaceActions.clearSelection());
  }

  startDragging(startIndex: number): void {
    this.store.dispatch(VerseWorkspaceActions.startDragging({ startIndex }));
  }

  updateDragSelection(currentIndex: number, verses: WorkspaceVerse[]): void {
    this.store.dispatch(VerseWorkspaceActions.updateDragSelection({ currentIndex, verses }));
  }

  endDragging(): void {
    this.store.dispatch(VerseWorkspaceActions.endDragging());
  }

  // Cross References Actions
  loadCrossReferences(selection: CrossReferenceSelection, userId: number): void {
    this.store.dispatch(VerseWorkspaceActions.loadCrossReferences({ selection, userId }));
  }

  // Topical Actions
  loadTopicalVerses(topic: Topic, userId: number): void {
    this.store.dispatch(VerseWorkspaceActions.loadTopicalVerses({ topic, userId }));
  }

  loadAvailableTopics(): void {
    this.store.dispatch(VerseWorkspaceActions.loadAvailableTopics());
  }

  // UI Actions
  setMode(mode: 'memorization' | 'crossReferences' | 'topical'): void {
    this.store.dispatch(VerseWorkspaceActions.setMode({ mode }));
  }

  toggleFullText(): void {
    this.store.dispatch(VerseWorkspaceActions.toggleFullText());
  }

  setFontSize(fontSize: number): void {
    this.store.dispatch(VerseWorkspaceActions.setFontSize({ fontSize }));
  }

  increaseFontSize(): void {
    this.store.select(VerseWorkspaceSelectors.selectFontSize)
      .pipe(take(1))
      .subscribe(currentSize => {
        this.setFontSize(Math.min(currentSize + 2, 24));
      });
  }

  decreaseFontSize(): void {
    this.store.select(VerseWorkspaceSelectors.selectFontSize)
      .pipe(take(1))
      .subscribe(currentSize => {
        this.setFontSize(Math.max(currentSize - 2, 12));
      });
  }

  setLayoutMode(layoutMode: 'grid' | 'single'): void {
    this.store.dispatch(VerseWorkspaceActions.setLayoutMode({ layoutMode }));
  }

  setActiveFilter(filter: 'all' | 'unmemorized' | 'needsReview'): void {
    this.store.dispatch(VerseWorkspaceActions.setActiveFilter({ filter }));
  }

  toggleSettings(): void {
    this.store.dispatch(VerseWorkspaceActions.toggleSettings());
  }

  showContextMenu(x: number, y: number, verseId: string, selectedCount: number): void {
    this.store.dispatch(VerseWorkspaceActions.showContextMenu({ x, y, verseId, selectedCount }));
  }

  hideContextMenu(): void {
    this.store.dispatch(VerseWorkspaceActions.hideContextMenu());
  }

  // Modal Actions
  openMemorizationModal(verses: ModalVerse[], chapterName: string): void {
    this.store.dispatch(VerseWorkspaceActions.openMemorizationModal({ verses, chapterName }));
  }

  closeMemorizationModal(): void {
    this.store.dispatch(VerseWorkspaceActions.closeMemorizationModal());
  }

  // Encouragement Actions
  showEncouragement(message: string, duration?: number): void {
    this.store.dispatch(VerseWorkspaceActions.showEncouragement({ message, duration }));
  }

  // Navigation Actions
  navigateToVerse(bookId: number, chapter: number, verse: number): void {
    this.store.dispatch(VerseWorkspaceActions.navigateToVerse({ bookId, chapter, verse }));
  }

  setTargetVerse(verseNumber: number | null): void {
    this.store.dispatch(VerseWorkspaceActions.setTargetVerse({ verseNumber }));
  }

  // Deck Actions
  addVersesToDeck(deckId: number, verseCodes: string[], userId: number): void {
    this.store.dispatch(VerseWorkspaceActions.addVersesToDeck({ deckId, verseCodes, userId }));
  }

  // Helper method to check if a verse is selected
  isVerseSelected(verseCode: string): Observable<boolean> {
    return this.store.select(VerseWorkspaceSelectors.selectSelectedVerses)
      .pipe(map(selectedVerses => selectedVerses.has(verseCode)));
  }

  // Helper to get filtered verses based on current mode
  getFilteredVersesForCurrentMode(): Observable<WorkspaceVerse[]> {
    return this.store.select(VerseWorkspaceSelectors.selectFilteredCurrentVerses);
  }
}

import { map, take } from 'rxjs/operators';