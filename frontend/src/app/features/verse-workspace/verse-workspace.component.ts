import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, firstValueFrom } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

// Services
import { BibleService } from '@services/api/bible.service';
import { UserService } from '@services/api/user.service';
import { NotificationService } from '@services/utils/notification.service';
import { WorkspaceStateService } from './services/workspace-state.service';
import { WorkspaceMemorizationService } from './services/workspace-memorization.service';
import { WorkspaceSelectionService } from './services/workspace-selection.service';
import { WorkspaceParsingService } from '@services/utils/workspace-parsing.service';

// New Services
import { WorkspaceCrossReferencesService } from './services/workspace-cross-references.service';
import { WorkspaceTopicalService } from './services/workspace-topical.service';
import { WorkspaceDeckManagementService } from './services/workspace-deck-management.service';
import { WorkspaceUIStateService } from './services/workspace-ui-state.service';
import { WorkspaceVerseFacade } from './services/workspace-verse.facade';

// Components
import { MemorizationModalComponent } from './memorization/memorization-modal.component';
import { WorkspaceFiltersComponent } from './components/workspace-filters/workspace-filters.component';
import { WorkspaceContextMenuComponent } from './components/workspace-context-menu/workspace-context-menu.component';
import { WorkspaceHeaderComponent } from './components/workspace-header/workspace-header.component';
import { CreateDeckModalComponent } from '../decks/components/create-deck-modal/create-deck-modal.component';
import { TopicPickerComponent } from './components/topic-picker/topic-picker.component';
import { VerseListComponent } from './components/verse-list/verse-list.component';

// Models
import { BibleBook, BibleChapter, BibleData } from '@models/bible';
import { WorkspaceVerse, ModalVerse } from './models/workspace.models';
import { WorkspaceMode } from './models/workspace-mode.enum';
import { DeckCreate } from '@services/api/deck.service';

// Utils
import { WorkspaceVerseUtils } from './utils/workspace-verse.utils';

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
    TopicPickerComponent,
    VerseListComponent
  ],
  providers: [
    WorkspaceStateService, 
    WorkspaceMemorizationService, 
    WorkspaceSelectionService,
    WorkspaceCrossReferencesService,
    WorkspaceTopicalService,
    WorkspaceDeckManagementService,
    WorkspaceUIStateService
  ],
  templateUrl: './verse-workspace.component.html',
  styleUrls: ['./verse-workspace.component.scss'],
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
export class VerseWorkspaceComponent implements OnInit, OnDestroy {
  @ViewChild('versesContainer') versesContainer!: ElementRef;

  private workspaceParsingService = inject(WorkspaceParsingService);
  
  // Expose enum to template
  readonly WorkspaceMode = WorkspaceMode;

  // Core data
  verses: WorkspaceVerse[] = [];
  hasApocrypha = false;
  
  // Bible models
  bibleData: BibleData | null = null;
  currentBook: BibleBook | null = null;
  currentChapter = 1;
  currentBibleChapter: BibleChapter | null = null;
  allBooks: BibleBook[] = [];
  availableChapters: BibleChapter[] = [];

  // Review data
  verseReviewData: Record<string, { lastReviewed: number; strength: number }> = {};

  // Modal
  modalVerses: ModalVerse[] = [];

  // Expose utilities to template
  Math = Math;
  verseUtils = WorkspaceVerseUtils;

  private destroy$ = new Subject<void>();
  private saveQueue$ = new Subject<WorkspaceVerse>();
  private userId = 1;
  private progressLoaded = false;
  private userPreferredBible: string | undefined;
  private userPreferredLanguage: string | undefined;

  // Computed properties
  get isRTL(): boolean {
    // Check if the language is Hebrew or Arabic
    return this.userPreferredLanguage === 'heb' || 
           this.userPreferredLanguage === 'hbo' ||  // Ancient Hebrew
           this.userPreferredLanguage === 'ara' ||
           this.userPreferredLanguage === 'arb' ||  // Standard Arabic
           this.userPreferredLanguage === 'hebrew' ||
           this.userPreferredLanguage === 'arabic';
  }

  get memorizedVersesCount(): number {
    return WorkspaceVerseUtils.getVerseCounts(this.verses).memorized;
  }

  get unmemorizedVersesCount(): number {
    return WorkspaceVerseUtils.getVerseCounts(this.verses).unmemorized;
  }

  get needsReviewCount(): number {
    return WorkspaceVerseUtils.getVerseCounts(this.verses, this.verseReviewData).needsReview;
  }

  get progressPercentage(): number {
    if (!this.currentBook) return 0;
    return WorkspaceVerseUtils.calculateProgress(
      this.currentBook.memorizedVerses,
      this.currentBook.totalVerses
    );
  }

