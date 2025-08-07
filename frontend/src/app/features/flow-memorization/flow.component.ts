import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, firstValueFrom, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { trigger, transition, style, animate } from '@angular/animations';

import { BibleService } from '@services/api/bible.service';
import { UserService } from '@services/api/user.service';
import { NotificationService } from '@services/utils/notification.service';
import { FlowStateService } from './services/flow-state.service';
import { FlowMemorizationService } from './services/flow-memorization.service';
import { MemorizationModalComponent } from './memorization-modal/memorization-modal.component';
import { ChapterNavigationComponent } from './components/chapter-navigation/chapter-navigation.component';
import { FiltersBarComponent } from './components/filters-bar/filters-bar.component';
import { FlowContextMenuComponent } from './components/context-menu/context-menu.component';
import { FlowHeaderComponent } from './components/flow-header/flow-header.component';

import { BibleBook, BibleChapter, BibleVerse } from '@models/bible';
import { AppState } from '@state/app.state';
import { BibleMemorizationActions } from '@state/bible-tracker/actions/bible-memorization.actions';
import { selectBibleDataWithProgress } from '@state/bible-tracker/selectors/bible-memorization.selectors';
import { FlowVerse, ModalVerse } from './models/flow.models';
import { ContextMenuData } from './models/context-menu-data.model';

interface VerseSection {
  name: string;
  start: number;
  end: number;
}

interface ChapterProgress {
  memorized: number;
  total: number;
  lastStudied: string | null;
}


