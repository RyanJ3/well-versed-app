import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

// NgRx
import * as WorkspaceActions from './state/verse-workspace.actions';
import * as WorkspaceSelectors from './state/verse-workspace.selectors';

// Components
import { MemorizationModalComponent } from './memorization/memorization-modal.component';
import { WorkspaceFiltersComponent } from './components/workspace-filters/workspace-filters.component';
import { WorkspaceContextMenuComponent } from './components/workspace-context-menu/workspace-context-menu.component';
import { WorkspaceHeaderComponent } from './components/workspace-header/workspace-header.component';
import { CreateDeckModalComponent } from '../decks/components/create-deck-modal/create-deck-modal.component';
import { TopicPickerComponent } from './components/topic-picker/topic-picker.component';

// Models
import { BibleBook, BibleChapter } from '@models/bible';
import { VerseData } from './state/verse-workspace.state';

@Component({
  selector: 'app-verse-workspace',
  standalone: true,
  imports: [
    CommonModule,
    MemorizationModalComponent,
    WorkspaceFiltersComponent,
    WorkspaceContextMenuComponent,
    WorkspaceHeaderComponent,
    CreateDeckModalComponent,
    TopicPickerComponent
  ],
  templateUrl: './verse-workspace.component.html',
  styleUrls: ['./verse-workspace.component.scss']
})
export class VerseWorkspaceComponent implements OnInit, OnDestroy {
  @ViewChild('versesContainer') versesContainer!: ElementRef;

  // Observables from store
  verses$ = this.store.select(WorkspaceSelectors.selectFilteredVerses);
  currentBook$ = this.store.select(WorkspaceSelectors.selectCurrentBook);
  currentChapter$ = this.store.select(WorkspaceSelectors.selectCurrentChapter);
  selectedVerses$ = this.store.select(WorkspaceSelectors.selectSelectedVerses);
  memorizedProgress$ = this.store.select(WorkspaceSelectors.selectMemorizationProgress);
  uiState$ = this.store.select(WorkspaceSelectors.selectUIState);
  settings$ = this.store.select(WorkspaceSelectors.selectSettings);
  isLoading$ = this.store.select(WorkspaceSelectors.selectIsLoadingVerses);
  error$ = this.store.select(WorkspaceSelectors.selectError);
  dailyStats$ = this.store.select(WorkspaceSelectors.selectDailyStats);
  chapterNav$ = this.store.select(WorkspaceSelectors.selectChapterNavigation);
  
  // Component state (minimal, most state is in store)
  showMemorizationModal = false;
  showCreateDeckModal = false;
  showTopicPicker = false;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Load settings
    this.store.dispatch(WorkspaceActions.loadSettings());

