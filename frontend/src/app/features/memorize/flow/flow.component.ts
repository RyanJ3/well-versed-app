import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { VerseSelection } from '../../../shared/components/verse-range-picker/verse-range-picker.component';
import { BibleService } from '../../../core/services/api/bible.service';
import { UserService } from '../../../core/services/api/user.service';
import { FlowParsingService } from '../../../core/services/utils/flow-parsing.service';
import { MemorizationModalComponent } from '../../../shared/components/memorization-modal/memorization-modal.component';
import { User } from '../../../core/models/user';
import { UserVerseDetail } from '../../../core/models/bible';

// New imports
import { FlowHeaderComponent } from './components/flow-header/flow-header.component';
import { FlowSidebarComponent } from './components/flow-sidebar/flow-sidebar.component';
import { FlowGridViewComponent } from './components/flow-grid-view/flow-grid-view.component';
import { FlowTextViewComponent } from './components/flow-text-view/flow-text-view.component';
import { FlowStateService } from './services/flow-state.service';
import { FlowMemorizationService } from './services/flow-memorization.service';
import { FlowVerse, ModalVerse, FlowViewSettings } from './models/flow.models';

@Component({
  selector: 'app-flow',
  standalone: true,
  imports: [
    CommonModule,
    MemorizationModalComponent,
    FlowHeaderComponent,
    FlowSidebarComponent,
    FlowGridViewComponent,
    FlowTextViewComponent
  ],
  providers: [FlowStateService, FlowMemorizationService],
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss'],
})
export class FlowComponent implements OnInit, OnDestroy {
  // Data
  verses: FlowVerse[] = [];
  currentSelection: VerseSelection | null = null;
  initialSelection: VerseSelection | null = null;
  selectedBook: any = null;
  warningMessage: string | null = null;
  
  // View settings from service
  viewSettings: FlowViewSettings = {
    layoutMode: 'grid',
    isTextMode: false,
    highlightFifthVerse: true,
    showVerseNumbers: true,
    fontSize: 16
  };

  // Progress tracking
  memorizedCount = 0;

  // Loading states
  isLoading = false;
  isSaving = false;
  showSavedMessage = false;

  // User
  userId = 1;

  // Memorization modal
  showMemorization = false;
  versesForModal: ModalVerse[] = [];
  modalBookId = 0;
  modalChapterName = '';

  // API rate limit handling
  retryCountdown: number | null = null;
  private retryTimer: any;
  private originalShowVerseNumbers = true;