@Component({
  selector: 'app-flow-memorization',
  standalone: true,
  imports: [
    CommonModule,
    MemorizationModalComponent,
    ChapterNavigationComponent,
    FiltersBarComponent,
    FlowContextMenuComponent,
    FlowHeaderComponent
  ],
  providers: [FlowStateService, FlowMemorizationService],
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
  @ViewChild('versesContainer') versesContainer!: ElementRef<HTMLDivElement>;

  // Core data
  verses: FlowVerse[] = [];
  selectedVerses = new Set<string>();
  hoveredSection = -1;
  
  // Current book/chapter from Bible models
  currentBook: BibleBook | null = null;
  currentChapter = 1;
  currentBibleChapter: BibleChapter | null = null;
  
  // UI state
  showFullText = false;
  fontSize = 16;
  layoutMode: 'grid' | 'single' = 'grid';
  activeFilter: 'all' | 'unmemorized' | 'needsReview' | 'sections' = 'all';
  showSettings = false;
  isGearSpinning = false;
  showEncouragement = '';
  isLoading = false;
  
  // Chapter navigation
  chapterProgress: Record<number, ChapterProgress> = {};
  availableChapters: number[] = [];
  
  // Selection state
  lastClickedVerse: number | null = null;
  isDragging = false;
  dragStart: number | null = null;
  dragEnd: number | null = null;
  
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
  
  // Flashcard decks
  flashcardDecks = ['Basic Deck', 'Review Deck', 'Difficult Verses'];
  
  // Expose Math to template
  Math = Math;
  
  private destroy$ = new Subject<void>();
  private saveQueue$ = new Subject<FlowVerse>();
  private userId = 1;

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
    if (this.verses.length === 0) return 0;
    return Math.round((this.memorizedVersesCount / this.verses.length) * 100);
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
    private flowStateService: FlowStateService,
    private flowMemorizationService: FlowMemorizationService,
    private flowParsingService: FlowParsingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    console.log('FlowComponent initializing...');
    
    // Get user ID
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
          console.log('User ID set:', this.userId);
        }
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
          // Load default chapter if no params
          console.log('No params, loading default chapter');
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
      this.selectedVerses.clear();
      this.contextMenu.visible = false;
    } else if (event.key === 'Enter' && this.selectedVerses.size > 0) {
      this.startStudySession();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      this.selectAll();
    }
  }

  private async loadChapter(bookId: number, chapterNum: number) {
    try {
      this.isLoading = true;
      this.currentChapter = chapterNum;
      
      // Get book from Bible data
      const bibleData = this.bibleService.getBibleData();
      this.currentBook = bibleData.getBookById(bookId) || null;
      
      if (!this.currentBook) {
        console.error('Book not found:', bookId);
        this.isLoading = false;
        return;
      }
      
      // Get chapter from book
      this.currentBibleChapter = this.currentBook.getChapter(chapterNum);
      this.availableChapters = Array.from({ length: this.currentBook.totalChapters }, (_, i) => i + 1);
      
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
        const isNewParagraph = verseNum === 1 || [6, 11, 16, 21, 26, 31, 36].includes(verseNum);
        const displayText = isNewParagraph && text ? `¶ ${text}` : text;
        
        // Get memorization status from Bible model
        const bibleVerse = this.currentBibleChapter?.verses[verseNum - 1];
        const isMemorized = bibleVerse?.memorized || false;
        
        return {
          verseCode: code,
          reference: this.currentBook!.chapters.length === 1 ? `v${verseNum}` : `${chapterNum}:${verseNum}`,
          text: displayText,
          firstLetters: this.flowParsingService.extractFirstLetters(displayText),
          isMemorized: isMemorized,
          isFifth: (index + 1) % 5 === 0,
          bookName: this.currentBook!.name,
          chapter: chapterNum,
          verse: verseNum,
          isSaving: false
        } as FlowVerse;
      });
      
      // Load memorization progress for all chapters
      await this.loadAllChapterProgress();
      
      // Initialize review data for memorized verses
      this.verses.forEach(verse => {
        if (verse.isMemorized) {
          const daysSinceMemorized = Math.floor(Math.random() * 10) + 1;
          this.verseReviewData[verse.verseCode] = {
            lastReviewed: Date.now() - (daysSinceMemorized * 24 * 60 * 60 * 1000),
            strength: Math.max(50, 100 - (daysSinceMemorized * 5))
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

  private async loadAllChapterProgress() {
    if (!this.currentBook) return;
    
    // Load progress for all chapters in the book
    this.availableChapters.forEach(chapterNum => {
      const chapter = this.currentBook!.getChapter(chapterNum);
      if (chapter) {
        const memorized = chapter.memorizedVerses;
        const total = chapter.totalVerses;
        
        this.chapterProgress[chapterNum] = {
          memorized,
          total,
          lastStudied: memorized > 0 ? this.getLastStudiedText(chapterNum) : null
        };
      }
    });
  }

  private getLastStudiedText(chapterNum: number): string {
    // In a real app, this would come from actual study session data
    if (chapterNum === this.currentChapter) return 'Today';
    if (chapterNum === this.currentChapter - 1) return 'Yesterday';
    return `${Math.floor(Math.random() * 7) + 2} days ago`;
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
    const verse = this.verses[actualIndex];
    
    if (event.shiftKey && this.lastClickedVerse !== null) {
      // Range selection
      const start = Math.min(this.lastClickedVerse, actualIndex);
      const end = Math.max(this.lastClickedVerse, actualIndex);
      
      for (let i = start; i <= end; i++) {
        this.selectedVerses.add(this.verses[i].verseCode);
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      if (this.selectedVerses.has(verse.verseCode)) {
        this.selectedVerses.delete(verse.verseCode);
      } else {
        this.selectedVerses.add(verse.verseCode);
      }
    } else {
      // Single selection
      this.selectedVerses.clear();
      this.selectedVerses.add(verse.verseCode);
    }
    
    this.lastClickedVerse = actualIndex;
  }

  handleVerseDoubleClick(verse: FlowVerse) {
    this.toggleMemorized(verse);
  }

  handleContextMenu(event: MouseEvent, verse: FlowVerse) {
    event.preventDefault();
    event.stopPropagation();
    
    this.contextMenu = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      verseId: verse.verseCode,
      selectedCount: this.selectedVerses.size
    };
  }

  // Drag selection
  handleMouseDown(index: number) {
    const actualIndex = this.getActualIndex(index);
    this.isDragging = true;
    this.dragStart = actualIndex;
    this.dragEnd = actualIndex;
  }

  handleMouseEnter(index: number) {
    const actualIndex = this.getActualIndex(index);
    if (this.isDragging && this.dragStart !== null) {
      this.dragEnd = actualIndex;
      const start = Math.min(this.dragStart, actualIndex);
      const end = Math.max(this.dragStart, actualIndex);
      
      this.selectedVerses.clear();
      for (let i = start; i <= end; i++) {
        this.selectedVerses.add(this.verses[i].verseCode);
      }
    }
  }

  handleMouseUp() {
    this.isDragging = false;
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
    
    // Update chapter progress
    this.loadAllChapterProgress();
    
    // Show appropriate message
    if (!wasMemorized && verse.isMemorized) {
      // Marking as memorized
      const memorizedCount = this.verses.filter(v => v.isMemorized).length;
      if (memorizedCount > 0 && memorizedCount % 5 === 0) {
        this.showEncouragement = `Great job! ${memorizedCount} verses memorized! 🎉`;
        setTimeout(() => this.showEncouragement = '', 3000);
      }
    } else if (wasMemorized && !verse.isMemorized) {
      // Unmarking as memorized
      this.notificationService.info('Verse unmarked as memorized');
    }
  }

  markSelectedAsMemorized() {
    let changedCount = 0;
    this.selectedVerses.forEach(verseCode => {
      const verse = this.verses.find(v => v.verseCode === verseCode);
      if (verse && !verse.isMemorized) {
        this.toggleMemorized(verse);
        changedCount++;
      }
    });
    
    if (changedCount > 0) {
      this.showEncouragement = `${changedCount} verse${changedCount > 1 ? 's' : ''} marked as memorized!`;
      setTimeout(() => this.showEncouragement = '', 3000);
    }
    
    this.contextMenu.visible = false;
  }

  markSelectedAsUnmemorized() {
    let changedCount = 0;
    this.selectedVerses.forEach(verseCode => {
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
    this.verses.forEach(v => this.selectedVerses.add(v.verseCode));
  }

  selectSection(section: VerseSection) {
    for (let i = section.start; i <= section.end && i < this.verses.length; i++) {
      this.selectedVerses.add(this.verses[i].verseCode);
    }
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

  getVisibleChapters(): number[] {
    // Show 5 chapters centered around current chapter
    const start = Math.max(1, this.currentChapter - 2);
    const end = Math.min(this.availableChapters.length, this.currentChapter + 2);
    return this.availableChapters.slice(start - 1, end);
  }

  getAllBooksWithProgress(): any[] {
    // This should come from your BibleService
    // For now, return mock data - replace with real data
    return [
      { id: 1, name: 'Genesis', testament: 'OT', totalChapters: 50, progressPercentage: 70 },
      { id: 2, name: 'Exodus', testament: 'OT', totalChapters: 40, progressPercentage: 23 },
      { id: 3, name: 'Leviticus', testament: 'OT', totalChapters: 27, progressPercentage: 0 },
      { id: 40, name: 'Matthew', testament: 'NT', totalChapters: 28, progressPercentage: 45 },
      { id: 41, name: 'Mark', testament: 'NT', totalChapters: 16, progressPercentage: 80 },
    ];
  }

  changeBook(bookId: number) {
    // Navigate to the new book
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
    setTimeout(() => this.isGearSpinning = false, 600);
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
    if (!verse) {
      return '';
    }
    return this.showFullText ? verse.text : verse.firstLetters;
  }

  // Study session
  startStudySession() {
    const selectedVerseObjects = this.verses.filter(v => 
      this.selectedVerses.has(v.verseCode)
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
      text: v.text.replace(/¶\s*/g, ''), // Remove paragraph markers
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

  // Flashcard operations
  addToFlashcardDeck(deck: string) {
    const versesToAdd = this.contextMenu.selectedCount > 0 
      ? Array.from(this.selectedVerses) 
      : [this.contextMenu.verseId!];
    
    console.log(`Adding ${versesToAdd.length} verses to ${deck}`);
    this.showEncouragement = `Added ${versesToAdd.length} verse(s) to ${deck}!`;
    this.contextMenu.visible = false;
    
    setTimeout(() => this.showEncouragement = '', 3000);
  }

  // Utility methods
  getChapterProgress(chapter: number): number {
    const progress = this.chapterProgress[chapter];
    return progress && progress.total > 0 
      ? Math.round((progress.memorized / progress.total) * 100) 
      : 0;
  }

  getVerseSection(index: number): VerseSection | undefined {
    return this.verseSections.find(s => index >= s.start && index <= s.end);
  }

  isVerseSelected(verse: FlowVerse): boolean {
    return this.selectedVerses.has(verse.verseCode);
  }

  isNewParagraph(verse: FlowVerse): boolean {
    return verse.text.startsWith('¶');
  }

  getVerseState(verse: FlowVerse, index: number): string {
    const classes = ['verse-block'];
    
    if (this.isNewParagraph(verse)) {
      classes.push('new-paragraph');
    }
    
    if (verse.isMemorized) {
      if (this.needsReview(verse.verseCode)) {
        classes.push('memorized-needs-review');
      } else {
        classes.push('memorized');
      }
    } else if (this.isVerseSelected(verse)) {
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
    setTimeout(() => this.showEncouragement = '', 2000);
  }
}