import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, firstValueFrom, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { trigger, transition, style, animate } from '@angular/animations';

import { BibleService } from '@services/api/bible.service';
import { UserService } from '@services/api/user.service';
import { DeckService, DeckResponse, DeckCreate } from '@services/api/deck.service';
import { NotificationService } from '@services/utils/notification.service';
import { FlowStateService } from './services/flow-state.service';
import { FlowMemorizationService } from './services/flow-memorization.service';
import { MemorizationModalComponent } from './memorization-modal/memorization-modal.component';
import { FiltersBarComponent } from './components/filters-bar/filters-bar.component';
import { FlowContextMenuComponent } from './components/context-menu/context-menu.component';
import { FlowHeaderComponent } from './components/flow-header/flow-header.component';
import { CreateDeckModalComponent } from '../decks/components/create-deck-modal/create-deck-modal.component';

import { BibleBook, BibleChapter, BibleVerse, BibleData } from '@models/bible';
import { AppState } from '@state/app.state';
import { BibleMemorizationActions } from '@state/bible-tracker/actions/bible-memorization.actions';
import { selectBibleDataWithProgress } from '@state/bible-tracker/selectors/bible-memorization.selectors';
import { FlowVerse, ModalVerse } from './models/flow.models';
import { ContextMenuData } from './models/context-menu-data.model';
import { FlowParsingService } from '@services/utils/flow-parsing.service';
import { VerseSection } from './models/verse-section.model';
import { FlowSelectionService } from './services/flow-selection.service';

