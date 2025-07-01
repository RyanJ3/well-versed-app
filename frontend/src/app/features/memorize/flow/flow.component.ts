import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import {
  VersePickerComponent,
  VerseSelection,
} from '../../../shared/components/verse-range-picker/verse-range-picker.component';
import { BibleService } from '../../../core/services/bible.service';
import { UserService } from '../../../core/services/user.service';
import { MemorizationModalComponent } from '../../../shared/components/memorization-modal/memorization-modal.component';
import { User } from '../../../core/models/user';
import { UserVerseDetail } from '../../../core/models/bible';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface FlowVerse {
  verseCode: string;
  reference: string;
  text: string;
  firstLetters: string;
  isMemorized: boolean;
  isFifth: boolean;
  bookName: string;
  chapter: number;
  verse: number;
  isSaving?: boolean;
}

interface ModalVerse {
  code: string;
  text: string;
  reference: string;
  bookId: number;
  chapter: number;
  verse: number;
}

@Component({
  selector: 'app-flow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    VersePickerComponent,
    MemorizationModalComponent,
  ],
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss'],
})
export class FlowComponent implements OnInit, OnDestroy {
  // View state
  layoutMode: 'grid' | 'single' = 'grid';
  isTextMode = false;
  highlightFifthVerse = true;
  showSavedMessage = false;
  warningMessage: string | null = null;
  fontSize = 16;

  // Data
  verses: FlowVerse[] = [];
  gridRows: FlowVerse[][] = [];
  currentSelection: VerseSelection | null = null;
  initialSelection: VerseSelection | null = null;
  selectedBook: any = null;
  
  // Progress tracking
  memorizedCount = 0;
  progressPercent = 0;
  
  // Loading states
  isLoading = false;
  isSaving = false;
  
  // User
  userId = 1;

  // Memorization modal
  showMemorization = false;
  versesForModal: ModalVerse[] = [];
  modalBookId = 0;
  modalChapterName = '';

  // Observables
  private destroy$ = new Subject<void>();
  private loadVersesCancel$ = new Subject<void>();
  private requestCounter = 0;
  private saveQueue$ = new Subject<FlowVerse>();

