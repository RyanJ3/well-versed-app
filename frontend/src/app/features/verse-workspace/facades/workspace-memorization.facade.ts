import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, take, tap, filter } from 'rxjs/operators';

import { FlowState } from '../state/flow.state';
import * as FlowActions from '../state/flow.actions';
import * as FlowSelectors from '../state/flow.selectors';
import { FlowEventBusService, FlowEventType } from '../services/flow-event-bus.service';
import { VerseRepositoryService } from '../repositories/verse-repository.service';
import { BaseVerse, MemorizationVerse, CrossReferenceVerse, TopicalVerse } from '../models/verse-types.model';

/**
 * Facade service that provides a simplified API for components to interact with
 * the flow memorization feature. This abstracts away the complexity of NgRx,
 * services, and business logic.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceMemorizationFacade {
  // ===== Observable Streams =====
  
  // Verse streams
  readonly verses$ = this.store.select(FlowSelectors.selectAllVerses);
  readonly filteredVerses$ = this.store.select(FlowSelectors.selectFilteredVerses);
  readonly selectedVerses$ = this.store.select(FlowSelectors.selectSelectedVerses);
  readonly memorizedVerses$ = this.store.select(FlowSelectors.selectMemorizedVerses);
  
  // UI streams
  readonly mode$ = this.store.select(FlowSelectors.selectMode);
  readonly fontSize$ = this.store.select(FlowSelectors.selectFontSize);
  readonly layoutMode$ = this.store.select(FlowSelectors.selectLayoutMode);
  readonly showFullText$ = this.store.select(FlowSelectors.selectShowFullText);
  readonly isLoading$ = this.store.select(FlowSelectors.selectIsLoading);
  readonly error$ = this.store.select(FlowSelectors.selectError);
  readonly contextMenu$ = this.store.select(FlowSelectors.selectContextMenu);
  
  // Navigation streams
  readonly currentBook$ = this.store.select(FlowSelectors.selectCurrentBook);
  readonly currentChapter$ = this.store.select(FlowSelectors.selectCurrentChapter);
  readonly currentLocation$ = this.store.select(FlowSelectors.selectCurrentLocation);
  
  // Progress streams
  readonly memorizationProgress$ = this.store.select(FlowSelectors.selectMemorizationProgress);
  readonly selectionCount$ = this.store.select(FlowSelectors.selectSelectionCount);
  readonly hasSelection$ = this.store.select(FlowSelectors.selectHasSelection);
  
  // Filter streams
  readonly searchTerm$ = this.store.select(FlowSelectors.selectSearchTerm);
  readonly activeFilter$ = this.store.select(FlowSelectors.selectActiveFilter);
  readonly filterFlags$ = this.store.select(FlowSelectors.selectFilterFlags);
  
  // Study session streams
  readonly isStudyActive$ = this.store.select(FlowSelectors.selectIsStudyActive);
  readonly studyProgress$ = this.store.select(FlowSelectors.selectStudyProgress);
  readonly studyStats$ = this.store.select(FlowSelectors.selectStudyStats);
  readonly currentStudyVerse$ = this.store.select(FlowSelectors.selectCurrentStudyVerse);
  
  // Cross references streams
  readonly crossReferences$ = this.store.select(FlowSelectors.selectFilteredCrossReferences);
  readonly crossReferencesLoading$ = this.store.select(FlowSelectors.selectCrossReferencesLoading);
  
  // Topical streams
  readonly topicalVerses$ = this.store.select(FlowSelectors.selectFilteredTopicalVerses);
  readonly currentTopic$ = this.store.select(FlowSelectors.selectCurrentTopic);
  readonly availableTopics$ = this.store.select(FlowSelectors.selectAvailableTopics);
  
  // Deck streams
  readonly decks$ = this.store.select(FlowSelectors.selectDecks);
  readonly activeDeck$ = this.store.select(FlowSelectors.selectActiveDeck);
  
  // Settings streams
  readonly settings$ = this.store.select(FlowSelectors.selectSettingsState);
  readonly theme$ = this.store.select(FlowSelectors.selectTheme);
  
  // Combined view streams
  readonly memorizationViewData$ = this.store.select(FlowSelectors.selectMemorizationViewData);
  readonly crossReferencesViewData$ = this.store.select(FlowSelectors.selectCrossReferencesViewData);
  readonly topicalViewData$ = this.store.select(FlowSelectors.selectTopicalViewData);
  readonly statistics$ = this.store.select(FlowSelectors.selectStatistics);
  
  constructor(
    private store: Store<{ flow: FlowState }>,
    private eventBus: FlowEventBusService,
    private verseRepository: VerseRepositoryService
  ) {
    this.setupEventListeners();
  }
  
  // ===== Navigation Methods =====
  
  /**
   * Load a specific chapter
   */
  loadChapter(bookId: number, chapter: number): void {
    this.store.dispatch(FlowActions.loadChapter({ bookId, chapter }));
    this.eventBus.emit(FlowEventType.CHAPTER_CHANGED, { bookId, chapter }, 'facade');
    
    // Fetch and dispatch data
    this.verseRepository.getChapterVerses(bookId, chapter).subscribe({
      next: (data) => {
        this.store.dispatch(FlowActions.loadChapterSuccess({
          verses: data.verses,
          bookName: data.bookName,
          totalChapters: data.totalChapters
        }));
        
        // Prefetch adjacent chapters for smooth navigation
        this.verseRepository.prefetchAdjacentChapters(bookId, chapter);
      },
      error: (error) => {
        this.store.dispatch(FlowActions.loadChapterFailure({ error: error.message }));
        this.eventBus.emitError(error, 'loadChapter', true, 'facade');
      }
    });
  }
  
  /**
   * Navigate to next chapter
   */
  nextChapter(): void {
    combineLatest([
      this.currentLocation$.pipe(take(1)),
      this.store.select(FlowSelectors.selectNavigationState).pipe(take(1))
    ]).subscribe(([location, nav]) => {
      if (location.chapter < nav.totalChapters) {
        this.loadChapter(location.bookId, location.chapter + 1);
      }
    });
  }
  
  /**
   * Navigate to previous chapter
   */
  previousChapter(): void {
    this.currentLocation$.pipe(take(1)).subscribe(location => {
      if (location.chapter > 1) {
        this.loadChapter(location.bookId, location.chapter - 1);
      }
    });
  }
  
  /**
   * Change book
   */
  changeBook(bookId: number): void {
    this.store.dispatch(FlowActions.changeBook({ bookId }));
    this.loadChapter(bookId, 1);
  }
  
  /**
   * Navigate to a specific verse
   */
  navigateToVerse(verseCode: string): void {
    this.store.dispatch(FlowActions.navigateToVerse({ verseCode }));
    
    // Parse and load the chapter if needed
    const bookId = parseInt(verseCode.substring(0, 2));
    const chapter = parseInt(verseCode.substring(2, 5));
    
    this.currentLocation$.pipe(take(1)).subscribe(location => {
      if (location.bookId !== bookId || location.chapter !== chapter) {
        this.loadChapter(bookId, chapter);
      }
    });
  }
  
  // ===== Mode Methods =====
  
  /**
   * Switch to memorization mode
   */
  switchToMemorizationMode(): void {
    this.store.dispatch(FlowActions.switchToMemorization());
    this.eventBus.emit(FlowEventType.MODE_CHANGED, 'memorization', 'facade');
  }
  
  /**
   * Switch to cross references mode
   */
  switchToCrossReferencesMode(verseCode?: string): void {
    this.store.dispatch(FlowActions.switchToCrossReferences());
    this.eventBus.emit(FlowEventType.MODE_CHANGED, 'crossReferences', 'facade');
    
    if (verseCode) {
      this.loadCrossReferences(verseCode);
    }
  }
  
  /**
   * Switch to topical mode
   */
  switchToTopicalMode(topicId?: string, topicName?: string): void {
    this.store.dispatch(FlowActions.switchToTopical());
    this.eventBus.emit(FlowEventType.MODE_CHANGED, 'topical', 'facade');
    
    if (topicId && topicName) {
      this.loadTopicalVerses(topicId, topicName);
    }
  }
  
  // ===== Selection Methods =====
  
  /**
   * Select a single verse
   */
  selectVerse(verseCode: string, multiSelect = false): void {
    this.store.dispatch(FlowActions.selectVerse({ verseCode, multiSelect }));
    this.eventBus.emitVerseSelected(verseCode, multiSelect, undefined, 'facade');
  }
  
  /**
   * Deselect a verse
   */
  deselectVerse(verseCode: string): void {
    this.store.dispatch(FlowActions.deselectVerse({ verseCode }));
    this.eventBus.emit(FlowEventType.VERSE_DESELECTED, { verseCode }, 'facade');
  }
  
  /**
   * Select a range of verses
   */
  selectVerseRange(startCode: string, endCode: string): void {
    this.store.dispatch(FlowActions.selectVerseRange({ startCode, endCode }));
    
    // Get the actual verse codes in the range
    this.verses$.pipe(take(1)).subscribe(verses => {
      const codes = verses
        .filter(v => v.verseCode >= startCode && v.verseCode <= endCode)
        .map(v => v.verseCode);
      
      this.eventBus.emitVerseRangeSelected(startCode, endCode, codes, 'facade');
    });
  }
  
  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.store.dispatch(FlowActions.clearSelection());
    this.eventBus.emit(FlowEventType.VERSE_DESELECTED, { verseCode: 'all' }, 'facade');
  }
  
  /**
   * Select all verses
   */
  selectAll(): void {
    this.store.dispatch(FlowActions.selectAll());
  }
  
  // ===== Memorization Methods =====
  
  /**
   * Toggle memorization status for a verse
   */
  toggleMemorized(verseCode: string): void {
    this.store.dispatch(FlowActions.toggleMemorized({ verseCode }));
    
    // Check current status to emit correct event
    this.store.select(FlowSelectors.selectMemorizedVerseIds)
      .pipe(take(1))
      .subscribe(memorizedIds => {
        const isNowMemorized = !memorizedIds.includes(verseCode);
        this.eventBus.emitVerseMemorized(verseCode, isNowMemorized, 'facade');
      });
  }
  
  /**
   * Mark multiple verses as memorized
   */
  markAsMemorized(verseCodes: string[]): void {
    this.store.dispatch(FlowActions.markAsMemorized({ verseCodes }));
    verseCodes.forEach(code => 
      this.eventBus.emitVerseMemorized(code, true, 'facade')
    );
  }
  
  /**
   * Mark multiple verses as not memorized
   */
  markAsNotMemorized(verseCodes: string[]): void {
    this.store.dispatch(FlowActions.markAsNotMemorized({ verseCodes }));
    verseCodes.forEach(code => 
      this.eventBus.emitVerseMemorized(code, false, 'facade')
    );
  }
  
  /**
   * Batch toggle memorization for selected verses
   */
  batchToggleMemorized(): void {
    this.selectedVerses$.pipe(take(1)).subscribe(verses => {
      const verseCodes = verses.map(v => v.verseCode);
      this.store.dispatch(FlowActions.batchToggleMemorized({ verseCodes }));
      this.eventBus.emit(FlowEventType.BATCH_MEMORIZE, verseCodes, 'facade');
    });
  }
  
  // ===== Filter Methods =====
  
  /**
   * Set search term
   */
  setSearchTerm(searchTerm: string): void {
    this.store.dispatch(FlowActions.setSearchTerm({ searchTerm }));
    this.eventBus.emit(FlowEventType.SEARCH_TERM_CHANGED, searchTerm, 'facade');
  }
  
  /**
   * Toggle filter
   */
  toggleFilter(filterType: 'memorized' | 'toLearn' | 'review'): void {
    this.store.dispatch(FlowActions.toggleFilter({ filterType }));
    this.eventBus.emitFilterChanged(filterType, true, 'facade');
  }
  
  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.store.dispatch(FlowActions.clearFilters());
  }
  
  // ===== UI Methods =====
  
  /**
   * Set font size
   */
  setFontSize(fontSize: number): void {
    this.store.dispatch(FlowActions.setFontSize({ fontSize }));
    this.eventBus.emit(FlowEventType.FONT_SIZE_CHANGED, fontSize, 'facade');
  }
  
  /**
   * Set layout mode
   */
  setLayoutMode(layoutMode: 'grid' | 'single'): void {
    this.store.dispatch(FlowActions.setLayoutMode({ layoutMode }));
    this.eventBus.emit(FlowEventType.LAYOUT_MODE_CHANGED, layoutMode, 'facade');
  }
  
  /**
   * Toggle full text display
   */
  toggleFullText(): void {
    this.store.dispatch(FlowActions.toggleFullText());
    this.eventBus.emit(FlowEventType.FULLTEXT_TOGGLED, null, 'facade');
  }
  
  /**
   * Show context menu
   */
  showContextMenu(verseCode: string, x: number, y: number): void {
    this.store.dispatch(FlowActions.showContextMenu({ verseCode, x, y }));
    this.eventBus.emit(FlowEventType.VERSE_CONTEXT_MENU, { verseCode, event: { clientX: x, clientY: y } }, 'facade');
  }
  
  /**
   * Hide context menu
   */
  hideContextMenu(): void {
    this.store.dispatch(FlowActions.hideContextMenu());
  }
  
  // ===== Study Session Methods =====
  
  /**
   * Start a study session
   */
  startStudySession(verseCodes?: string[], sessionType: 'learn' | 'review' | 'test' = 'learn'): void {
    // If no verses provided, use selected or all non-memorized
    if (!verseCodes) {
      combineLatest([
        this.selectedVerses$,
        this.filteredVerses$,
        this.store.select(FlowSelectors.selectMemorizedVerseIds)
      ]).pipe(take(1)).subscribe(([selected, filtered, memorizedIds]) => {
        const codes = selected.length > 0 
          ? selected.map(v => v.verseCode)
          : filtered
              .filter(v => !memorizedIds.includes(v.verseCode))
              .map(v => v.verseCode);
        
        this.store.dispatch(FlowActions.startStudySession({ verseCodes: codes, sessionType }));
        this.eventBus.emitStudySessionStarted(codes, sessionType, 'facade');
      });
    } else {
      this.store.dispatch(FlowActions.startStudySession({ verseCodes, sessionType }));
      this.eventBus.emitStudySessionStarted(verseCodes, sessionType, 'facade');
    }
  }
  
  /**
   * End the current study session
   */
  endStudySession(completed = true): void {
    this.store.dispatch(FlowActions.endStudySession({ completed }));
    this.eventBus.emit(FlowEventType.STUDY_SESSION_ENDED, { completed }, 'facade');
  }
  
  /**
   * Navigate to next verse in study session
   */
  nextStudyVerse(): void {
    this.store.dispatch(FlowActions.nextStudyVerse());
  }
  
  /**
   * Navigate to previous verse in study session
   */
  previousStudyVerse(): void {
    this.store.dispatch(FlowActions.previousStudyVerse());
  }
  
  /**
   * Record a study attempt
   */
  recordStudyAttempt(verseCode: string, correct: boolean): void {
    this.store.dispatch(FlowActions.recordStudyAttempt({ verseCode, correct }));
    this.eventBus.emit(FlowEventType.STUDY_VERSE_COMPLETED, { verseCode, correct }, 'facade');
  }
  
  // ===== Cross References Methods =====
  
  /**
   * Load cross references for a verse
   */
  loadCrossReferences(verseCode: string): void {
    this.store.dispatch(FlowActions.loadCrossReferences({ verseCode }));
    
    this.verseRepository.getCrossReferences(verseCode).subscribe({
      next: (references) => {
        // Transform to CrossReferenceVerse type
        const crossRefVerses: CrossReferenceVerse[] = references.map(ref => ({
          verseCode: ref.targetVerseCode,
          reference: '', // Will be populated by transformation service
          text: '', // Will be populated by transformation service
          crossRefConfidence: ref.confidence,
          direction: ref.bidirectional ? 'from' : 'to' as 'from' | 'to',
          sourceVerseCode: ref.sourceVerseCode,
          targetVerseCode: ref.targetVerseCode,
          relationship: ref.relationship
        }));
        
        this.store.dispatch(FlowActions.loadCrossReferencesSuccess({ references: crossRefVerses }));
      },
      error: (error) => {
        this.store.dispatch(FlowActions.loadCrossReferencesFailure({ error: error.message }));
      }
    });
  }
  
  /**
   * Set confidence threshold for cross references
   */
  setCrossReferenceConfidenceThreshold(threshold: number): void {
    this.store.dispatch(FlowActions.setCrossReferenceConfidenceThreshold({ threshold }));
  }
  
  // ===== Topical Methods =====
  
  /**
   * Load verses for a topic
   */
  loadTopicalVerses(topicId: string, topicName: string): void {
    this.store.dispatch(FlowActions.loadTopicalVerses({ topicId, topicName }));
    
    this.verseRepository.getTopicalVerses(topicId).subscribe({
      next: (verses) => {
        // Transform to TopicalVerse type
        const topicalVerses: TopicalVerse[] = verses.map(v => ({
          verseCode: v.verseCode,
          reference: '', // Will be populated
          text: '', // Will be populated
          topicRelevance: v.relevance,
          topicName: v.topicName,
          topicId: v.topicId,
          subtopic: v.subtopic
        }));
        
        this.store.dispatch(FlowActions.loadTopicalVersesSuccess({ verses: topicalVerses }));
      },
      error: (error) => {
        this.store.dispatch(FlowActions.loadTopicalVersesFailure({ error: error.message }));
      }
    });
  }
  
  /**
   * Set relevance threshold for topical verses
   */
  setTopicalRelevanceThreshold(threshold: number): void {
    this.store.dispatch(FlowActions.setTopicalRelevanceThreshold({ threshold }));
  }
  
  // ===== Deck Methods =====
  
  /**
   * Create a new deck
   */
  createDeck(name: string, description?: string): void {
    this.store.dispatch(FlowActions.createDeck({ name, description }));
    this.eventBus.emit(FlowEventType.CREATE_DECK, { name, description }, 'facade');
  }
  
  /**
   * Add verses to a deck
   */
  addToDeck(deckId: string, verseCodes?: string[]): void {
    const codes = verseCodes || [];
    
    if (codes.length === 0) {
      // Use selected verses
      this.selectedVerses$.pipe(take(1)).subscribe(verses => {
        const selectedCodes = verses.map(v => v.verseCode);
        this.store.dispatch(FlowActions.addToDeck({ deckId, verseCodes: selectedCodes }));
        this.eventBus.emit(FlowEventType.ADD_TO_DECK, { deckId, verseCodes: selectedCodes }, 'facade');
      });
    } else {
      this.store.dispatch(FlowActions.addToDeck({ deckId, verseCodes: codes }));
      this.eventBus.emit(FlowEventType.ADD_TO_DECK, { deckId, verseCodes: codes }, 'facade');
    }
  }
  
  /**
   * Set active deck
   */
  setActiveDeck(deckId: string | null): void {
    this.store.dispatch(FlowActions.setActiveDeck({ deckId }));
  }
  
  // ===== Settings Methods =====
  
  /**
   * Update settings
   */
  updateSettings(settings: Partial<any>): void {
    this.store.dispatch(FlowActions.updateSettings({ settings }));
  }
  
  /**
   * Save current state
   */
  saveState(): void {
    this.store.dispatch(FlowActions.saveState());
  }
  
  /**
   * Load saved state
   */
  loadState(): void {
    this.store.dispatch(FlowActions.loadState());
  }
  
  // ===== Utility Methods =====
  
  /**
   * Handle keyboard shortcut
   */
  handleKeyboardShortcut(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    
    switch (key) {
      case 'a':
        if (ctrl) {
          event.preventDefault();
          this.selectAll();
        }
        break;
        
      case 'escape':
        this.clearSelection();
        this.hideContextMenu();
        break;
        
      case 'enter':
        if (this.hasSelection$) {
          this.startStudySession();
        }
        break;
        
      case 'm':
        if (ctrl) {
          event.preventDefault();
          this.batchToggleMemorized();
        }
        break;
        
      case 'arrowright':
        if (ctrl) {
          this.nextChapter();
        }
        break;
        
      case 'arrowleft':
        if (ctrl) {
          this.previousChapter();
        }
        break;
    }
  }
  
  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to event bus for external changes
    this.eventBus.verseSelected$.subscribe(({ verseCode }) => {
      // Handle verse selection from other sources
    });
    
    this.eventBus.errorOccurred$.subscribe(({ error, context }) => {
      this.store.dispatch(FlowActions.handleError({ 
        error, 
        context, 
        recoverable: true 
      }));
    });
  }
  
  /**
   * Get current state snapshot (for debugging)
   */
  getCurrentState(): Observable<any> {
    return this.store.select(FlowSelectors.selectFlowState).pipe(take(1));
  }
  
  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.store.dispatch(FlowActions.resetToDefaults());
  }
  
  /**
   * Clear all data
   */
  clearAllData(): void {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      this.store.dispatch(FlowActions.clearAllData());
    }
  }
}