  get progressBarWidth(): number {
    if (this.verses.length === 0) return 0;
    return WorkspaceVerseUtils.calculateProgress(this.memorizedVersesCount, this.verses.length);
  }

  get selectedVerseIsMemorized(): boolean {
    const contextMenu = this.uiStateService.currentState.contextMenu;
    if (!contextMenu.verseId) return false;
    const verse = this.verses.find(v => v.verseCode === contextMenu.verseId);
    return verse?.isMemorized || false;
  }

  get shouldShowMarkAsMemorized(): boolean {
    const contextMenu = this.uiStateService.currentState.contextMenu;
    if (contextMenu.selectedCount > 0) {
      const selectedVerses = Array.from(this.selectionService.selectedVerses);
      const verses = this.getCurrentVerses();
      return selectedVerses.some(verseCode => {
        const verse = verses.find(v => v.verseCode === verseCode);
        return verse && !verse.isMemorized;
      });
    }
    return !this.selectedVerseIsMemorized;
  }

  get shouldShowMarkAsUnmemorized(): boolean {
    const contextMenu = this.uiStateService.currentState.contextMenu;
    if (contextMenu.selectedCount > 0) {
      const selectedVerses = Array.from(this.selectionService.selectedVerses);
      const verses = this.getCurrentVerses();
      return selectedVerses.some(verseCode => {
        const verse = verses.find(v => v.verseCode === verseCode);
        return verse && verse.isMemorized;
      });
    }
    return this.selectedVerseIsMemorized;
  }

  get shouldShowJumpToChapter(): boolean {
    // Don't show in memorization mode (already showing chapter)
    if (this.mode === WorkspaceMode.MEMORIZATION) return false;
    
    // Don't show if no verses are selected
    if (this.selectionService.selectedVerses.size === 0) return false;
    
    const verses = this.getCurrentVerses();
    const selectedVerseCodes = Array.from(this.selectionService.selectedVerses);
    
    // Get all selected verses
    const selectedVerses = selectedVerseCodes
      .map(code => verses.find(v => v.verseCode === code))
      .filter(v => v !== undefined) as WorkspaceVerse[];
    
    if (selectedVerses.length === 0) return false;
    
    // Check if all selected verses are from the same chapter
    const firstVerse = selectedVerses[0];
    const [firstBookId, firstChapter] = this.workspaceParsingService.parseVerseCode(firstVerse.verseCode);
    
    const allSameChapter = selectedVerses.every(verse => {
      const [bookId, chapter] = this.workspaceParsingService.parseVerseCode(verse.verseCode);
      return bookId === firstBookId && chapter === firstChapter;
    });
    
    // Only show if all verses are from the same chapter
    if (!allSameChapter) return false;
    
    // Don't show if already viewing this chapter in memorization mode
    if (this.currentBook?.id === firstBookId && this.currentChapter === firstChapter) {
      return false;
    }
    
    return true;
  }

  // Public getters for template
  get showFullText(): boolean { return this.uiStateService.currentState.showFullText; }
  get fontSize(): number { return this.uiStateService.currentState.fontSize; }
  get layoutMode(): 'grid' | 'single' { return this.uiStateService.currentState.layoutMode; }
  get activeFilter(): 'all' | 'unmemorized' | 'needsReview' { return this.uiStateService.currentState.activeFilter as 'all' | 'unmemorized' | 'needsReview'; }
  get showSettings(): boolean { return this.uiStateService.currentState.showSettings; }
  get isGearSpinning(): boolean { return this.uiStateService.currentState.isGearSpinning; }
  get showEncouragement(): string { return this.uiStateService.currentState.showEncouragement; }
  get isLoading(): boolean { return this.uiStateService.currentState.isLoading; }
  get mode(): WorkspaceMode { 
    const modeString = this.uiStateService.currentState.mode;
    // Map string values to enum
    switch(modeString) {
      case 'crossReferences': return WorkspaceMode.CROSS_REFERENCES;
      case 'topical': return WorkspaceMode.TOPICAL;
      default: return WorkspaceMode.MEMORIZATION;
    }
  }
  get contextMenu(): any { return this.uiStateService.currentState.contextMenu; }
  get showModal(): boolean { return this.uiStateService.currentState.showModal; }
  get modalChapterName(): string { return this.uiStateService.currentState.modalChapterName; }

  // Cross-references getters
  get crossReferenceVerses(): WorkspaceVerse[] { return this.crossReferencesService.verses; }
  get selectedCrossRefVerse(): any { return this.crossReferencesService.selectedVerse; }
  get crossReferenceCount(): number { return this.crossReferencesService.count; }
  get loadingCrossReferences(): boolean { return this.crossReferencesService.isLoading; }

  // Topical getters
  get topicalVerses(): WorkspaceVerse[] { return this.topicalService.verses; }
  get selectedTopic(): any { return this.topicalService.selectedTopic; }
  get topicalVerseCount(): number { return this.topicalService.count; }
  get loadingTopicalVerses(): boolean { return this.topicalService.isLoading; }
  get availableTopics(): any[] { return this.topicalService.availableTopics; }