@Component({
  selector: 'app-flow-memorization',
  standalone: true,
  imports: [
    CommonModule,
    MemorizationModalComponent,
    FiltersBarComponent,
    FlowContextMenuComponent,
    FlowHeaderComponent,
    CreateDeckModalComponent
  ],
  providers: [FlowStateService, FlowMemorizationService, FlowSelectionService],
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class FlowComponent implements OnInit, OnDestroy {
  @ViewChild('versesContainer') versesContainer!: ElementRef;

  private flowParsingService: FlowParsingService = inject(FlowParsingService);

  // Core data
  verses: FlowVerse[] = [];
  hoveredSection = -1;

  // Bible models - using actual Bible objects
  bibleData: BibleData | null = null;
  currentBook: BibleBook | null = null;
  currentChapter = 1;
  currentBibleChapter: BibleChapter | null = null;
  allBooks: BibleBook[] = [];

  // UI state
  showFullText = false;
  fontSize = 16;
  layoutMode: 'grid' | 'single' = 'grid';
  activeFilter: 'all' | 'unmemorized' | 'needsReview' | 'sections' = 'all';
  showSettings = false;
  isGearSpinning = false;
  showEncouragement = '';
  isLoading = false;

  // Chapter navigation - using BibleChapter objects
  availableChapters: BibleChapter[] = [];

  // Context menu
  contextMenu: ContextMenuData = {
    visible: false,
    x: 0,
    y: 0,
    verseId: null,
    selectedCount: 0
  };

  // Sections
  verseSections: VerseSection[] = [];

  // Review data
  verseReviewData: Record<string, { lastReviewed: number; strength: number }> = {};

  // Modal
  showModal = false;
  modalVerses: ModalVerse[] = [];
  modalChapterName = '';

  // Create Deck Modal
  showCreateDeckModal = false;
  createDeckLoading = false;
  pendingVersesToAdd: string[] = [];

  // Flashcard decks
  flashcardDecks: DeckResponse[] = [];
  flashcardDeckNames: string[] = [];

  // Expose Math to template
  Math = Math;

  private destroy$ = new Subject<void>();
  private saveQueue$ = new Subject<FlowVerse>();
  private userId = 1;

  // Track whether progress has been loaded to avoid redundant API calls
  private progressLoaded = false;

  // Computed properties for template
  get memorizedVersesCount(): number {
    return this.verses.filter(v => v.isMemorized).length;
  }

  get unmemorizedVersesCount(): number {
    return this.verses.filter(v => !v.isMemorized).length;
  }

  get needsReviewCount(): number {
    return this.verses.filter(v => this.needsReview(v.verseCode)).length;
  }

  get progressPercentage(): number {
    if (!this.currentBook) return 0;
    const total = this.currentBook.totalVerses;
    const memorized = this.currentBook.memorizedVerses;
    return total > 0 ? Math.round((memorized / total) * 100) : 0;
  }

  get progressBarWidth(): number {
    if (this.verses.length === 0) return 0;
    return (this.memorizedVersesCount / this.verses.length) * 100;
  }

  get selectedVerseIsMemorized(): boolean {
    if (!this.contextMenu.verseId) return false;
    const verse = this.verses.find(v => v.verseCode === this.contextMenu.verseId);
    return verse?.isMemorized || false;
  }

  get shouldShowMarkAsMemorized(): boolean {
    return !this.selectedVerseIsMemorized || this.contextMenu.selectedCount > 0;
  }

  get shouldShowMarkAsUnmemorized(): boolean {
    return this.selectedVerseIsMemorized || this.contextMenu.selectedCount > 0;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<AppState>,
    private bibleService: BibleService,
    private userService: UserService,
    private deckService: DeckService,
    private flowStateService: FlowStateService,
    private flowMemorizationService: FlowMemorizationService,
    private notificationService: NotificationService,
    public selectionService: FlowSelectionService
  ) { }

  ngOnInit() {
    console.log('FlowComponent initializing...');

    // Load Bible data (structure only)
    this.loadBibleData();

    // Ensure user data is loaded from DB (including ESV API token)
    this.userService.ensureUserLoaded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Now subscribe to user changes
        this.userService.currentUser$
          .pipe(takeUntil(this.destroy$))
          .subscribe(user => {
            if (user) {
              this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
              console.log('User ID set:', this.userId);
              console.log('ESV API Token present:', !!(user.esvApiToken));
              this.loadUserDecks();
            }
          });
      });

    // Load saved state
    this.loadSavedState();

    // Setup save queue
    this.setupSaveQueue();

    // Subscribe to save notifications
    this.flowMemorizationService.savedNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showSaveNotification();
      });

    // Load from route params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log('Route params:', params);
        const bookId = params['bookId'] ? parseInt(params['bookId']) : null;
        const chapter = params['chapter'] ? parseInt(params['chapter']) : null;

        if (bookId && chapter) {
          console.log('Loading chapter from params:', bookId, chapter);
          this.loadChapter(bookId, chapter);
        } else {
          // Load default Genesis 1 if no params
          console.log('No params, loading Genesis 1');
          this.loadChapter(1, 1);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    console.log('Component view initialized');
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.contextMenu.visible = false;
    this.showSettings = false;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.selectionService.clearSelection();
      this.contextMenu.visible = false;
    } else if (event.key === 'Enter' && this.selectionService.selectedVerses.size > 0) {
      this.startStudySession();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      this.selectAll();
    }
  }

  private loadBibleData() {
    // Get Bible data from service
    this.bibleData = this.bibleService.getBibleData();
    if (this.bibleData) {
      this.allBooks = this.bibleData.books;
      console.log('Loaded Bible books:', this.allBooks.length);
    } else {
      console.error('Failed to load Bible data');
    }
  }

  /**
   * Ensure memorization progress has been loaded from the backend before
   * attempting to render verses. This method caches the result so that
   * subsequent calls do not trigger another API request.
   */
  private async ensureProgressLoaded(): Promise<void> {
    if (this.progressLoaded) {
      return;
    }
    try {
      // Fetch user memorization data, which updates the BibleData instance
      await firstValueFrom(this.bibleService.getUserVerses(this.userId));
    } catch (error) {
      console.error('Error loading memorization progress:', error);
    }
    this.progressLoaded = true;
    // Refresh Bible data and visible books after progress has been applied
    this.loadBibleData();
  }

  private async loadChapter(bookId: number, chapterNum: number) {
    try {
      // Make sure progress is loaded before generating verses
      await this.ensureProgressLoaded();

      this.isLoading = true;
      this.currentChapter = chapterNum;

      // Ensure bible data is available
      if (!this.bibleData) {
        this.loadBibleData();
      }

      this.currentBook = this.bibleData?.getBookById(bookId) || null;
      if (!this.currentBook) {
        console.error('Book not found:', bookId);
        this.isLoading = false;
        return;
      }

      // Get chapter from book
      this.currentBibleChapter = this.currentBook.getChapter(chapterNum);
      // Get all chapters for this book
      this.availableChapters = this.currentBook.chapters;

      console.log('Loading chapter:', this.currentBook.name, chapterNum);

      // Generate verse codes
      const totalVerses = this.currentBibleChapter.totalVerses;
      const verseCodes: string[] = Array.from({ length: totalVerses }, (_, i) =>
        `${bookId}-${chapterNum}-${i + 1}`
      );

      // Get verse texts
      const verseTexts = await firstValueFrom(
        this.bibleService.getVerseTexts(this.userId, verseCodes)
      );
      console.log('Verse texts loaded:', Object.keys(verseTexts).length);

      // Create verses array
      this.verses = verseCodes.map((code, index) => {
        const [, , verseNum] = code.split('-').map(Number);
        const text = verseTexts[code] || '';

        // Check if this verse starts a new paragraph
        // Get memorization status from Bible model
        const bibleVerse = this.currentBibleChapter?.verses[verseNum - 1];
        const isMemorized = bibleVerse?.memorized || false;

        return {
          verseCode: code,
          reference: this.currentBook!.chapters.length === 1 ? `v${verseNum}` : `${chapterNum}:${verseNum}`,
          text: text,
          firstLetters: this.flowParsingService.extractFirstLetters(text),
          isMemorized: isMemorized,
          isFifth: (index + 1) % 5 === 0,
          bookName: this.currentBook!.name,
          chapter: chapterNum,
          verse: verseNum,
          isSaving: false
        } as FlowVerse;
      });

      // Initialize review data for memorized verses
      this.verses.forEach(verse => {
        if (verse.isMemorized) {
          const daysSinceMemorized = Math.floor(Math.random() * 10) + 1;
          this.verseReviewData[verse.verseCode] = {
            lastReviewed: Date.now() - daysSinceMemorized * 24 * 60 * 60 * 1000,
            strength: Math.max(50, 100 - daysSinceMemorized * 5)
          };
        }
      });

      this.isLoading = false;
      console.log('Verses loaded with memorization data:', this.verses.length);
    } catch (error) {
      console.error('Error loading chapter:', error);
      this.isLoading = false;
      this.notificationService.error('Failed to load chapter data');
    }
  }

  private loadSavedState() {
    const savedState = this.flowStateService.getState();
    this.fontSize = savedState.fontSize || 16;
    this.layoutMode = savedState.layoutMode || 'grid';
    this.showFullText = savedState.isTextMode || false;
  }

  private saveState() {
    this.flowStateService.updateState({
      fontSize: this.fontSize,
      layoutMode: this.layoutMode,
      isTextMode: this.showFullText
    });
  }

  private setupSaveQueue() {
    this.saveQueue$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(verse => {
        this.flowMemorizationService.queueVerseSave(verse, this.userId);
      });
  }

  // Verse click handling
  handleVerseClick(index: number, event: MouseEvent) {
    event.preventDefault();
    const actualIndex = this.getActualIndex(index);
    this.selectionService.handleVerseClick(actualIndex, event, this.verses);
  }

  handleVerseDoubleClick(verse: FlowVerse) {
    this.toggleMemorized(verse);
  }

  handleContextMenu(event: MouseEvent, verse: FlowVerse) {
    event.preventDefault();
    event.stopPropagation();
    
    // If the verse is not selected, add it to selection (without clearing others)
    if (!this.selectionService.isVerseSelected(verse)) {
      this.selectionService.selectedVerses.add(verse.verseCode);
    }
    
    // Show context menu
    this.contextMenu = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      verseId: verse.verseCode,
      selectedCount: this.selectionService.selectedVerses.size
    };
  }

  // Drag selection
  handleMouseDown(index: number) {
    const actualIndex = this.getActualIndex(index);
    this.selectionService.handleMouseDown(actualIndex);
  }

  handleMouseEnter(index: number) {
    const actualIndex = this.getActualIndex(index);
    this.selectionService.handleMouseMove(actualIndex, this.verses);
  }

  handleMouseUp() {
    this.selectionService.handleMouseUp();
  }

  private getActualIndex(filteredIndex: number): number {
    // Convert filtered index to actual verse index
    const filteredVerses = this.getFilteredVerses();
    if (filteredIndex >= 0 && filteredIndex < filteredVerses.length) {
      const verse = filteredVerses[filteredIndex];
      return this.verses.findIndex(v => v.verseCode === verse.verseCode);
    }
    return filteredIndex;
  }

  // Actions
  toggleMemorized(verse: FlowVerse) {
    const wasMemorized = verse.isMemorized;
    verse.isMemorized = !verse.isMemorized;
    verse.isSaving = true;
    this.saveQueue$.next(verse);
    // Update store
    const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
    this.store.dispatch(BibleMemorizationActions.toggleVerseMemorization({
      userId: this.userId,
      bookId,
      chapterNumber: chapter,
      verseNumber: verseNum
    }));
    // Update Bible model
    if (this.currentBibleChapter) {
      this.currentBibleChapter.toggleVerse(verseNum);
    }
    // Show appropriate message
    if (!wasMemorized && verse.isMemorized) {
      // Marking as memorized
      const memorizedCount = this.verses.filter(v => v.isMemorized).length;
      if (memorizedCount > 0 && memorizedCount % 5 === 0) {
        this.showEncouragement = `Great job! ${memorizedCount} verses memorized! 🎉`;
        setTimeout(() => (this.showEncouragement = ''), 3000);
      }
    } else if (wasMemorized && !verse.isMemorized) {
      // Unmarking as memorized
      this.notificationService.info('Verse unmarked as memorized');
    }
  }

  markSelectedAsMemorized() {
    let changedCount = 0;
    this.selectionService.selectedVerses.forEach(verseCode => {
      const verse = this.verses.find(v => v.verseCode === verseCode);
      if (verse && !verse.isMemorized) {
        this.toggleMemorized(verse);
        changedCount++;
      }
    });
    if (changedCount > 0) {
      this.showEncouragement = `${changedCount} verse${changedCount > 1 ? 's' : ''} marked as memorized!`;
      setTimeout(() => (this.showEncouragement = ''), 3000);
    }
    this.contextMenu.visible = false;
  }

  markSelectedAsUnmemorized() {
    let changedCount = 0;
    this.selectionService.selectedVerses.forEach(verseCode => {
      const verse = this.verses.find(v => v.verseCode === verseCode);
      if (verse && verse.isMemorized) {
        this.toggleMemorized(verse);
        changedCount++;
      }
    });
    if (changedCount > 0) {
      this.notificationService.info(`${changedCount} verse${changedCount > 1 ? 's' : ''} unmarked as memorized`);
    }
    this.contextMenu.visible = false;
  }

  selectAll() {
    this.selectionService.selectAll(this.verses);
  }

  selectSection(section: VerseSection) {
    this.selectionService.selectSection(section, this.verses);
  }

  // Navigation
  changeChapter(chapter: number) {
    if (chapter !== this.currentChapter && this.currentBook) {
      this.router.navigate([], {
        queryParams: { bookId: this.currentBook.id, chapter },
        queryParamsHandling: 'merge'
      });
    }
  }

  goToPreviousChapter() {
    if (this.currentChapter > 1) {
      this.changeChapter(this.currentChapter - 1);
    }
  }

  goToNextChapter() {
    if (this.currentBook && this.currentChapter < this.currentBook.totalChapters) {
      this.changeChapter(this.currentChapter + 1);
    }
  }

  hasNextChapter(): boolean {
    if (!this.currentBook) return false;
    return this.currentChapter < this.currentBook.totalChapters;
  }

  changeBook(bookId: number) {
    // Navigate to the new book at chapter 1
    console.log('Changing to book:', bookId);
    this.router.navigate([], {
      queryParams: { bookId, chapter: 1 },
      queryParamsHandling: 'merge'
    });
  }

  // Settings
  toggleSettings(event: MouseEvent) {
    event.stopPropagation();
    this.showSettings = !this.showSettings;
    this.isGearSpinning = true;
    setTimeout(() => (this.isGearSpinning = false), 600);
  }

  increaseFontSize() {
    if (this.fontSize < 24) {
      this.fontSize += 2;
      this.saveState();
    }
  }

  decreaseFontSize() {
    if (this.fontSize > 12) {
      this.fontSize -= 2;
      this.saveState();
    }
  }

  setLayoutMode(mode: 'grid' | 'single') {
    this.layoutMode = mode;
    this.saveState();
  }

  toggleTextMode() {
    this.showFullText = !this.showFullText;
    this.saveState();
  }

  // Filtering
  getFilteredVerses(): FlowVerse[] {
    if (!this.verses || this.verses.length === 0) {
      return [];
    }
    switch (this.activeFilter) {
      case 'unmemorized':
        return this.verses.filter(v => !v.isMemorized);
      case 'needsReview':
        return this.verses.filter(v => this.needsReview(v.verseCode));
      default:
        return this.verses;
    }
  }

  needsReview(verseCode: string): boolean {
    const reviewData = this.verseReviewData[verseCode];
    if (!reviewData) return false;
    // Needs review if strength is below 80% or last reviewed more than 3 days ago
    const daysSinceReview = (Date.now() - reviewData.lastReviewed) / (1000 * 60 * 60 * 24);
    return reviewData.strength < 80 || daysSinceReview > 3;
  }

  getVerseDisplay(verse: FlowVerse): string {
    if (!verse) { return ''; }
    const text = this.showFullText ? verse.text : verse.firstLetters;
    // Remove a leading pilcrow so we don't double-signal when the label shows
    return text.replace(/^¶\s*/, '');
  }

  // Study session
  startStudySession() {
    const selectedVerseObjects = this.verses.filter(v =>
      this.selectionService.selectedVerses.has(v.verseCode)
    );
    this.modalVerses = selectedVerseObjects.map(v => ({
      code: v.verseCode,
      text: v.text.replace(/¶\s*/g, ''), // Remove paragraph markers
      reference: v.reference,
      bookId: this.currentBook?.id || 0,
      chapter: v.chapter,
      verse: v.verse
    }));
    this.modalChapterName = `${this.currentBook?.name} ${this.currentChapter}`;
    this.showModal = true;
  }

  startFullChapter() {
    this.modalVerses = this.verses.map(v => ({
      code: v.verseCode,
      text: v.text.replace(/¶\s*/g, ''),
      reference: v.reference,
      bookId: this.currentBook?.id || 0,
      chapter: v.chapter,
      verse: v.verse
    }));
    this.modalChapterName = `${this.currentBook?.name} ${this.currentChapter}`;
    this.showModal = true;
  }

  onModalCompleted(event: { memorized: boolean }) {
    this.showModal = false;
    if (event.memorized && this.currentBook) {
      // Reload verse data to reflect memorization
      this.loadChapter(this.currentBook.id, this.currentChapter);
    }
  }

  // Create Deck Modal methods
  openCreateDeckModal() {
    // Store the verses that should be added to the new deck
    this.pendingVersesToAdd = this.contextMenu.selectedCount > 0
      ? Array.from(this.selectionService.selectedVerses)
      : [this.contextMenu.verseId!];
    
    this.showCreateDeckModal = true;
    this.contextMenu.visible = false;
  }

  closeCreateDeckModal() {
    this.showCreateDeckModal = false;
    this.createDeckLoading = false;
    this.pendingVersesToAdd = []; // Clear pending verses when modal is closed
  }

  handleCreateDeck(deckData: DeckCreate) {
    this.createDeckLoading = true;
    
    this.deckService.createDeck(deckData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdDeck) => {
          console.log('Deck created successfully:', createdDeck);
          
          // If there are pending verses to add, add them to the new deck
          if (this.pendingVersesToAdd.length > 0) {
            this.addVersesToNewDeck(createdDeck, deckData.name);
          } else {
            this.notificationService.success(`Deck "${deckData.name}" created successfully!`);
            this.finalizeDeckCreation();
          }
        },
        error: (error) => {
          console.error('Error creating deck:', error);
          this.notificationService.error('Error creating deck. Please try again.');
          this.createDeckLoading = false;
        }
      });
  }

  private addVersesToNewDeck(createdDeck: DeckResponse, deckName: string) {
    // Convert verse codes to actual verse codes and create reference
    const verseCodes = this.pendingVersesToAdd.map(verseId => {
      // If verseId is already a verse code, use it; otherwise find the verse
      if (verseId.includes('-')) {
        return verseId;
      } else {
        const verse = this.verses.find(v => v.verseCode === verseId);
        return verse ? verse.verseCode : null;
      }
    }).filter(code => code !== null) as string[];

    if (verseCodes.length === 0) {
      this.notificationService.success(`Deck "${deckName}" created successfully!`);
      this.finalizeDeckCreation();
      return;
    }

    // Create reference for the verses
    const firstVerseCode = verseCodes[0];
    const lastVerseCode = verseCodes[verseCodes.length - 1];
    const firstVerse = this.verses.find(v => v.verseCode === firstVerseCode);
    const lastVerse = this.verses.find(v => v.verseCode === lastVerseCode);
    
    let reference = '';
    if (this.currentBook && firstVerse && lastVerse) {
      if (verseCodes.length === 1) {
        reference = `${this.currentBook.name} ${firstVerse.reference}`;
      } else {
        reference = `${this.currentBook.name} ${firstVerse.reference}-${lastVerse.reference}`;
      }
    }

    // Add verses to the new deck
    this.deckService.addVersesToDeck(createdDeck.deck_id, verseCodes, reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Added ${verseCodes.length} verses to ${deckName}`);
          this.notificationService.success(`Deck "${deckName}" created with ${verseCodes.length} verse${verseCodes.length > 1 ? 's' : ''}!`);
          this.finalizeDeckCreation();
        },
        error: (error) => {
          console.error('Error adding verses to new deck:', error);
          this.notificationService.warning(`Deck "${deckName}" created, but failed to add verses. You can add them manually.`);
          this.finalizeDeckCreation();
        }
      });
  }

  private finalizeDeckCreation() {
    // Clear pending verses
    this.pendingVersesToAdd = [];
    
    // Reload user decks to include the new deck
    this.loadUserDecks();
    
    // Close the modal
    this.closeCreateDeckModal();
  }

  // Load user's flashcard decks
  loadUserDecks() {
    if (!this.userId) return;
    
    this.deckService.getUserDecks(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.flashcardDecks = response.decks;
          this.flashcardDeckNames = response.decks.map(deck => deck.name);
          console.log('Loaded flashcard decks:', this.flashcardDeckNames);
          
          // If no decks exist, show a message or create a default deck
          if (this.flashcardDecks.length === 0) {
            this.flashcardDeckNames = ['Create a deck first'];
          }
        },
        error: (error) => {
          console.error('Error loading flashcard decks:', error);
          this.flashcardDecks = [];
          this.flashcardDeckNames = [];
        }
      });
  }

  // Flashcard operations
  addToFlashcardDeck(deckName: string) {
    // Handle case where user needs to create a deck first
    if (deckName === 'Create a deck first') {
      this.router.navigate(['/decks']);
      this.contextMenu.visible = false;
      return;
    }

    const versesToAdd = this.contextMenu.selectedCount > 0
      ? Array.from(this.selectionService.selectedVerses)
      : [this.contextMenu.verseId!];
      
    // Find the deck by name
    const selectedDeck = this.flashcardDecks.find(deck => deck.name === deckName);
    if (!selectedDeck) {
      console.error('Deck not found:', deckName);
      return;
    }

    // Ensure versesToAdd contains numbers
    const numericVerseIndices = versesToAdd
      .map(index => typeof index === 'number' ? index : parseInt(String(index)))
      .filter(index => !isNaN(index));

    if (numericVerseIndices.length === 0) {
      console.error('No valid verse indices to add');
      return;
    }

    // Convert verse indices to verse codes
    const verseCodes = numericVerseIndices.map(verseIndex => {
      const verse = this.verses[verseIndex];
      return verse ? verse.verseCode : null;
    }).filter(code => code !== null) as string[];

    if (verseCodes.length === 0) {
      console.error('No valid verses to add');
      return;
    }

    // Create reference for the verses
    const firstVerseIndex = Math.min(...numericVerseIndices);
    const lastVerseIndex = Math.max(...numericVerseIndices);
    const firstVerse = this.verses[firstVerseIndex];
    const lastVerse = this.verses[lastVerseIndex];
    
    let reference = '';
    if (this.currentBook && firstVerse && lastVerse) {
      if (firstVerseIndex === lastVerseIndex) {
        reference = `${this.currentBook.name} ${firstVerse.reference}`;
      } else {
        reference = `${this.currentBook.name} ${firstVerse.reference}-${lastVerse.reference}`;
      }
    }

    // Add verses to the deck
    this.deckService.addVersesToDeck(selectedDeck.deck_id, verseCodes, reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Added ${numericVerseIndices.length} verses to ${deckName}`);
          this.notificationService.success(`Added ${numericVerseIndices.length} verse${numericVerseIndices.length > 1 ? 's' : ''} to "${deckName}"!`);
          this.contextMenu.visible = false;
        },
        error: (error) => {
          console.error('Error adding verses to deck:', error);
          this.notificationService.error('Failed to add verses to deck. Please try again.');
        }
      });
  }

  // Utility methods
  getVerseSection(index: number): VerseSection | undefined {
    return this.verseSections.find(s => index >= s.start && index <= s.end);
  }

  isVerseSelected(verse: FlowVerse): boolean {
    return this.selectionService.isVerseSelected(verse);
  }

  isNewParagraph(verse: FlowVerse): boolean {
    return verse.text.indexOf('¶') > 0;
  }

  getVerseState(verse: FlowVerse, index: number): string {
    const classes = ['verse-block'];
    if (this.isNewParagraph(verse)) {
      classes.push('new-paragraph');
    }

    // Memorized state (adds green border + check)
    if (verse.isMemorized) {
      if (this.needsReview(verse.verseCode)) {
        classes.push('memorized-needs-review');
      } else {
        classes.push('memorized');
      }
    }

    // Selection ALWAYS adds 'selected' (blue border wins)
    if (this.isVerseSelected(verse)) {
      classes.push('selected');
    } else if (verse.isFifth) {
      classes.push('fifth-verse');
    }

    return classes.join(' ');
  }

  isMilestoneAchieved(milestone: number): boolean {
    return this.progressPercentage >= milestone;
  }

  private showSaveNotification() {
    this.showEncouragement = 'Progress saved!';
    setTimeout(() => (this.showEncouragement = ''), 2000);
  }
}