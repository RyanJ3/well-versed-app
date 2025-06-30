// frontend/src/app/features/memorize/flow/flow.component.ts
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
  private _layoutMode: 'grid' | 'single' | 'text' = 'grid';
  get layoutMode() {
    return this._layoutMode;
  }
  set layoutMode(value: 'grid' | 'single' | 'text') {
    this._layoutMode = value;
    this.prepareGridRows();
  }
  
  showVerseText = false;
  highlightFifthVerse = true;
  private _showOnlyUnmemorized = false;
  get showOnlyUnmemorized() {
    return this._showOnlyUnmemorized;
  }
  set showOnlyUnmemorized(value: boolean) {
    this._showOnlyUnmemorized = value;
    this.applyFilters();
  }
  showSavedMessage = false;
  warningMessage: string | null = null;
  fontSize = 16;

  // Data
  verses: FlowVerse[] = [];
  filteredVerses: FlowVerse[] = [];
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
    private cdr: ChangeDetectorRef
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

    // Validate FLOW requirements
    if (selection.mode !== 'chapter' && selection.verseCount < 10) {
      this.warningMessage = 'Please select at least 10 verses or an entire chapter.';
      this.verses = [];
      this.filteredVerses = [];
      return;
    }

    this.warningMessage = null;
    this.loadVersesCancel$.next();
    this.loadVerses();
  }

  async loadVerses() {
    if (!this.currentSelection) return;

    this.isLoading = true;
    this.verses = [];
    this.filteredVerses = [];
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
      this.applyFilters();
      this.updateProgress();
    } catch (error: any) {
      if (error?.name === 'EmptyError') return; // Cancelled
      
      console.error('Error loading verses:', error);
      this.verses = [];
      this.filteredVerses = [];
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

  private applyFilters() {
    if (this.showOnlyUnmemorized) {
      this.filteredVerses = this.verses.filter(v => !v.isMemorized);
    } else {
      this.filteredVerses = [...this.verses];
    }
    this.prepareGridRows();
  }

  private prepareGridRows() {
    this.gridRows = [];
    if (this.layoutMode === 'grid' && this.filteredVerses.length > 0) {
      for (let i = 0; i < this.filteredVerses.length; i += 5) {
        const row = [];
        for (let j = 0; j < 5; j++) {
          row.push(this.filteredVerses[i + j] || null);
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
        this.applyFilters();
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

  startMemorization() {
    if (!this.verses.length || !this.selectedBook) return;

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

  async saveProgress() {
    if (!this.verses.length || !this.selectedBook) return;

    this.isSaving = true;

    try {
      const bookId = this.selectedBook.id;
      const chapterGroups = new Map<number, number[]>();

      // Group memorized verses by chapter
      this.verses
        .filter(v => v.isMemorized)
        .forEach(verse => {
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
      this.showSaveNotification();
    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Failed to save progress');
    } finally {
      this.isSaving = false;
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
      this.applyFilters();
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
