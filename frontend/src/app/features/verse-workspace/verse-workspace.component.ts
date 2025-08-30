import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable, takeUntil, debounceTime, firstValueFrom } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

// Services
import { BibleService } from '@services/api/bible.service';
import { UserService } from '@services/api/user.service';
import { NotificationService } from '@services/utils/notification.service';
import { WorkspaceStateService } from './services/state/workspace-state.service';
import { WorkspaceMemorizationService } from './services/modes/workspace-memorization.service';
import { WorkspaceSelectionService } from './services/state/workspace-selection.service';
import { WorkspaceParsingService } from '@services/utils/workspace-parsing.service';

// New Services
import { WorkspaceDeckManagementService } from './services/core/workspace-deck-management.service';
import { WorkspaceUIStateService } from './services/state/workspace-ui-state.service';
import { WorkspaceCrossReferencesService } from './services/modes/workspace-cross-references.service';
import { WorkspaceTopicalService } from './services/modes/workspace-topical.service';

// Facades
import { WorkspaceVerseFacade } from './services/facades/workspace-verse.facade';
import { WorkspaceNavigationFacade } from './services/facades/workspace-navigation.facade';
import { WorkspaceMemorizationFacade } from './services/facades/workspace-memorization.facade';
import { WorkspaceBibleDataFacade } from './services/facades/workspace-bible-data.facade';
import { WorkspaceOrchestratorFacade } from './services/facades/workspace-orchestrator.facade';
import { WorkspaceContextMenuFacade } from './services/facades/workspace-context-menu.facade';
import { WorkspaceSettingsFacade } from './services/facades/workspace-settings.facade';
import { WorkspaceStudySessionFacade } from './services/facades/workspace-study-session.facade';
import { WorkspaceKeyboardFacade } from './services/facades/workspace-keyboard.facade';
import { WorkspaceCrossReferencesFacade } from './services/facades/workspace-cross-references.facade';
import { WorkspaceTopicalFacade } from './services/facades/workspace-topical.facade';
import { WorkspaceFilteringService } from './services/core/workspace-filtering.service';

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
import { WorkspaceFilterMode } from './models/workspace-filter-mode.enum';
import { LayoutMode } from './models/layout-mode.enum';
import { CrossReferenceVerse, Topic, ContextMenu } from './models/workspace-interfaces';
import { DeckCreate, DeckResponse } from '@services/api/deck.service';

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
    WorkspaceUIStateService,
    WorkspaceOrchestratorFacade,
    WorkspaceContextMenuFacade,
    WorkspaceSettingsFacade,
    WorkspaceStudySessionFacade,
    WorkspaceKeyboardFacade,
    WorkspaceCrossReferencesFacade,
    WorkspaceTopicalFacade,
    WorkspaceFilteringService
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
  
  // Expose enum to template for comparisons
  readonly WorkspaceMode = WorkspaceMode;

  // Main view model from orchestrator
  viewModel$!: Observable<any>;
  filteredVerses$!: Observable<WorkspaceVerse[]>;
  
  // Individual observables for template compatibility
  verses$!: Observable<WorkspaceVerse[]>;
  selectedVerses$!: Observable<Set<string>>;
  hasSelection$!: Observable<boolean>;
  currentBook$!: Observable<BibleBook | null>;
  currentChapter$!: Observable<number>;
  mode$!: Observable<WorkspaceMode>;
  hasNextChapter$!: Observable<boolean>;
  hasPreviousChapter$!: Observable<boolean>;
  allBooks$!: Observable<BibleBook[]>;
  hasApocrypha$!: Observable<boolean>;
  isSaving$!: Observable<boolean>;
  pendingSaveCount$!: Observable<number>;

  // Local state (will be gradually replaced)
  verses: WorkspaceVerse[] = [];
  hasApocrypha = false;
  bibleData: BibleData | null = null;
  currentBook: BibleBook | null = null;
  currentChapter = 1;
  currentBibleChapter: BibleChapter | null = null;
  allBooks: BibleBook[] = [];
  availableChapters: BibleChapter[] = [];

  // Review data
  verseReviewData: Record<string, { lastReviewed: number; strength: number }> = {};

  // Modal (kept for template compatibility)
  get modalVerses(): ModalVerse[] { return this.studySessionFacade.modalVerses; }

  // Expose utilities to template
  Math = Math;
  verseUtils = WorkspaceVerseUtils;

  private destroy$ = new Subject<void>();
  private saveQueue$ = new Subject<WorkspaceVerse>();
  private userId = 1;
  private progressLoaded = false;
  private userPreferredBible: string | undefined;
  private userPreferredLanguage: string | undefined;

  // Computed properties delegated to facades
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

  // Context menu computed properties delegated to facade
  get selectedVerseIsMemorized(): boolean {
    const contextMenu = this.contextMenuFacade.contextMenu;
    if (!contextMenu.verseId) return false;
    const verse = this.verses.find(v => v.verseCode === contextMenu.verseId);
    return verse?.isMemorized || false;
  }

  get shouldShowMarkAsMemorized(): boolean {
    const contextMenu = this.contextMenuFacade.contextMenu;
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
    const contextMenu = this.contextMenuFacade.contextMenu;
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
    // Don't show in chapter mode (already showing chapter)
    if (this.mode === WorkspaceMode.CHAPTER) return false;
    
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

  // Public getters for template - delegated to settings facade
  get showFullText(): boolean { return this.settingsFacade.showFullText; }
  get fontSize(): number { return this.settingsFacade.fontSize; }
  get layoutMode(): LayoutMode { return this.settingsFacade.layoutMode; }
  get activeFilter(): WorkspaceFilterMode { return this.settingsFacade.activeFilter; }
  get showSettings(): boolean { return this.settingsFacade.showSettings; }
  get isGearSpinning(): boolean { return this.settingsFacade.isGearSpinning; }
  get showEncouragement(): string { return this.settingsFacade.showEncouragement; }
  get isLoading(): boolean { return this.settingsFacade.isLoading; }
  get mode(): WorkspaceMode { 
    return this.navigationFacade.getCurrentMode();
  }
  get contextMenu(): ContextMenu { return this.contextMenuFacade.contextMenu; }
  get showModal(): boolean { return this.studySessionFacade.showModal; }
  get modalChapterName(): string { return this.studySessionFacade.modalChapterName; }

  // Cross-references getters
  get crossReferenceVerses(): WorkspaceVerse[] { return this.crossRefFacade.verses; }
  get selectedCrossRefVerse(): CrossReferenceVerse | null { return this.crossRefFacade.selectedVerse; }
  get crossReferenceCount(): number { return this.crossRefFacade.count; }
  get loadingCrossReferences(): boolean { return this.crossRefFacade.isLoading; }

  // Topical getters
  get topicalVerses(): WorkspaceVerse[] { return this.topicalFacade.verses; }
  get selectedTopic(): Topic | null { return this.topicalFacade.selectedTopic; }
  get topicalVerseCount(): number { return this.topicalFacade.count; }
  get loadingTopicalVerses(): boolean { return this.topicalFacade.isLoading; }
  get availableTopics(): Topic[] { return this.topicalFacade.availableTopics; }

  // Deck management getters
  get flashcardDecks(): DeckResponse[] { return this.deckManagementService.decks; }
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
    private deckManagementService: WorkspaceDeckManagementService,
    public uiStateService: WorkspaceUIStateService,
    // Facades
    private verseFacade: WorkspaceVerseFacade,
    private navigationFacade: WorkspaceNavigationFacade,
    private memorizationFacade: WorkspaceMemorizationFacade,
    private bibleDataFacade: WorkspaceBibleDataFacade,
    private orchestrator: WorkspaceOrchestratorFacade,
    private contextMenuFacade: WorkspaceContextMenuFacade,
    private settingsFacade: WorkspaceSettingsFacade,
    private studySessionFacade: WorkspaceStudySessionFacade,
    private keyboardFacade: WorkspaceKeyboardFacade,
    private crossRefFacade: WorkspaceCrossReferencesFacade,
    private topicalFacade: WorkspaceTopicalFacade,
    private filteringService: WorkspaceFilteringService
  ) {
    // Initialize observables from orchestrator and facades
    this.viewModel$ = this.orchestrator.viewModel$;
    this.filteredVerses$ = this.orchestrator.filteredVerses$;
    
    // Initialize individual observables from facades
    this.verses$ = this.verseFacade.verses$;
    this.selectedVerses$ = this.verseFacade.selectedVerses$;
    this.hasSelection$ = this.verseFacade.hasSelection$;
    
    this.currentBook$ = this.navigationFacade.currentBook$;
    this.currentChapter$ = this.navigationFacade.currentChapter$;
    this.mode$ = this.navigationFacade.mode$;
    this.hasNextChapter$ = this.navigationFacade.hasNextChapter$;
    this.hasPreviousChapter$ = this.navigationFacade.hasPreviousChapter$;
    
    this.allBooks$ = this.bibleDataFacade.allBooks$;
    this.hasApocrypha$ = this.bibleDataFacade.hasApocrypha$;
    
    this.isSaving$ = this.memorizationFacade.isSaving$;
    this.pendingSaveCount$ = this.memorizationFacade.pendingSaveCount$;
  }

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
    this.keyboardFacade.handleDocumentClick();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.keyboardFacade.handleKeyDown(event, this.verses, this.currentBook, this.currentChapter);
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
    // Subscribe to both the old service and new facade
    this.workspaceMemorizationService.savedNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.uiStateService.showEncouragement('Progress saved!', 2000);
      });
    
    this.memorizationFacade.savedNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Save completed via facade');
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
    // Now handled by BibleDataFacade
    const bibleData = this.bibleDataFacade.getBibleData();
    if (bibleData) {
      this.bibleData = bibleData;
      this.allBooks = bibleData.books;
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
      
      // Use orchestrator to load chapter
      await this.orchestrator.loadChapter(bookId, chapterNum, this.userId, this.userPreferredBible);
      
      // Update local state for backward compatibility
      this.currentBook = this.bibleDataFacade.getBookById(bookId);
      this.currentChapter = chapterNum;
      if (this.currentBook) {
        this.currentBibleChapter = this.currentBook.getChapter(chapterNum);
        this.availableChapters = this.currentBook.chapters;
        this.verses = this.orchestrator.getCurrentVerses();
      }
      
      // Handle scrolling to target verse
      this.handleTargetVerseScroll();
      
    } catch (error) {
      console.error('Error loading chapter:', error);
      this.notificationService.error('Failed to load chapter data');
    }
  }

  private initializeReviewData() {
    // Now handled by memorizationFacade.initializeReviewData()
    this.verseReviewData = this.memorizationFacade.getReviewData();
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
    // Save queue is now handled by memorizationFacade
    this.saveQueue$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(verse => {
        this.memorizationFacade.queueVerseSave(verse);
        this.workspaceMemorizationService.queueVerseSave(verse, this.userId);
      });
  }

  // Keyboard methods are now handled by keyboardFacade

  private getCurrentVerses(): WorkspaceVerse[] {
    const mode = this.uiStateService.currentState.mode;
    return mode === WorkspaceMode.CROSS_REFERENCES ? this.crossReferenceVerses :
           mode === WorkspaceMode.TOPICAL ? this.topicalVerses : this.verses;
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
    this.contextMenuFacade.showContextMenu(event, verse);
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
    return this.filteringService.getActualIndex(
      filteredIndex,
      this.getFilteredVerses(),
      this.verses
    );
  }

  toggleMemorized(verse: WorkspaceVerse) {
    const wasMemorized = verse.isMemorized;
    // Use orchestrator to handle toggle
    this.orchestrator.toggleVerseMemorized(verse);
    
    // Update local state and queue for backward compatibility
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
    // Use orchestrator to mark selected verses
    this.orchestrator.markSelectedAsMemorized(true);
    
    const selectedCount = this.verseFacade.getSelectedVerses().size;
    if (selectedCount > 0) {
      this.uiStateService.showEncouragement(
        `${selectedCount} verse${selectedCount > 1 ? 's' : ''} marked as memorized!`
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
    this.orchestrator.selectAll();
    // Keep backward compatibility
    this.selectionService.selectAll(this.verses);
  }

  // Navigation
  changeChapter(chapter: number) {
    const currentState = this.navigationFacade.getCurrentState();
    if (chapter !== currentState.currentChapter && currentState.currentBook) {
      this.orchestrator.navigateToChapter(currentState.currentBook.id, chapter);
    }
  }

  goToPreviousChapter() {
    this.orchestrator.goToPreviousChapter();
  }

  goToNextChapter() {
    this.orchestrator.goToNextChapter();
  }

  hasNextChapter(): boolean {
    return this.navigationFacade.hasNextChapter();
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
    this.settingsFacade.toggleSettings(event);
  }

  increaseFontSize() {
    this.settingsFacade.increaseFontSize();
  }

  decreaseFontSize() {
    this.settingsFacade.decreaseFontSize();
  }

  setLayoutMode(mode: LayoutMode) {
    this.settingsFacade.setLayoutMode(mode);
  }

  toggleTextMode() {
    this.settingsFacade.toggleTextMode();
  }

  // Filtering
  getFilteredVerses(): WorkspaceVerse[] {
    return this.filteringService.filterVerses(
      this.verses,
      this.uiStateService.currentState.activeFilter,
      this.verseReviewData
    );
  }

  needsReview(verseCode: string): boolean {
    return this.memorizationFacade.needsReview(verseCode);
  }
  
  isVerseSelected(verse: WorkspaceVerse): boolean {
    return this.selectionService.isVerseSelected(verse);
  }

  getVerseDisplay(verse: WorkspaceVerse): string {
    return WorkspaceVerseUtils.getVerseDisplay(verse, this.showFullText);
  }

  // Study session
  startStudySession() {
    this.studySessionFacade.startStudySession(this.verses, this.currentBook, this.currentChapter);
  }

  startFullChapter() {
    this.studySessionFacade.startFullChapterSession(this.verses, this.currentBook, this.currentChapter);
  }

  onModalCompleted(event: { memorized: boolean }) {
    const result = this.studySessionFacade.onModalCompleted(event);
    if (result.shouldReload && result.bookId && result.chapter) {
      this.loadChapter(result.bookId, result.chapter);
    }
  }

  // Deck management
  openCreateDeckModal() {
    this.contextMenuFacade.openCreateDeckModal();
  }

  closeCreateDeckModal() {
    this.contextMenuFacade.closeCreateDeckModal();
  }

  handleCreateDeck(deckData: DeckCreate) {
    this.contextMenuFacade.handleCreateDeck(deckData, this.verses, this.currentBook, this.userId);
  }

  addToFlashcardDeck(deckName: string) {
    this.contextMenuFacade.addToFlashcardDeck(deckName, this.verses, this.currentBook);
  }

  // Mode switching
  onModeChange(newMode: WorkspaceMode) {
    this.orchestrator.setMode(newMode);
    this.selectionService.clearSelection();
    
    if (newMode === WorkspaceMode.CROSS_REFERENCES) {
      this.uiStateService.setActiveFilter(WorkspaceFilterMode.ALL);
      if (!this.selectedCrossRefVerse) {
        const defaultVerse = this.crossRefFacade.createDefaultCrossRefVerse(this.currentBook, this.currentChapter, this.verses);
        this.onCrossRefVerseSelected(defaultVerse);
      }
    } else if (newMode === WorkspaceMode.TOPICAL) {
      this.uiStateService.setActiveFilter(WorkspaceFilterMode.ALL);
      this.crossRefFacade.clearState();
      this.topicalFacade.clearState();
      this.topicalFacade.loadAvailableTopics();
    } else {
      this.crossRefFacade.clearState();
    }
  }


  onCrossRefVerseSelected(verse: CrossReferenceVerse) {
    this.crossRefFacade.selectVerse(verse, this.userId, this.userPreferredBible);
  }
  
  onCrossRefVerseChange(verseNumber: number) {
    // Update the selected verse when user changes it in the dropdown
    if (!this.currentBook?.id || !this.currentBook?.name) {
      return;
    }
    const verse: CrossReferenceVerse = {
      bookId: this.currentBook.id,
      bookName: this.currentBook.name,
      chapter: this.currentChapter,
      verse: verseNumber,
      verseCode: `${this.currentBook.id}-${this.currentChapter}-${verseNumber}`,
      displayText: `${this.currentBook.name} ${this.currentChapter}:${verseNumber}`
    };
    this.onCrossRefVerseSelected(verse);
  }
  
  getVerseNumbersArray(): number[] {
    return this.currentBibleChapter ? Array.from({ length: this.currentBibleChapter.totalVerses }, (_, i) => i + 1) : [];
  }

  getMemorizedVerseNumbers(): number[] {
    return this.verses.filter(v => v.isMemorized).map(v => v.verse);
  }

  onTopicSelected(topic: Topic) {
    this.topicalFacade.selectTopic(topic, this.userId, this.userPreferredBible);
  }

  // Cross-reference methods
  getFilteredCrossReferences(): WorkspaceVerse[] {
    return this.crossRefFacade.getFilteredVerses(
      this.uiStateService.currentState.activeFilter
    );
  }

  getUnmemorizedCrossRefCount(): number {
    return this.crossRefFacade.getUnmemorizedCount();
  }

  handleCrossRefClick(verse: WorkspaceVerse, event: MouseEvent) {
    this.crossRefFacade.handleClick(verse, event);
  }

  handleCrossRefMouseDown(index: number) {
    this.crossRefFacade.handleMouseDown(index);
  }

  handleCrossRefMouseEnter(index: number) {
    this.crossRefFacade.handleMouseEnter(index);
  }

  navigateToVerse(verse: WorkspaceVerse) {
    const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
    
    this.uiStateService.setTargetVerse(verseNum);
    this.uiStateService.setMode(WorkspaceMode.CHAPTER);
    this.selectionService.clearSelection();
    
    this.loadChapter(bookId, chapter);
    
    const targetBook = this.allBooks.find(b => b.id === bookId);
    if (targetBook && targetBook.id !== this.currentBook?.id) {
      this.currentBook = targetBook;
    }
    
    this.notificationService.info(`Navigating to ${verse.fullReference}`);
  }


  returnFromCrossReferences() {
    this.crossRefFacade.returnToChapterMode();
  }

  // Topical methods
  getFilteredTopicalVerses(): WorkspaceVerse[] {
    return this.topicalFacade.getFilteredVerses(
      this.uiStateService.currentState.activeFilter
    );
  }

  getUnmemorizedTopicalCount(): number {
    return this.topicalFacade.getUnmemorizedCount();
  }

  handleTopicalClick(verse: WorkspaceVerse, event: MouseEvent) {
    this.topicalFacade.handleClick(verse, event);
  }

  handleTopicalMouseDown(index: number) {
    this.topicalFacade.handleMouseDown(index);
  }

  handleTopicalMouseEnter(index: number) {
    this.topicalFacade.handleMouseEnter(index);
  }

  jumpToCrossReferencesFromContextMenu() {
    this.contextMenuFacade.hideContextMenu();
    const targetVerse = this.findSelectedVerseForCrossRef();
    
    if (!targetVerse) {
      this.notificationService.error('No verse selected for cross-references');
      return;
    }
    
    const [bookId, chapter, verseNum] = targetVerse.verseCode.split('-').map(Number);
    this.uiStateService.setMode(WorkspaceMode.CROSS_REFERENCES);
    this.selectionService.clearSelection();
    
    if (bookId !== this.currentBook?.id || chapter !== this.currentChapter) {
      this.loadChapter(bookId, chapter).then(() => {
        const crossRefSelection = this.createCrossRefSelection(targetVerse, bookId, chapter, verseNum);
        this.onCrossRefVerseSelected(crossRefSelection);
      });
    } else {
      const crossRefSelection = this.createCrossRefSelection(targetVerse, bookId, chapter, verseNum);
      this.onCrossRefVerseSelected(crossRefSelection);
    }
  }

  private findSelectedVerseForCrossRef(): WorkspaceVerse | null {
    if (this.selectionService.selectedVerses.size === 1) {
      const code = Array.from(this.selectionService.selectedVerses)[0];
      return this.getCurrentVerses().find(v => v.verseCode === code) || null;
    } else if (this.contextMenu.verseId) {
      return this.getCurrentVerses().find(v => v.verseCode === this.contextMenu.verseId) || null;
    }
    return null;
  }

  private createCrossRefSelection(verse: WorkspaceVerse, bookId: number, chapter: number, verseNum: number): CrossReferenceVerse {
    return {
      bookId,
      bookName: verse.bookName || this.currentBook?.name || '',
      chapter,
      verse: verseNum,
      verseCode: verse.verseCode,
      displayText: `${verse.bookName || this.currentBook?.name} ${chapter}:${verseNum}`
    };
  }

  // Utility methods

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
    this.contextMenuFacade.copyVerseText(this.getCurrentVerses(), this.currentBook?.name);
  }

  jumpToFullChapter() {
    this.contextMenuFacade.hideContextMenu();
    const targetVerse = Array.from(this.selectionService.selectedVerses)[0];
    
    if (!targetVerse) {
      this.notificationService.error('No verse selected');
      return;
    }
    
    const verse = this.getCurrentVerses().find(v => v.verseCode === targetVerse);
    if (!verse) {
      this.notificationService.error('No verse selected');
      return;
    }
    
    const [bookId, chapter] = this.workspaceParsingService.parseVerseCode(verse.verseCode);
    this.selectionService.clearSelection();
    
    if (this.mode !== WorkspaceMode.CHAPTER) {
      this.uiStateService.setMode(WorkspaceMode.CHAPTER);
    }
    
    this.router.navigate([], {
      queryParams: { bookId, chapter },
      queryParamsHandling: 'merge'
    }).then(() => {
      this.notificationService.info(`Viewing full chapter: ${verse.bookName || ''} ${chapter}`, 3000);
    });
  }
}