    // Handle route params
    this.route.queryParams.subscribe(params => {
      const bookId = params['bookId'] ? parseInt(params['bookId']) : 40; // Default to Matthew
      const chapter = params['chapter'] ? parseInt(params['chapter']) : 1;
      
      this.store.dispatch(WorkspaceActions.loadVerses({ bookId, chapterNumber: chapter }));
    });
  }

  ngOnDestroy() {
    // NgRx handles cleanup automatically
  }

  // ============= VERSE ACTIONS =============
  onVerseClick(verse: VerseData, event: MouseEvent) {
    event.stopPropagation();
    
    if (event.shiftKey && this.getLastSelectedVerse()) {
      // Range selection
      const lastVerse = this.getLastSelectedVerse();
      if (lastVerse) {
        this.store.dispatch(WorkspaceActions.selectVerseRange({ 
          startId: lastVerse.id, 
          endId: verse.id 
        }));
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Multi-select
      this.store.dispatch(WorkspaceActions.selectVerse({ 
        verseId: verse.id, 
        multiSelect: true 
      }));
    } else {
      // Single select
      this.store.dispatch(WorkspaceActions.selectVerse({ 
        verseId: verse.id, 
        multiSelect: false 
      }));
    }
  }

  onVerseRightClick(verse: VerseData, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    this.store.dispatch(WorkspaceActions.showContextMenu({ 
      x: event.clientX, 
      y: event.clientY, 
      verseId: verse.id 
    }));
  }

  markVerseMemorized(verseId: string) {
    this.store.dispatch(WorkspaceActions.markVerseMemorized({ 
      verseId, 
      confidence: 100 
    }));
  }

  markVerseUnmemorized(verseId: string) {
    this.store.dispatch(WorkspaceActions.updateVerseConfidence({ 
      verseId, 
      confidence: 0 
    }));
  }

  // ============= SELECTION ACTIONS =============
  selectAll() {
    this.verses$.subscribe(verses => {
      const verseIds = verses.map(v => v.id);
      this.store.dispatch(WorkspaceActions.markMultipleVersesMemorized({ verseIds }));
    }).unsubscribe();
  }

  clearSelection() {
    this.store.dispatch(WorkspaceActions.clearSelection());
  }

  toggleSelectionMode() {
    this.store.dispatch(WorkspaceActions.toggleSelectionMode());
  }

  // ============= NAVIGATION ACTIONS =============
  navigateToChapter(chapterNumber: number) {
    this.currentBook$.subscribe(book => {
      if (book) {
        this.store.dispatch(WorkspaceActions.navigateToChapter({ 
          bookId: book.id, 
          chapterNumber 
        }));
      }
    }).unsubscribe();
  }

  navigateNext() {
    this.store.dispatch(WorkspaceActions.navigateNext());
  }

  navigatePrevious() {
    this.store.dispatch(WorkspaceActions.navigatePrevious());
  }

  changeBook(bookId: number) {
    this.store.dispatch(WorkspaceActions.loadVerses({ 
      bookId, 
      chapterNumber: 1 
    }));
  }

  // ============= UI ACTIONS =============
  toggleViewType() {
    this.store.dispatch(WorkspaceActions.toggleViewType());
  }

  toggleHeader() {
    this.store.dispatch(WorkspaceActions.toggleHeader());
  }

  toggleFilters() {
    this.store.dispatch(WorkspaceActions.toggleFilters());
  }

  setFontSize(size: 'small' | 'medium' | 'large') {
    this.store.dispatch(WorkspaceActions.setFontSize({ size }));
  }

  setMode(mode: 'chapter' | 'topical' | 'custom') {
    this.store.dispatch(WorkspaceActions.setMode({ mode }));
    
    if (mode === 'topical') {
      this.showTopicPicker = true;
    }
  }

  // ============= MEMORIZATION ACTIONS =============
  startMemorizationSession() {
    this.selectedVerses$.subscribe(verses => {
      if (verses.length > 0) {
        const verseIds = verses.map(v => v.id);
        this.store.dispatch(WorkspaceActions.startMemorizationSession({ 
          verses: verseIds, 
          mode: 'practice' 
        }));
        this.showMemorizationModal = true;
      }
    }).unsubscribe();
  }

  startFullChapterMemorization() {
    this.verses$.subscribe(verses => {
      const verseIds = verses.map(v => v.id);
      this.store.dispatch(WorkspaceActions.startMemorizationSession({ 
        verses: verseIds, 
        mode: 'practice' 
      }));
      this.showMemorizationModal = true;
    }).unsubscribe();
  }

  onMemorizationComplete(result: { accuracy: number; timeSpent: number }) {
    this.store.dispatch(WorkspaceActions.endMemorizationSession(result));
    this.showMemorizationModal = false;
  }

  // ============= FILTER ACTIONS =============
  applyFilter(filter: 'all' | 'unmemorized' | 'needsReview') {
    const filterConfig = {
      hideMemorized: filter === 'unmemorized',
      section: undefined,
      searchText: undefined
    };
    
    this.store.dispatch(WorkspaceActions.applyFilter({ filter: filterConfig }));
  }

  clearFilters() {
    this.store.dispatch(WorkspaceActions.clearFilters());
  }

  // ============= DECK ACTIONS =============
  createDeckFromSelection() {
    this.showCreateDeckModal = true;
  }

  onCreateDeck(deckData: { name: string; description: string }) {
    this.selectedVerses$.subscribe(verses => {
      const verseIds = verses.map(v => v.id);
      this.store.dispatch(WorkspaceActions.createDeckFromSelection({ 
        name: deckData.name, 
        description: deckData.description, 
        verseIds 
      }));
      this.showCreateDeckModal = false;
    }).unsubscribe();
  }

  addToDeck(deckId: number) {
    this.selectedVerses$.subscribe(verses => {
      const verseIds = verses.map(v => v.id);
      this.store.dispatch(WorkspaceActions.addToDeck({ verseIds, deckId }));
    }).unsubscribe();
  }

  // ============= SETTINGS ACTIONS =============
  updateSettings(settings: any) {
    this.store.dispatch(WorkspaceActions.updateSettings({ settings }));
  }

  // ============= HELPER METHODS =============
  private getLastSelectedVerse(): VerseData | null {
    let lastVerse: VerseData | null = null;
    this.selectedVerses$.subscribe(verses => {
      if (verses.length > 0) {
        lastVerse = verses[verses.length - 1];
      }
    }).unsubscribe();
    return lastVerse;
  }

  // ============= KEYBOARD SHORTCUTS =============
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    // Ctrl/Cmd + A: Select all
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      this.selectAll();
    }
    
    // Escape: Clear selection
    if (event.key === 'Escape') {
      this.clearSelection();
      this.store.dispatch(WorkspaceActions.hideContextMenu());
    }
    
    // Space: Start memorization
    if (event.key === ' ' && !this.showMemorizationModal) {
      event.preventDefault();
      this.startMemorizationSession();
    }
    
    // Arrow keys: Navigate chapters
    if (event.key === 'ArrowRight' && event.altKey) {
      this.navigateNext();
    }
    if (event.key === 'ArrowLeft' && event.altKey) {
      this.navigatePrevious();
    }
  }

  // ============= MOUSE EVENTS =============
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Hide context menu when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.context-menu')) {
      this.store.dispatch(WorkspaceActions.hideContextMenu());
    }
  }

  handleMouseUp() {
    // Handle text selection for highlighting
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      // Could implement text highlighting feature here
    }
  }
}