  // Observables
  private destroy$ = new Subject<void>();
  private loadVersesCancel$ = new Subject<void>();
  private requestCounter = 0;

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private stateService: FlowStateService,
    private memorizationService: FlowMemorizationService,
    private flowParsingService: FlowParsingService
  ) {}

  ngOnInit() {
    // Load saved state
    const savedState = this.stateService.getState();
    this.viewSettings = this.stateService.getViewSettings();
    this.originalShowVerseNumbers = this.viewSettings.showVerseNumbers;

    // Subscribe to view settings changes
    this.stateService.viewSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.viewSettings = settings;
        this.cdr.detectChanges();
      });

    // Subscribe to save notifications
    this.memorizationService.savedNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showSaveNotification();
        this.updateProgress();
      });

    // Get current user
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        if (user) {
          this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
        }
      });

    // Check for query params (deep linking)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const bookId = parseInt(params['bookId']);
        const chapter = parseInt(params['chapter']);

        if (!isNaN(bookId) && !isNaN(chapter)) {
          this.loadFromQueryParams(bookId, chapter);
        } else if (savedState.bookId && savedState.chapter) {
          this.navigateToChapter(savedState.bookId, savedState.chapter);
        }
      });

    // Listen for ESV API rate limit events
    this.bibleService.esvRetry$
      .pipe(takeUntil(this.destroy$))
      .subscribe((wait) => {
        this.startRetryTimer(wait);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadVersesCancel$.complete();
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }
  }

  private loadFromQueryParams(bookId: number, chapter: number) {
    const book = this.bibleService.getBibleData().getBookById(bookId);
    if (!book) return;

    const chapterData = book.chapters[chapter - 1];
    if (!chapterData) return;

    const verseCodes = chapterData.verses.map(
      (v) => `${book.id}-${chapter}-${v.verseNumber}`,
    );

    this.initialSelection = {
      mode: 'chapter',
      startVerse: {
        book: book.name,
        bookId: book.id,
        chapter,
        verse: 1,
      },
      verseCodes,
      verseCount: verseCodes.length,
      reference: `${book.name} ${chapter}`,
    };

    this.onVerseSelectionChanged(this.initialSelection);
  }

  onVerseSelectionChanged(selection: VerseSelection) {
    this.currentSelection = selection;
    
    if (selection.startVerse) {
      this.selectedBook = this.bibleService
        .getBibleData()
        .getBookById(selection.startVerse.bookId);
      
      this.stateService.updateState({
        bookId: selection.startVerse.bookId,
        chapter: selection.startVerse.chapter
      });
    }

    // Validation
    if (selection.mode !== 'chapter' && selection.verseCount < 10) {
      this.warningMessage = 'Please select at least 10 verses or an entire chapter.';
      this.verses = [];
      return;
    }

    this.warningMessage = null;
    this.loadVersesCancel$.next();
    if (this.retryCountdown !== null) return;

    this.loadVerses();
  }

  async loadVerses() {
    if (!this.currentSelection || this.retryCountdown !== null) return;

    const cached = this.bibleService.getCachedVerseTexts(this.currentSelection.verseCodes);
    if (cached) {
      this.applyVerseTexts(cached);
      return;
    }

    this.isLoading = true;
    this.verses = [];
    const currentRequestId = ++this.requestCounter;

    try {
      const verseTexts = await this.bibleService
        .getVerseTexts(this.userId, this.currentSelection.verseCodes)
        .pipe(takeUntil(this.loadVersesCancel$))
        .toPromise();

      if (currentRequestId !== this.requestCounter) return;
      this.applyVerseTexts(verseTexts || {});
    } catch (error: any) {
      if (error?.name === 'EmptyError') return;
      console.error('Error loading verses:', error);
      this.verses = [];
      alert('Failed to load verses. Please check your connection and try again.');
    } finally {
      if (currentRequestId === this.requestCounter) {
        this.isLoading = false;
      }
    }
  }

  private applyVerseTexts(verseTexts: Record<string, string>) {
    const hasContent = verseTexts && Object.values(verseTexts).some((t) => t.trim() !== '');
    
    if (!hasContent) {
      this.stateService.updateViewSettings({ showVerseNumbers: false });
    } else if (this.viewSettings.showVerseNumbers !== this.originalShowVerseNumbers) {
      this.stateService.updateViewSettings({ showVerseNumbers: this.originalShowVerseNumbers });
    }

    this.verses = this.currentSelection!.verseCodes.map((verseCode, index) => {
      const [bookId, chapter, verse] = verseCode.split('-').map(Number);
      const verseText = verseTexts?.[verseCode] || '';

      return {
        verseCode,
        reference: this.formatVerseReference(bookId, chapter, verse),
        text: verseText,
        firstLetters: this.flowParsingService.extractFirstLetters(verseText),
        isMemorized: false,
        isFifth: (index + 1) % 5 === 0,
        bookName: this.getBookName(bookId),
        chapter,
        verse,
        isSaving: false,
      } as FlowVerse;
    });

    this.updateMemorizationStatus();
    this.updateProgress();
  }

  private updateMemorizationStatus() {
    this.bibleService
      .getUserVerses(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((userVerses: UserVerseDetail[]) => {
        const memorizedSet = new Set(
          userVerses.map(
            (v) => `${v.verse.book_id}-${v.verse.chapter_number}-${v.verse.verse_number}`,
          ),
        );

        this.verses.forEach((verse) => {
          verse.isMemorized = memorizedSet.has(verse.verseCode);
        });

        this.updateProgress();
      });
  }

  private updateProgress() {
    this.memorizedCount = this.verses.filter((v) => v.isMemorized).length;
  }

  onViewSettingsChanged(settings: Partial<FlowViewSettings>) {
    this.stateService.updateViewSettings(settings);
  }

  onToggleVerse(verse: FlowVerse) {
    if (verse.isSaving) return;

    verse.isMemorized = !verse.isMemorized;
    verse.isSaving = true;

    const verseElement = document.querySelector(`[data-verse="${verse.verseCode}"]`);
    if (verseElement) {
      verseElement.classList.add('fade-in');
      setTimeout(() => verseElement.classList.remove('fade-in'), 300);
    }

    this.updateProgress();
    this.memorizationService.queueVerseSave(verse, this.userId);
    this.cdr.detectChanges();
  }

  private showSaveNotification() {
    this.showSavedMessage = true;
    setTimeout(() => {
      this.showSavedMessage = false;
      this.cdr.detectChanges();
    }, 2000);
  }

  getPassageTitle(): string {
    if (!this.currentSelection || !this.selectedBook) {
      return this.currentSelection?.reference || '';
    }

    if (this.selectedBook.chapters.length === 1) {
      return this.selectedBook.name;
    }

    return this.currentSelection.reference;
  }

  hasPreviousChapter(): boolean {
    if (!this.selectedBook || !this.currentSelection) return false;
    const currentChapter = this.currentSelection.startVerse?.chapter || 1;
    return currentChapter > 1 || this.selectedBook.id > 1;
  }

  hasNextChapter(): boolean {
    if (!this.selectedBook || !this.currentSelection) return false;
    const currentChapter = this.currentSelection.startVerse?.chapter || 1;
    return currentChapter < this.selectedBook.chapters.length || this.selectedBook.id < 66;
  }

  getPreviousChapterLabel(): string {
    if (!this.selectedBook || !this.currentSelection) return '';

    const currentChapter = this.currentSelection.startVerse?.chapter || 1;

    if (currentChapter > 1) {
      return `${this.selectedBook.name} ${currentChapter - 1}`;
    } else {
      const prevBookId = this.selectedBook.id - 1;
      if (prevBookId >= 1) {
        const prevBook = this.bibleService.getBibleData().getBookById(prevBookId);
        if (prevBook) {
          const lastChapter = prevBook.chapters.length;
          return lastChapter === 1 ? prevBook.name : `${prevBook.name} ${lastChapter}`;
        }
      }
    }
    return '';
  }

  getNextChapterLabel(): string {
    if (!this.selectedBook || !this.currentSelection) return '';

    const currentChapter = this.currentSelection.startVerse?.chapter || 1;

    if (currentChapter < this.selectedBook.chapters.length) {
      return `${this.selectedBook.name} ${currentChapter + 1}`;
    } else {
      const nextBookId = this.selectedBook.id + 1;
      if (nextBookId <= 66) {
        const nextBook = this.bibleService.getBibleData().getBookById(nextBookId);
        if (nextBook) {
          return nextBook.chapters.length === 1 ? nextBook.name : `${nextBook.name} 1`;
        }
      }
    }
    return '';
  }

  navigateToPreviousChapter() {
    if (!this.selectedBook || !this.currentSelection) return;

    const currentChapter = this.currentSelection.startVerse?.chapter || 1;
    let targetBookId = this.selectedBook.id;
    let targetChapter = currentChapter - 1;

    if (targetChapter < 1) {
      targetBookId--;
      if (targetBookId >= 1) {
        const prevBook = this.bibleService.getBibleData().getBookById(targetBookId);
        if (prevBook) {
          targetChapter = prevBook.chapters.length;
        }
      }
    }

    this.navigateToChapter(targetBookId, targetChapter);
  }

  navigateToNextChapter() {
    if (!this.selectedBook || !this.currentSelection) return;

    const currentChapter = this.currentSelection.startVerse?.chapter || 1;
    let targetBookId = this.selectedBook.id;
    let targetChapter = currentChapter + 1;

    if (targetChapter > this.selectedBook.chapters.length) {
      targetBookId++;
      targetChapter = 1;
    }

    this.navigateToChapter(targetBookId, targetChapter);
  }

  private navigateToChapter(bookId: number, chapter: number) {
    const book = this.bibleService.getBibleData().getBookById(bookId);
    if (!book) return;

    const chapterData = book.chapters[chapter - 1];
    if (!chapterData) return;

    const verseCodes = chapterData.verses.map(
      (v) => `${book.id}-${chapter}-${v.verseNumber}`,
    );

    const selection: VerseSelection = {
      mode: 'chapter',
      startVerse: {
        book: book.name,
        bookId: book.id,
        chapter,
        verse: 1,
      },
      verseCodes,
      verseCount: verseCodes.length,
      reference: `${book.name} ${chapter}`,
    };

    this.initialSelection = selection;
    this.onVerseSelectionChanged(selection);
  }

  startMemorization() {
    if (!this.verses.length || !this.selectedBook) return;

    this.versesForModal = this.verses.map((v) => {
      const [bookId, chapter, verse] = v.verseCode.split('-').map(Number);
      return {
        code: v.verseCode,
        text: v.text,
        reference: v.reference,
        bookId,
        chapter,
        verse,
      };
    });

    this.modalBookId = this.selectedBook.id;
    this.modalChapterName = this.getPassageTitle();
    this.showMemorization = true;
  }

  onMemorizationCompleted(result: { memorized: boolean }) {
    this.showMemorization = false;
    if (result.memorized) {
      this.updateMemorizationStatus();
    }
  }

  async markAllMemorized() {
    if (!this.verses.length || !this.selectedBook) return;
    this.isSaving = true;

    try {
      await this.memorizationService.markAllMemorized(
        this.verses, 
        this.selectedBook.id, 
        this.userId
      );
      this.updateProgress();
    } catch (error) {
      console.error('Error marking all as memorized:', error);
      alert('Failed to mark all verses as memorized');
    } finally {
      this.isSaving = false;
    }
  }

  async deselectAllVerses() {
    if (!this.verses.length || !this.selectedBook) return;
    this.isSaving = true;

    try {
      await this.memorizationService.deselectAllVerses(
        this.verses, 
        this.selectedBook.id, 
        this.userId
      );
      this.updateProgress();
    } catch (error) {
      console.error('Error deselecting verses:', error);
      alert('Failed to deselect all verses');
    } finally {
      this.isSaving = false;
    }
  }

  private formatVerseReference(bookId: number, chapter: number, verse: number): string {
    const book = this.bibleService.getBibleData().getBookById(bookId);
    const bookName = book ? book.name : `Book ${bookId}`;
    if (book && book.chapters.length === 1) {
      return `${bookName} ${verse}`;
    }
    return `${bookName} ${chapter}:${verse}`;
  }

  private getBookName(bookId: number): string {
    const book = this.bibleService.getBibleData().getBookById(bookId);
    return book ? book.name : `Book ${bookId}`;
  }

  private startRetryTimer(wait: number) {
    this.retryCountdown = wait;
    this.originalShowVerseNumbers = this.viewSettings.showVerseNumbers;
    this.stateService.updateViewSettings({ showVerseNumbers: false });
    this.cdr.detectChanges();

    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }

    this.retryTimer = setInterval(() => {
      if (this.retryCountdown !== null) {
        this.retryCountdown--;
        if (this.retryCountdown <= 0) {
          clearInterval(this.retryTimer);
          this.retryCountdown = null;
          this.loadVerses();
        }
        this.cdr.detectChanges();
      }
    }, 1000);
  }
}