  // Deck management getters
  get flashcardDecks(): any[] { return this.deckManagementService.decks; }
  get flashcardDeckNames(): string[] { return this.deckManagementService.deckNames; }
  get showCreateDeckModal(): boolean { return this.deckManagementService.currentState.showCreateModal; }
  get createDeckLoading(): boolean { return this.deckManagementService.currentState.createLoading; }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bibleService: BibleService,
    private userService: UserService,
    private workspaceStateService: WorkspaceStateService,
    private workspaceMemorizationService: WorkspaceMemorizationService,
    private notificationService: NotificationService,
    public selectionService: WorkspaceSelectionService,
    private crossReferencesService: WorkspaceCrossReferencesService,
    private topicalService: WorkspaceTopicalService,
    private deckManagementService: WorkspaceDeckManagementService,
    public uiStateService: WorkspaceUIStateService,
    private verseFacade: WorkspaceVerseFacade  // Injected but not used yet
  ) {}

  ngOnInit() {
    console.log('VerseWorkspaceComponent initializing...');

    // Load Bible data
    this.loadBibleData();

    // Initialize user
    this.initializeUser();
    
    // Subscribe to Bible preferences
    this.bibleService.preferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(prefs => {
        this.hasApocrypha = prefs.includeApocrypha;
      });

    // Setup save queue
    this.setupSaveQueue();

    // Subscribe to save notifications
    this.subscribeToSaveNotifications();

    // Load from route params
    this.subscribeToRouteParams();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.deckManagementService.destroy();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.uiStateService.hideContextMenu();
    this.uiStateService.closeSettings();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.selectionService.clearSelection();
      this.uiStateService.hideContextMenu();
    } else if (event.key === 'Enter') {
      this.handleEnterKey();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      this.selectAll();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
      event.preventDefault();
      this.toggleCrossReferencesMode();
    }
  }

  private initializeUser() {
    this.userService.ensureUserLoaded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.userService.currentUser$
          .pipe(takeUntil(this.destroy$))
          .subscribe(user => {
            if (user) {
              this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
              
              // Update user settings
              this.hasApocrypha = user.includeApocrypha === true;
              
              // Update Bible service preferences
              this.bibleService.updateUserPreferences(this.hasApocrypha);
              
              // Detect Bible translation change
              const previousBible = this.userPreferredBible;
              const previousLanguage = this.userPreferredLanguage;
              
              this.userPreferredBible = user.preferredBible;
              this.userPreferredLanguage = user.preferredLanguage;
              
              console.log('User ID set:', this.userId);
              console.log('User preferred Bible:', this.userPreferredBible);
              console.log('User preferred Language:', this.userPreferredLanguage);
              console.log('ESV API Token present:', !!(user.esvApiToken));
              
              // If Bible translation changed and we have a current chapter loaded, reload it
              if (previousBible && previousBible !== this.userPreferredBible && this.currentBook && this.currentChapter) {
                console.log(`Bible translation changed from ${previousBible} to ${this.userPreferredBible}, reloading verses...`);
                this.bibleService.clearVerseTextCache();
                this.loadChapter(this.currentBook.id, this.currentChapter);
              }
              
              this.deckManagementService.loadUserDecks(this.userId);
            }
          });
      });
  }

  private subscribeToSaveNotifications() {
    this.workspaceMemorizationService.savedNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.uiStateService.showEncouragement('Progress saved!', 2000);
      });
  }

  private subscribeToRouteParams() {
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
          console.log('No params, loading Genesis 1');
          this.loadChapter(1, 1);
        }
      });
  }

  private loadBibleData() {
    this.bibleData = this.bibleService.getBibleData();
    if (this.bibleData) {
      this.allBooks = this.bibleData.books;
      console.log('Loaded Bible books:', this.allBooks.length);
    } else {
      console.error('Failed to load Bible data');
    }
  }

  private async ensureProgressLoaded(): Promise<void> {
    if (this.progressLoaded) return;
    
    try {
      await firstValueFrom(this.bibleService.getUserVerses(this.userId));
    } catch (error) {
      console.error('Error loading memorization progress:', error);
    }
    
    this.progressLoaded = true;
    this.loadBibleData();
  }

  private async loadChapter(bookId: number, chapterNum: number) {
    try {
      await this.ensureProgressLoaded();
      
      this.uiStateService.setLoading(true);
      this.currentChapter = chapterNum;

      if (!this.bibleData) {
        this.loadBibleData();
      }

      this.currentBook = this.bibleData?.getBookById(bookId) || null;
      if (!this.currentBook) {
        console.error('Book not found:', bookId);
        this.uiStateService.setLoading(false);
        return;
      }

      this.currentBibleChapter = this.currentBook.getChapter(chapterNum);
      this.availableChapters = this.currentBook.chapters;

      console.log('Loading chapter:', this.currentBook.name, chapterNum);

      // Generate verse codes
      const totalVerses = this.currentBibleChapter.totalVerses;
      const verseCodes: string[] = Array.from({ length: totalVerses }, (_, i) =>
        `${bookId}-${chapterNum}-${i + 1}`
      );

      // Get verse texts with user's preferred Bible translation
      const verseTexts = await firstValueFrom(
        this.bibleService.getVerseTexts(this.userId, verseCodes, this.userPreferredBible)
      );

      // Create verses array
      this.verses = verseCodes.map((code, index) => {
        const [, , verseNum] = code.split('-').map(Number);
        const text = verseTexts[code] || '';
        const bibleVerse = this.currentBibleChapter?.verses[verseNum - 1];
        const isMemorized = bibleVerse?.memorized || false;

        return {
          verseCode: code,
          reference: this.currentBook!.chapters.length === 1 ? `v${verseNum}` : `${chapterNum}:${verseNum}`,
          fullReference: `${this.currentBook!.name} ${chapterNum}:${verseNum}`,
          text: text,
          firstLetters: this.workspaceParsingService.extractFirstLetters(text),
          isMemorized: isMemorized,
          isFifth: (index + 1) % 5 === 0,
          bookName: this.currentBook!.name,
          chapter: chapterNum,
          verse: verseNum,
          verseNumber: verseNum,
          isSaving: false
        } as WorkspaceVerse;
      });

      // Initialize review data for memorized verses
      this.initializeReviewData();
      
      this.uiStateService.setLoading(false);
      console.log('Verses loaded with memorization data:', this.verses.length);
      
      // Handle scrolling to target verse
      this.handleTargetVerseScroll();
      
    } catch (error) {
      console.error('Error loading chapter:', error);
      this.uiStateService.setLoading(false);
      this.notificationService.error('Failed to load chapter data');
    }
  }

  private initializeReviewData() {
    this.verses.forEach(verse => {
      if (verse.isMemorized) {
        const daysSinceMemorized = Math.floor(Math.random() * 10) + 1;
        this.verseReviewData[verse.verseCode] = {
          lastReviewed: Date.now() - daysSinceMemorized * 24 * 60 * 60 * 1000,
          strength: Math.max(50, 100 - daysSinceMemorized * 5)
        };
      }
    });
  }

  private handleTargetVerseScroll() {
    const targetVerse = this.uiStateService.currentState.targetVerseAfterLoad;
    if (targetVerse !== null) {
      setTimeout(() => {
        this.scrollToVerse(targetVerse);
        const verse = this.verses.find(v => v.verse === targetVerse);
        if (verse) {
          this.selectionService.clearSelection();
          this.selectionService.addToSelection(verse);
          setTimeout(() => this.selectionService.clearSelection(), 2000);
        }
        this.uiStateService.setTargetVerse(null);
      }, 100);
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

  private setupSaveQueue() {
    this.saveQueue$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(verse => {
        this.workspaceMemorizationService.queueVerseSave(verse, this.userId);
      });
  }

  private handleEnterKey() {
    const mode = this.mode; // Use the getter that returns enum
    if (mode === WorkspaceMode.CROSS_REFERENCES && this.selectionService.selectedVerses.size === 1) {
      const selectedCode = Array.from(this.selectionService.selectedVerses)[0];
      const selectedVerse = this.crossReferenceVerses.find(v => v.verseCode === selectedCode);
      if (selectedVerse) {
        this.navigateToVerse(selectedVerse);
      }
    } else if (this.selectionService.selectedVerses.size > 0) {
      this.startStudySession();
    }
  }

  private toggleCrossReferencesMode() {
    const currentMode = this.mode; // Use the getter that returns enum
    const newMode = currentMode === WorkspaceMode.MEMORIZATION ? 'crossReferences' : 'memorization';
    this.uiStateService.setMode(newMode);
    this.onModeChange(newMode);
  }

  private getCurrentVerses(): WorkspaceVerse[] {
    switch (this.uiStateService.currentState.mode) {
      case 'crossReferences':
        return this.crossReferenceVerses;
      case 'topical':
        return this.topicalVerses;
      default:
        return this.verses;
    }
  }

  // Public methods for template

  handleVerseClick(index: number, event: MouseEvent) {
    event.preventDefault();
    const actualIndex = this.getActualIndex(index);
    this.selectionService.handleVerseClick(actualIndex, event, this.verses);
  }

  handleVerseDoubleClick(verse: WorkspaceVerse) {
    this.toggleMemorized(verse);
  }

  handleContextMenu(event: MouseEvent, verse: WorkspaceVerse) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.selectionService.isVerseSelected(verse)) {
      this.selectionService.selectedVerses.add(verse.verseCode);
    }
    
    this.uiStateService.showContextMenu(
      event.clientX,
      event.clientY,
      verse.verseCode,
      this.selectionService.selectedVerses.size
    );
  }

  handleMouseDown(index: number) {
    const actualIndex = this.getActualIndex(index);
    this.selectionService.handleMouseDown(actualIndex);
  }

  handleMouseEnter(index: number) {
    const actualIndex = this.getActualIndex(index);
    this.selectionService.handleMouseMove(actualIndex, this.verses, this.getFilteredVerses());
  }

  handleMouseUp() {
    this.selectionService.handleMouseUp();
  }

  private getActualIndex(filteredIndex: number): number {
    return WorkspaceVerseUtils.getActualIndex(
      filteredIndex,
      this.getFilteredVerses(),
      this.verses
    );
  }

  toggleMemorized(verse: WorkspaceVerse) {
    const wasMemorized = verse.isMemorized;
    verse.isMemorized = !verse.isMemorized;
    verse.isSaving = true;
    this.saveQueue$.next(verse);
    
    const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
    if (this.currentBibleChapter) {
      this.currentBibleChapter.toggleVerse(verseNum);
    }

    if (!wasMemorized && verse.isMemorized) {
      const memorizedCount = this.verses.filter(v => v.isMemorized).length;
      if (memorizedCount > 0 && memorizedCount % 5 === 0) {
        this.uiStateService.showEncouragement(`Great job! ${memorizedCount} verses memorized! 🎉`);
      }
    } else if (wasMemorized && !verse.isMemorized) {
      this.notificationService.info('Verse unmarked as memorized');
    }
  }

  markSelectedAsMemorized() {
    let changedCount = 0;
    const verses = this.getCurrentVerses();
    this.selectionService.selectedVerses.forEach(verseCode => {
      const verse = verses.find(v => v.verseCode === verseCode);
      if (verse && !verse.isMemorized) {
        this.toggleMemorized(verse);
        changedCount++;
      }
    });
    if (changedCount > 0) {
      this.uiStateService.showEncouragement(
        `${changedCount} verse${changedCount > 1 ? 's' : ''} marked as memorized!`
      );
    }
    this.uiStateService.hideContextMenu();
  }

  markSelectedAsUnmemorized() {
    let changedCount = 0;
    const verses = this.getCurrentVerses();
    this.selectionService.selectedVerses.forEach(verseCode => {
      const verse = verses.find(v => v.verseCode === verseCode);
      if (verse && verse.isMemorized) {
        this.toggleMemorized(verse);
        changedCount++;
      }
    });
    if (changedCount > 0) {
      this.notificationService.info(
        `${changedCount} verse${changedCount > 1 ? 's' : ''} unmarked as memorized`
      );
    }
    this.uiStateService.hideContextMenu();
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
    console.log('Changing to book:', bookId);
    this.router.navigate([], {
      queryParams: { bookId, chapter: 1 },
      queryParamsHandling: 'merge'
    });
  }

  // Settings
  toggleSettings(event: MouseEvent) {
    event.stopPropagation();
    this.uiStateService.toggleSettings();
  }

  increaseFontSize() {
    this.uiStateService.increaseFontSize();
  }

  decreaseFontSize() {
    this.uiStateService.decreaseFontSize();
  }

  setLayoutMode(mode: 'grid' | 'single') {
    this.uiStateService.setLayoutMode(mode);
  }

  toggleTextMode() {
    this.uiStateService.toggleTextMode();
  }

  // Filtering
  getFilteredVerses(): WorkspaceVerse[] {
    return WorkspaceVerseUtils.filterVerses(
      this.verses,
      this.uiStateService.currentState.activeFilter,
      this.verseReviewData
    );
  }

  needsReview(verseCode: string): boolean {
    return WorkspaceVerseUtils.needsReview(verseCode, this.verseReviewData);
  }

  getVerseDisplay(verse: WorkspaceVerse): string {
    return WorkspaceVerseUtils.getVerseDisplay(verse, this.showFullText);
  }

  // Study session
  startStudySession() {
    const selectedVerseObjects = this.verses.filter(v =>
      this.selectionService.selectedVerses.has(v.verseCode)
    );
    this.modalVerses = selectedVerseObjects.map(v => ({
      code: v.verseCode,
      text: v.text.replace(/¶\s*/g, ''),
      reference: v.reference,
      bookId: this.currentBook?.id || 0,
      chapter: v.chapter,
      verse: v.verse
    }));
    this.uiStateService.setModalState(true, `${this.currentBook?.name} ${this.currentChapter}`);
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
    this.uiStateService.setModalState(true, `${this.currentBook?.name} ${this.currentChapter}`);
  }

  onModalCompleted(event: { memorized: boolean }) {
    this.uiStateService.setModalState(false);
    if (event.memorized && this.currentBook) {
      this.loadChapter(this.currentBook.id, this.currentChapter);
    }
  }

  // Deck management
  openCreateDeckModal() {
    const versesToAdd = this.contextMenu.selectedCount > 0
      ? Array.from(this.selectionService.selectedVerses)
      : [this.contextMenu.verseId!];
    
    this.deckManagementService.openCreateDeckModal(versesToAdd);
    this.uiStateService.hideContextMenu();
  }

  closeCreateDeckModal() {
    this.deckManagementService.closeCreateDeckModal();
  }

  handleCreateDeck(deckData: DeckCreate) {
    this.deckManagementService.createDeck(deckData, this.verses, this.currentBook, this.userId);
  }

  addToFlashcardDeck(deckName: string) {
    const versesToAdd = this.contextMenu.selectedCount > 0
      ? Array.from(this.selectionService.selectedVerses)
      : [this.contextMenu.verseId!];
    
    this.deckManagementService.addVersesToDeck(deckName, versesToAdd, this.verses, this.currentBook);
    this.uiStateService.hideContextMenu();
  }

  // Mode switching
  onModeChange(newMode: 'memorization' | 'crossReferences' | 'topical') {
    this.uiStateService.setMode(newMode);
    this.selectionService.clearSelection();
    
    if (newMode === 'crossReferences') {
      this.uiStateService.setActiveFilter('all');
      if (!this.selectedCrossRefVerse) {
        const defaultVerse = this.createDefaultCrossRefVerse();
        this.onCrossRefVerseSelected(defaultVerse);
      }
    } else if (newMode === 'topical') {
      this.uiStateService.setActiveFilter('all');
      this.crossReferencesService.clearState();
      this.topicalService.clearState();
      this.topicalService.loadAvailableTopics();
    } else {
      this.crossReferencesService.clearState();
    }
  }

  private createDefaultCrossRefVerse() {
    const bookId = this.currentBook?.id || 1;
    const bookName = this.currentBook?.name || 'Genesis';
    const chapter = this.currentChapter || 1;
    const verseNum = this.verses.length > 0 ? this.verses[0].verse : 1;
    const verseCode = this.verses.length > 0 
      ? this.verses[0].verseCode 
      : `${bookId}-${chapter}-1`;
    
    return {
      bookId,
      bookName,
      chapter,
      verse: verseNum,
      verseCode,
      displayText: `${bookName} ${chapter}:${verseNum}`
    };
  }

  onCrossRefVerseSelected(verse: any) {
    this.crossReferencesService.selectVerse(verse, this.userId, this.userPreferredBible);
  }
  
  onCrossRefVerseChange(verseNumber: number) {
    // Update the selected verse when user changes it in the dropdown
    const verse = {
      bookId: this.currentBook?.id,
      bookName: this.currentBook?.name,
      chapter: this.currentChapter,
      verse: verseNumber,
      verseCode: `${this.currentBook?.id}-${this.currentChapter}-${verseNumber}`,
      displayText: `${this.currentBook?.name} ${this.currentChapter}:${verseNumber}`
    };
    this.onCrossRefVerseSelected(verse);
  }
  
  getVerseNumbersArray(): number[] {
    if (!this.currentBibleChapter) return [];
    return Array.from({ length: this.currentBibleChapter.totalVerses }, (_, i) => i + 1);
  }

  getMemorizedVerseNumbers(): number[] {
    // Return array of verse numbers that are memorized in the current chapter
    return this.verses
      .filter(v => v.isMemorized)
      .map(v => v.verse);
  }

  onTopicSelected(topic: any) {
    this.topicalService.selectTopic(topic, this.userId, this.userPreferredBible);
  }

  // Cross-reference methods
  getFilteredCrossReferences(): WorkspaceVerse[] {
    return this.crossReferencesService.getFilteredVerses(
      this.uiStateService.currentState.activeFilter as 'all' | 'unmemorized'
    );
  }

  getUnmemorizedCrossRefCount(): number {
    return this.crossReferencesService.getUnmemorizedCount();
  }

  handleCrossRefClick(verse: WorkspaceVerse, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      if (this.isVerseSelected(verse)) {
        this.selectionService.removeFromSelection(verse);
      } else {
        this.selectionService.addToSelection(verse);
      }
    } else if (!this.selectionService.isDragging) {
      this.selectionService.clearSelection();
      this.selectionService.addToSelection(verse);
    }
  }

  handleCrossRefMouseDown(index: number) {
    const filteredVerses = this.getFilteredCrossReferences();
    if (index >= 0 && index < filteredVerses.length) {
      const verse = filteredVerses[index];
      const actualIndex = this.crossReferenceVerses.findIndex(v => v.verseCode === verse.verseCode);
      this.selectionService.handleMouseDown(actualIndex);
    }
  }

  handleCrossRefMouseEnter(index: number) {
    const filteredVerses = this.getFilteredCrossReferences();
    if (index >= 0 && index < filteredVerses.length && this.selectionService.isDragging) {
      const verse = filteredVerses[index];
      const actualIndex = this.crossReferenceVerses.findIndex(v => v.verseCode === verse.verseCode);
      this.selectionService.handleMouseMove(actualIndex, this.crossReferenceVerses, filteredVerses);
    }
  }

  navigateToVerse(verse: WorkspaceVerse) {
    const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
    
    this.uiStateService.setTargetVerse(verseNum);
    this.uiStateService.setMode('memorization');
    this.selectionService.clearSelection();
    
    this.loadChapter(bookId, chapter);
    
    const targetBook = this.allBooks.find(b => b.id === bookId);
    if (targetBook && targetBook.id !== this.currentBook?.id) {
      this.currentBook = targetBook;
    }
    
    this.notificationService.info(`Navigating to ${verse.fullReference}`);
  }

  changeToVerse(verseRef: any) {
    this.uiStateService.setTargetVerse(verseRef.verse);
    this.uiStateService.setMode('memorization');
    this.selectionService.clearSelection();
    this.loadChapter(verseRef.bookId, verseRef.chapter);
    
    const targetBook = this.allBooks.find(b => b.id === verseRef.bookId);
    if (targetBook && targetBook.id !== this.currentBook?.id) {
      this.currentBook = targetBook;
    }
  }

  returnFromCrossReferences() {
    this.uiStateService.setMode('memorization');
    this.selectionService.clearSelection();
    this.crossReferencesService.clearState();
    this.notificationService.info('Returned to memorization mode');
  }

  // Topical methods
  getFilteredTopicalVerses(): WorkspaceVerse[] {
    return this.topicalService.getFilteredVerses(
      this.uiStateService.currentState.activeFilter as 'all' | 'unmemorized'
    );
  }

  getUnmemorizedTopicalCount(): number {
    return this.topicalService.getUnmemorizedCount();
  }

  handleTopicalClick(verse: WorkspaceVerse, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      if (this.isVerseSelected(verse)) {
        this.selectionService.removeFromSelection(verse);
      } else {
        this.selectionService.addToSelection(verse);
      }
    } else if (!this.selectionService.isDragging) {
      this.selectionService.clearSelection();
      this.selectionService.addToSelection(verse);
    }
  }

  handleTopicalMouseDown(index: number) {
    const filteredVerses = this.getFilteredTopicalVerses();
    if (index >= 0 && index < filteredVerses.length) {
      const verse = filteredVerses[index];
      const actualIndex = this.topicalVerses.findIndex(v => v.verseCode === verse.verseCode);
      this.selectionService.handleMouseDown(actualIndex);
    }
  }

  handleTopicalMouseEnter(index: number) {
    const filteredVerses = this.getFilteredTopicalVerses();
    if (index >= 0 && index < filteredVerses.length && this.selectionService.isDragging) {
      const verse = filteredVerses[index];
      const actualIndex = this.topicalVerses.findIndex(v => v.verseCode === verse.verseCode);
      this.selectionService.handleMouseMove(actualIndex, this.topicalVerses, filteredVerses);
    }
  }

  jumpToCrossReferencesFromContextMenu() {
    this.uiStateService.hideContextMenu();
    
    let targetVerse: WorkspaceVerse | null = null;
    
    if (this.selectionService.selectedVerses.size === 1) {
      const selectedVerseCode = Array.from(this.selectionService.selectedVerses)[0];
      targetVerse = this.verses.find(v => v.verseCode === selectedVerseCode) ||
                   this.crossReferenceVerses.find(v => v.verseCode === selectedVerseCode) ||
                   this.topicalVerses.find(v => v.verseCode === selectedVerseCode) ||
                   null;
    } else if (this.contextMenu.verseId) {
      targetVerse = this.verses.find(v => v.verseCode === this.contextMenu.verseId) ||
                   this.crossReferenceVerses.find(v => v.verseCode === this.contextMenu.verseId) ||
                   this.topicalVerses.find(v => v.verseCode === this.contextMenu.verseId) ||
                   null;
    }
    
    if (!targetVerse) {
      this.notificationService.error('No verse selected for cross-references');
      return;
    }
    
    this.uiStateService.setMode('crossReferences');
    this.selectionService.clearSelection();
    
    const [bookId, chapter, verseNum] = targetVerse.verseCode.split('-').map(Number);
    
    // Update the current book and chapter if different
    if (bookId !== this.currentBook?.id || chapter !== this.currentChapter) {
      const targetBook = this.allBooks.find(b => b.id === bookId);
      if (targetBook) {
        this.currentBook = targetBook;
        this.currentChapter = chapter;
        // Load the chapter to update available verses
        this.loadChapter(bookId, chapter).then(() => {
          const crossRefSelection = {
            bookId: bookId,
            bookName: targetVerse.bookName || this.currentBook?.name || '',
            chapter: chapter,
            verse: verseNum,
            verseCode: targetVerse.verseCode,
            displayText: `${targetVerse.bookName || this.currentBook?.name} ${chapter}:${verseNum}`
          };
          this.onCrossRefVerseSelected(crossRefSelection);
        });
      }
    } else {
      const crossRefSelection = {
        bookId: bookId,
        bookName: targetVerse.bookName || this.currentBook?.name || '',
        chapter: chapter,
        verse: verseNum,
        verseCode: targetVerse.verseCode,
        displayText: `${targetVerse.bookName || this.currentBook?.name} ${chapter}:${verseNum}`
      };
      this.onCrossRefVerseSelected(crossRefSelection);
    }
    
    this.notificationService.info(`Jumped to cross-references for ${targetVerse.bookName || this.currentBook?.name} ${chapter}:${verseNum}`);
  }

  // Utility methods
  isVerseSelected(verse: WorkspaceVerse): boolean {
    return this.selectionService.isVerseSelected(verse);
  }

  isNewParagraph(verse: WorkspaceVerse): boolean {
    return WorkspaceVerseUtils.isNewParagraph(verse);
  }

  getVerseState(verse: WorkspaceVerse, index: number): string {
    return WorkspaceVerseUtils.getVerseClasses(
      verse,
      this.isVerseSelected(verse),
      this.needsReview(verse.verseCode)
    );
  }

  isMilestoneAchieved(milestone: number): boolean {
    return WorkspaceVerseUtils.isMilestoneAchieved(this.progressPercentage, milestone);
  }

  copyVerseText() {
    this.uiStateService.hideContextMenu();
    
    let versesToCopy: WorkspaceVerse[] = [];
    
    if (this.selectionService.selectedVerses.size > 0) {
      // Copy selected verses
      const selectedCodes = Array.from(this.selectionService.selectedVerses);
      versesToCopy = this.getCurrentVerses()
        .filter(v => selectedCodes.includes(v.verseCode))
        .sort((a, b) => {
          const [aBook, aChap, aVerse] = this.workspaceParsingService.parseVerseCode(a.verseCode);
          const [bBook, bChap, bVerse] = this.workspaceParsingService.parseVerseCode(b.verseCode);
          return aBook - bBook || aChap - bChap || aVerse - bVerse;
        });
    } else if (this.contextMenu.verseId) {
      // Copy single verse from context menu
      const verse = this.getCurrentVerses().find(v => v.verseCode === this.contextMenu.verseId);
      if (verse) {
        versesToCopy = [verse];
      }
    }
    
    if (versesToCopy.length === 0) {
      this.notificationService.warning('No verses selected to copy');
      return;
    }
    
    // Format text with references
    const textToCopy = versesToCopy
      .map(v => {
        const [bookId, chapter, verseNum] = this.workspaceParsingService.parseVerseCode(v.verseCode);
        const reference = `${v.bookName || this.currentBook?.name || ''} ${chapter}:${verseNum}`;
        return `${reference} - ${v.text}`;
      })
      .join('\n\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(textToCopy).then(() => {
      const verseCount = versesToCopy.length;
      this.notificationService.success(
        verseCount === 1 ? 'Verse copied to clipboard' : `${verseCount} verses copied to clipboard`,
        3000
      );
    }).catch(err => {
      console.error('Failed to copy text:', err);
      this.notificationService.error('Failed to copy text to clipboard');
    });
  }

  jumpToFullChapter() {
    this.uiStateService.hideContextMenu();
    
    // Get the first selected verse
    if (this.selectionService.selectedVerses.size === 0) {
      this.notificationService.error('No verse selected');
      return;
    }
    
    const selectedVerseCode = Array.from(this.selectionService.selectedVerses)[0];
    const targetVerse = this.getCurrentVerses().find(v => v.verseCode === selectedVerseCode);
    
    if (!targetVerse) {
      this.notificationService.error('No verse selected');
      return;
    }
    
    const [bookId, chapter, verseNum] = this.workspaceParsingService.parseVerseCode(targetVerse.verseCode);
    
    // Clear selection before navigation
    this.selectionService.clearSelection();
    
    // Set mode back to memorization if not already
    if (this.mode !== 'memorization') {
      this.uiStateService.setMode('memorization');
    }
    
    // Navigate to the chapter within the workspace
    this.router.navigate([], {
      queryParams: { bookId, chapter },
      queryParamsHandling: 'merge'
    }).then(() => {
      this.notificationService.info(`Viewing full chapter: ${targetVerse.bookName || ''} ${chapter}`, 3000);
    });
  }
}