  // sidebar menu state
  openMenu: 'layout' | 'toggle' | null = null;

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}


  ngOnInit() {
    // Get current user
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        if (user) {
          this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
        }
      });

    // Setup save queue with debouncing
    this.saveQueue$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(verse => {
        this.saveVerseToBackend(verse);
      });

    // Check for query params (deep linking)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const bookId = parseInt(params['bookId']);
        const chapter = parseInt(params['chapter']);
        
        if (!isNaN(bookId) && !isNaN(chapter)) {
          this.loadFromQueryParams(bookId, chapter);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadVersesCancel$.complete();
  }

  private loadFromQueryParams(bookId: number, chapter: number) {
    const book = this.bibleService.getBibleData().getBookById(bookId);
    if (!book) return;

    const chapterData = book.chapters[chapter - 1];
    if (!chapterData) return;

    const verseCodes = chapterData.verses.map(
      v => `${book.id}-${chapter}-${v.verseNumber}`
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

    // Store selected book
    if (selection.startVerse) {
      this.selectedBook = this.bibleService
        .getBibleData()
        .getBookById(selection.startVerse.bookId);
    }

    // Updated validation logic: only warn if it's NOT a full chapter AND less than 10 verses
    if (selection.mode !== 'chapter' && selection.verseCount < 10) {
      this.warningMessage = 'Please select at least 10 verses or an entire chapter.';
      this.verses = [];
      return;
    }

    // Clear warning for valid selections
    this.warningMessage = null;
    this.loadVersesCancel$.next();
    this.loadVerses();
  }

  async loadVerses() {
    if (!this.currentSelection) return;

    this.isLoading = true;
    this.verses = [];
    const currentRequestId = ++this.requestCounter;

    try {
      const verseTexts = await this.bibleService
        .getVerseTexts(this.userId, this.currentSelection.verseCodes)
        .pipe(takeUntil(this.loadVersesCancel$))
        .toPromise();

      // Check if this is still the current request
      if (currentRequestId !== this.requestCounter) return;

      // Process verses
      this.verses = this.currentSelection.verseCodes.map((verseCode, index) => {
        const [bookId, chapter, verse] = verseCode.split('-').map(Number);
        const verseText = verseTexts?.[verseCode] || '';

        return {
          verseCode,
          reference: this.formatVerseReference(bookId, chapter, verse),
          text: verseText,
          firstLetters: this.extractFirstLetters(verseText),
          isMemorized: false,
          isFifth: (index + 1) % 5 === 0,
          bookName: this.getBookName(bookId),
          chapter,
          verse,
          isSaving: false,
        };
      });

      this.updateMemorizationStatus();
      this.prepareGridRows();
      this.updateProgress();
    } catch (error: any) {
      if (error?.name === 'EmptyError') return; // Cancelled
      
      console.error('Error loading verses:', error);
      this.verses = [];
      alert('Failed to load verses. Please check your connection and try again.');
    } finally {
      if (currentRequestId === this.requestCounter) {
        this.isLoading = false;
      }
    }
  }

  private extractFirstLetters(text: string): string {
    if (!text) return '';

    const words = text.split(/\s+/);
    return words
      .map(word => {
        const match = word.match(/[a-zA-Z]/);
        if (match) {
          const index = word.indexOf(match[0]);
          return word.substring(0, index + 1);
        }
        return word;
      })
      .join(' ');
  }

  formatFirstLetters(verse: FlowVerse): SafeHtml {
    if (!verse.firstLetters) return '';
    
    let formatted = verse.firstLetters;
    
    // Handle paragraph markers
    if (formatted.includes('**¶')) {
      if (this.isTextMode) {
        // In text mode, remove paragraph markers (verse refs are already bold)
        formatted = formatted.replace(/\*\*¶/g, '');
      } else {
        // In FLOW layouts, replace with line breaks
        formatted = formatted.replace(/\*\*¶/g, '<br>');
      }
    }
    
    return this.sanitizer.sanitize(1, formatted) || '';
  }

  setViewMode(mode: 'flow' | 'text') {
    this.isTextMode = mode === 'text';
    if (mode === 'flow') {
      this.prepareGridRows();
    }
  }

  toggleViewMode() {
    this.isTextMode = !this.isTextMode;
    if (!this.isTextMode) {
      this.prepareGridRows();
    }
  }

  setLayoutMode(mode: 'grid' | 'single') {
    this.layoutMode = mode;
    this.prepareGridRows();
  }

  private prepareGridRows() {
    this.gridRows = [];
    if (this.layoutMode === 'grid' && this.verses.length > 0) {
      for (let i = 0; i < this.verses.length; i += 5) {
        const row = [];
        for (let j = 0; j < 5; j++) {
          row.push(this.verses[i + j] || null);
        }
        this.gridRows.push(row);
      }
    }
  }

  private updateMemorizationStatus() {
    this.bibleService
      .getUserVerses(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((userVerses: UserVerseDetail[]) => {
        const memorizedSet = new Set(
          userVerses.map(v => 
            `${v.verse.book_id}-${v.verse.chapter_number}-${v.verse.verse_number}`
          )
        );

        this.verses.forEach(verse => {
          verse.isMemorized = memorizedSet.has(verse.verseCode);
        });

        this.updateProgress();
      });
  }

  private updateProgress() {
    this.memorizedCount = this.verses.filter(v => v.isMemorized).length;
    this.progressPercent = this.verses.length > 0 
      ? Math.round((this.memorizedCount / this.verses.length) * 100)
      : 0;
  }

  getVerseClass(verse: FlowVerse | null): string {
    if (!verse) return 'empty-cell';
    
    const classes = ['verse-cell'];
    if (verse.isFifth && this.highlightFifthVerse) {
      classes.push('fifth-verse');
    }
    if (verse.isMemorized) {
      classes.push('memorized');
    }
    if (verse.isSaving) {
      classes.push('saving');
    }
    return classes.join(' ');
  }

  getVerseReference(verse: FlowVerse): string {
    // Handle single-chapter books
    const book = this.bibleService.getBibleData().getBookById(
      parseInt(verse.verseCode.split('-')[0])
    );
    if (book && book.chapters.length === 1) {
      return `${verse.bookName} ${verse.verse}`;
    }
    return verse.reference;
  }

  getPassageTitle(): string {
    if (!this.currentSelection || !this.selectedBook) {
      return this.currentSelection?.reference || '';
    }
    
    // Handle single-chapter books
    if (this.selectedBook.chapters.length === 1) {
      return this.selectedBook.name;
    }
    
    return this.currentSelection.reference;
  }

  toggleVerse(verse: FlowVerse) {
    if (verse.isSaving) return;
    
    verse.isMemorized = !verse.isMemorized;
    verse.isSaving = true;
    
    // Add subtle animation
    const verseElement = document.querySelector(`[data-verse="${verse.verseCode}"]`);
    if (verseElement) {
      verseElement.classList.add('fade-in');
      setTimeout(() => verseElement.classList.remove('fade-in'), 300);
    }
    
    this.updateProgress();
    this.saveQueue$.next(verse);
    this.cdr.detectChanges();
  }

  private saveVerseToBackend(verse: FlowVerse) {
    const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
    
    if (verse.isMemorized) {
      this.bibleService.saveVerse(
        this.userId,
        bookId,
        chapter,
        verseNum,
        1 // Default practice count
      ).subscribe({
        next: () => {
          verse.isSaving = false;
          this.showSaveNotification();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error saving verse:', error);
          verse.isMemorized = !verse.isMemorized;
          verse.isSaving = false;
          this.updateProgress();
          alert('Failed to save verse. Please try again.');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.bibleService.deleteVerse(
        this.userId,
        bookId,
        chapter,
        verseNum
      ).subscribe({
        next: () => {
          verse.isSaving = false;
          this.showSaveNotification();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error removing verse:', error);
          verse.isMemorized = !verse.isMemorized;
          verse.isSaving = false;
          this.updateProgress();
          alert('Failed to remove verse. Please try again.');
          this.cdr.detectChanges();
        }
      });
    }
  }

  private showSaveNotification() {
    this.showSavedMessage = true;
    setTimeout(() => {
      this.showSavedMessage = false;
      this.cdr.detectChanges();
    }, 2000);
  }

  increaseFontSize() {
    if (this.fontSize < 24) {
      this.fontSize += 2;
    }
  }

  decreaseFontSize() {
    if (this.fontSize > 12) {
      this.fontSize -= 2;
    }
  }

  hasPreviousChapter(): boolean {
    if (!this.selectedBook || !this.currentSelection) return false;
    
    const currentChapter = this.currentSelection.startVerse?.chapter || 1;
    
    // Check if there's a previous chapter in current book
    if (currentChapter > 1) return true;
    
    // Check if there's a previous book
    const currentBookId = this.selectedBook.id;
    return currentBookId > 1;
  }

  hasNextChapter(): boolean {
    if (!this.selectedBook || !this.currentSelection) return false;
    
    const currentChapter = this.currentSelection.startVerse?.chapter || 1;
    
    // Check if there's a next chapter in current book
    if (currentChapter < this.selectedBook.chapters.length) return true;
    
    // Check if there's a next book
    const currentBookId = this.selectedBook.id;
    return currentBookId < 66; // 66 books in the Bible
  }

  getPreviousChapterLabel(): string {
    if (!this.selectedBook || !this.currentSelection) return '';
    
    const currentChapter = this.currentSelection.startVerse?.chapter || 1;
    
    if (currentChapter > 1) {
      // Previous chapter in same book
      return `${this.selectedBook.name} ${currentChapter - 1}`;
    } else {
      // Last chapter of previous book
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
      // Next chapter in same book
      return `${this.selectedBook.name} ${currentChapter + 1}`;
    } else {
      // First chapter of next book
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
      // Go to previous book's last chapter
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
      // Go to next book's first chapter
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
      v => `${book.id}-${chapter}-${v.verseNumber}`
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

    // Update initialSelection to sync with verse picker
    this.initialSelection = selection;
    this.onVerseSelectionChanged(selection);
  }

  async startMemorization() {
    if (!this.verses.length || !this.selectedBook) return;

    const missingCodes = this.verses.filter(v => !v.text).map(v => v.verseCode);
    if (missingCodes.length) {
      try {
        const texts = await this.bibleService.getVerseTexts(this.userId, missingCodes).toPromise();
        this.verses.forEach(v => {
          if (!v.text && texts && texts[v.verseCode]) {
            v.text = texts[v.verseCode];
            v.firstLetters = this.extractFirstLetters(v.text);
          }
        });
      } catch (err) {
        console.error('Error fetching missing verse texts', err);
      }
    }

    this.versesForModal = this.verses.map(v => {
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
      const bookId = this.selectedBook.id;
      const chapterGroups = new Map<number, number[]>();

      // Group all verses by chapter
      this.verses.forEach(verse => {
        const [_, chapter, verseNum] = verse.verseCode.split('-').map(Number);
        if (!chapterGroups.has(chapter)) {
          chapterGroups.set(chapter, []);
        }
        chapterGroups.get(chapter)!.push(verseNum);
      });

      // Save each chapter
      const savePromises = Array.from(chapterGroups.entries()).map(
        ([chapter, verses]) => {
          const chapterData = this.selectedBook.chapters[chapter - 1];
          
          // Use bulk save for full chapters
          if (verses.length === chapterData.verses.length) {
            return this.bibleService
              .saveChapter(this.userId, bookId, chapter)
              .toPromise();
          }
          
          // Save individual verses
          return Promise.all(
            verses.map(verse =>
              this.bibleService
                .saveVerse(this.userId, bookId, chapter, verse, 1)
                .toPromise()
            )
          );
        }
      );

      await Promise.all(savePromises);

      // Update local state
      this.verses.forEach(verse => {
        verse.isMemorized = true;
      });
      
      this.updateProgress();
      this.showSaveNotification();
    } catch (error) {
      console.error('Error marking all as memorized:', error);
      alert('Failed to mark all verses as memorized');
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

  toggleMenu(menu: 'layout' | 'toggle') {
    this.openMenu = this.openMenu === menu ? null : menu;
  }
}
