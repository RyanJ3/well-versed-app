import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, firstValueFrom, take } from 'rxjs';
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
import { VersePickerComponent } from './components/verse-picker/verse-picker.component';
import { TopicPickerComponent } from './components/topic-picker/topic-picker.component';

import { BibleBook, BibleChapter, BibleVerse, BibleData } from '@models/bible';
import { FlowVerse, ModalVerse } from './models/flow.models';
import { ContextMenuData } from './models/context-menu-data.model';
import { FlowParsingService } from '@services/utils/flow-parsing.service';
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
    CreateDeckModalComponent,
    VersePickerComponent,
    TopicPickerComponent
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
  activeFilter: 'all' | 'unmemorized' | 'needsReview' = 'all';
  showSettings = false;
  isGearSpinning = false;
  showEncouragement = '';
  isLoading = false;
  
  // Mode state
  mode: 'memorization' | 'crossReferences' | 'topical' = 'memorization';
  
  // Cross-references state
  crossReferenceVerses: FlowVerse[] = [];
  selectedCrossRefVerse: any = null;
  crossReferenceCount = 0;
  loadingCrossReferences = false;

  // Topical verses state
  topicalVerses: FlowVerse[] = [];
  selectedTopic: any = null;
  topicalVerseCount = 0;
  loadingTopicalVerses = false;
  availableTopics: any[] = [];

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
  
  // Track target verse for scrolling after navigation
  private targetVerseAfterLoad: number | null = null;

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
      // Exit cross-references mode if active
      if (this.mode === 'crossReferences') {
        this.mode = 'memorization';
      }
    } else if (event.key === 'Enter') {
      if (this.mode === 'crossReferences' && this.selectionService.selectedVerses.size === 1) {
        // Navigate to selected cross-reference
        const selectedCode = Array.from(this.selectionService.selectedVerses)[0];
        const selectedVerse = this.crossReferenceVerses.find(v => v.verseCode === selectedCode);
        if (selectedVerse) {
          this.navigateToVerse(selectedVerse);
        }
      } else if (this.selectionService.selectedVerses.size > 0) {
        this.startStudySession();
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      this.selectAll();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
      // Toggle cross-references mode
      event.preventDefault();
      this.mode = this.mode === 'memorization' ? 'crossReferences' : 'memorization';
      this.onModeChange(this.mode);
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
      
      // Scroll to target verse if set (from navigation)
      if (this.targetVerseAfterLoad !== null) {
        setTimeout(() => {
          this.scrollToVerse(this.targetVerseAfterLoad!);
          // Highlight the target verse temporarily
          const targetVerse = this.verses.find(v => v.verse === this.targetVerseAfterLoad);
          if (targetVerse) {
            this.selectionService.clearSelection();
            this.selectionService.addToSelection(targetVerse);
            // Clear selection after a delay
            setTimeout(() => {
              this.selectionService.clearSelection();
            }, 2000);
          }
          this.targetVerseAfterLoad = null;
        }, 100);
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
      this.isLoading = false;
      this.notificationService.error('Failed to load chapter data');
    }
  }
  
  private scrollToVerse(verseNumber: number) {
    const verseElements = document.querySelectorAll('.verse-block');
    const targetElement = Array.from(verseElements).find(el => {
      const refElement = el.querySelector('.verse-ref');
      return refElement?.textContent?.includes(`v${verseNumber}`);
    });
    
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    
    // Update Bible model
    const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
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

  // Mode switching methods
  onModeChange(newMode: 'memorization' | 'crossReferences' | 'topical') {
    this.mode = newMode;
    
    if (newMode === 'crossReferences') {
      // Clear current verses when switching to cross-references mode
      this.activeFilter = 'all';
      // If no verse is selected, select the first verse of current chapter
      if (!this.selectedCrossRefVerse && this.verses.length > 0) {
        const firstVerse = this.verses[0];
        this.onCrossRefVerseSelected({
          bookId: this.currentBook?.id || 1,
          bookName: this.currentBook?.name || '',
          chapter: this.currentChapter,
          verse: firstVerse.verseNumber,
          verseCode: firstVerse.verseCode,
          displayText: `${this.currentBook?.name} ${this.currentChapter}:${firstVerse.verseNumber}`
        });
      }
    } else if (newMode === 'topical') {
      // Switch to topical mode
      this.activeFilter = 'all';
      this.crossReferenceVerses = [];
      this.selectedCrossRefVerse = null;
      this.topicalVerses = [];
      this.selectedTopic = null;
      // Load available topics for selection
      this.loadAvailableTopics();
    } else {
      // Switch back to memorization mode
      this.crossReferenceVerses = [];
      this.selectedCrossRefVerse = null;
    }
  }
  
  onCrossRefVerseSelected(verse: any) {
    this.selectedCrossRefVerse = verse;
    this.loadCrossReferences(verse.bookId, verse.chapter, verse.verse);
  }
  
  loadCrossReferences(bookId: number, chapter: number, verse: number) {
    this.loadingCrossReferences = true;
    this.crossReferenceVerses = [];
    
    this.bibleService.getCrossReferencesForVerse(bookId, chapter, verse)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (references) => {
          console.log('Loaded cross-references:', references);
          this.crossReferenceCount = references.length;
          
          // Convert cross-references to FlowVerse format
          this.crossReferenceVerses = references.map((ref, index) => ({
            index: index,
            verseNumber: ref.verse_number,
            verseCode: ref.verse_code,
            reference: `${ref.book_name} ${ref.chapter}:${ref.verse_number}`,
            fullReference: `${ref.book_name} ${ref.chapter}:${ref.verse_number}`,
            text: ref.verse_text || '',
            firstLetters: '',  // Not needed for cross-references
            isMemorized: ref.is_memorized || false,
            isFifth: false,  // Not relevant for cross-references
            isNewSentence: false,
            isNewParagraph: false,
            bookName: ref.book_name || '',
            chapter: ref.chapter || 0,
            verse: ref.verse_number || 0,
            verseId: ref.verse_id,
            displayText: ref.verse_text || '',
            practiceCount: ref.practice_count || 0,
            confidenceScore: ref.confidence_score || 0,
            crossRefConfidence: ref.cross_ref_confidence || 0,
            direction: ref.direction || 'from'
          } as FlowVerse));
          
          // Sort by confidence score
          this.crossReferenceVerses.sort((a, b) => (b.crossRefConfidence || 0) - (a.crossRefConfidence || 0));
          
          this.loadingCrossReferences = false;
        },
        error: (error) => {
          console.error('Error loading cross-references:', error);
          this.notificationService.error('Failed to load cross-references');
          this.loadingCrossReferences = false;
        }
      });
  }
  
  // Utility methods

  isVerseSelected(verse: FlowVerse): boolean {
    return this.selectionService.isVerseSelected(verse);
  }

  isNewParagraph(verse: FlowVerse): boolean {
    return verse.text.indexOf('¶') > 0;
  }

  getFilteredCrossReferences(): FlowVerse[] {
    if (this.activeFilter === 'all') {
      return this.crossReferenceVerses;
    } else if (this.activeFilter === 'unmemorized') {
      return this.crossReferenceVerses.filter(v => !v.isMemorized);
    }
    return this.crossReferenceVerses;
  }
  
  getUnmemorizedCrossRefCount(): number {
    return this.crossReferenceVerses.filter(v => !v.isMemorized).length;
  }
  
  handleCrossRefClick(verse: FlowVerse, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      if (this.isVerseSelected(verse)) {
        this.selectionService.removeFromSelection(verse);
      } else {
        this.selectionService.addToSelection(verse);
      }
    } else {
      // Single selection
      this.selectionService.clearSelection();
      this.selectionService.addToSelection(verse);
    }
  }
  
  navigateToVerse(verse: FlowVerse) {
    // Navigate to the verse in memorization mode
    const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
    
    // Store the target verse for scrolling after load
    this.targetVerseAfterLoad = verseNum;
    
    // Switch to memorization mode
    this.mode = 'memorization';
    
    // Load the chapter containing this verse
    this.loadChapter(bookId, chapter);
    
    // Update current book if navigating to a different book
    const targetBook = this.allBooks.find(b => b.id === bookId);
    if (targetBook && targetBook.id !== this.currentBook?.id) {
      this.currentBook = targetBook;
    }
    
    // Add to navigation history for breadcrumb
    this.notificationService.info(`Navigating to ${verse.fullReference}`);
  }
  
  changeToVerse(verseRef: any) {
    // Navigate to the selected cross-reference source verse
    this.targetVerseAfterLoad = verseRef.verse;
    this.mode = 'memorization';
    this.loadChapter(verseRef.bookId, verseRef.chapter);
    
    // Update current book if navigating to a different book
    const targetBook = this.allBooks.find(b => b.id === verseRef.bookId);
    if (targetBook && targetBook.id !== this.currentBook?.id) {
      this.currentBook = targetBook;
    }
  }
  
  returnFromCrossReferences() {
    // Return to memorization mode from cross-references
    this.mode = 'memorization';
    this.crossReferenceVerses = [];
    this.selectedCrossRefVerse = null;
    this.notificationService.info('Returned to memorization mode');
  }

  // ----- Topical Verses Methods -----
  
  loadAvailableTopics() {
    this.bibleService.getTopics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (topics) => {
          this.availableTopics = topics;
          console.log('Loaded topics:', topics.length);
        },
        error: (error) => {
          console.error('Error loading topics:', error);
          this.notificationService.error('Failed to load topics');
        }
      });
  }
  
  onTopicSelected(topic: any) {
    this.selectedTopic = topic;
    console.log('Selected topic:', topic);
    this.loadTopicalVerses(topic.topicId);
  }
  
  loadTopicalVerses(topicId: number) {
    this.loadingTopicalVerses = true;
    this.topicalVerses = [];
    
    this.bibleService.getTopicalVerses(topicId, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (verses) => {
          console.log('Loaded topical verses:', verses);
          this.topicalVerseCount = verses.length;
          
          // Transform to FlowVerse format
          this.topicalVerses = verses.map((verse, index) => ({
            verseId: verse.verse_id,
            verseCode: verse.verse_code,
            verseNumber: verse.verse_number,
            reference: `${verse.book_name} ${verse.chapter}:${verse.verse_number}`,
            text: verse.verse_text || '',
            firstLetters: this.generateFirstLetters(verse.verse_text || ''),
            displayText: verse.verse_text || '',
            isMemorized: verse.is_memorized,
            isNewSentence: false,
            isNewParagraph: false,
            isFifth: false,
            bookName: verse.book_name,
            chapter: verse.chapter,
            verse: verse.verse_number,
            fullReference: `${verse.book_name} ${verse.chapter}:${verse.verse_number}`,
            topicRelevance: verse.topic_relevance || 0.0,
            topicName: verse.topic_name,
            practiceCount: verse.practice_count || 0,
            confidenceScore: verse.confidence_score || 0.0
          }));
          
          // Sort by relevance (highest first)
          this.topicalVerses.sort((a, b) => (b.topicRelevance || 0) - (a.topicRelevance || 0));
          
          this.loadingTopicalVerses = false;
        },
        error: (error) => {
          console.error('Error loading topical verses:', error);
          this.notificationService.error('Failed to load topical verses');
          this.loadingTopicalVerses = false;
        }
      });
  }
  
  getFilteredTopicalVerses(): FlowVerse[] {
    if (this.activeFilter === 'all') {
      return this.topicalVerses;
    } else if (this.activeFilter === 'unmemorized') {
      return this.topicalVerses.filter(v => !v.isMemorized);
    }
    return this.topicalVerses;
  }
  
  getUnmemorizedTopicalCount(): number {
    return this.topicalVerses.filter(v => !v.isMemorized).length;
  }
  
  handleTopicalClick(verse: FlowVerse, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      if (this.isVerseSelected(verse)) {
        this.selectionService.removeFromSelection(verse);
      } else {
        this.selectionService.addToSelection(verse);
      }
    } else {
      // Single selection
      this.selectionService.clearSelection();
      this.selectionService.addToSelection(verse);
    }
  }

  private generateFirstLetters(text: string): string {
    // Generate first letters of each word for memorization hints
    return text
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 0) // Remove empty strings
      .map(word => word.charAt(0).toUpperCase()) // Get first letter of each word
      .join('');
  }

  jumpToCrossReferencesFromContextMenu() {
    // Hide the context menu first
    this.contextMenu.visible = false;
    
    // Get the selected verse or the context menu verse
    let targetVerse: FlowVerse | null = null;
    
    if (this.selectionService.selectedVerses.size === 1) {
      // Use the selected verse - selectedVerses contains verse codes, so we need to find the actual verse
      const selectedVerseCode = Array.from(this.selectionService.selectedVerses)[0];
      targetVerse = this.verses.find(v => v.verseCode === selectedVerseCode) ||
                   this.crossReferenceVerses.find(v => v.verseCode === selectedVerseCode) ||
                   this.topicalVerses.find(v => v.verseCode === selectedVerseCode) ||
                   null;
    } else if (this.contextMenu.verseId) {
      // Use the verse that was right-clicked - check all verse arrays
      targetVerse = this.verses.find(v => v.verseCode === this.contextMenu.verseId) ||
                   this.crossReferenceVerses.find(v => v.verseCode === this.contextMenu.verseId) ||
                   this.topicalVerses.find(v => v.verseCode === this.contextMenu.verseId) ||
                   null;
    }
    
    if (!targetVerse) {
      this.notificationService.error('No verse selected for cross-references');
      return;
    }
    
    // Switch to cross-references mode
    this.mode = 'crossReferences';
    
    // Parse verse info from verse code
    const [bookId, chapter, verseNum] = targetVerse.verseCode.split('-').map(Number);
    
    // Set up the cross-reference selection
    const crossRefSelection = {
      bookId: bookId,
      bookName: targetVerse.bookName || this.currentBook?.name || '',
      chapter: chapter,
      verse: verseNum,
      verseCode: targetVerse.verseCode,
      displayText: `${targetVerse.bookName || this.currentBook?.name} ${chapter}:${verseNum}`
    };
    
    // Load cross-references for this verse
    this.onCrossRefVerseSelected(crossRefSelection);
    
    // Show success message
    this.notificationService.info(`Jumped to cross-references for ${crossRefSelection.displayText}`);
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