// frontend/src/app/features/memorize/flow/flow.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  VersePickerComponent,
  VerseSelection,
} from '../../../shared/components/verse-range-picker/verse-range-picker.component';
import { BibleService } from '../../../core/services/bible.service';
import { UserService } from '../../../core/services/user.service';
import { MemorizationModalComponent } from '../../../shared/components/memorization-modal/memorization-modal.component';
import { User } from '../../../core/models/user';
import { UserVerseDetail } from '../../../core/models/bible';
import { Subject, takeUntil } from 'rxjs';

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
  showVerseText = false;
  highlightFifthVerse = true;
  showSavedMessage = false;
  warningMessage: string | null = null;

  // Data
  verses: FlowVerse[] = [];
  currentSelection: VerseSelection | null = null;
  initialSelection: VerseSelection | null = null;
  confidenceLevel = 50;
  isLoading = false;
  isSaving = false;
  userId = 1;

  // Grid rows for manual grid
  gridRows: FlowVerse[][] = [];

  // Add property for selected book
  selectedBook: any = null;

  // Memorization modal state
  showMemorization = false;
  versesForModal: ModalVerse[] = [];
  modalBookId = 0;
  modalChapterName = '';

  // Request management
  private destroy$ = new Subject<void>();
  private loadVersesCancel$ = new Subject<void>();
  private requestCounter = 0;

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        if (user) {
          this.userId =
            typeof user.id === 'string' ? parseInt(user.id) : user.id;
        }
      });

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const bookId = parseInt(params['bookId']);
        const chapter = parseInt(params['chapter']);
        if (!isNaN(bookId) && !isNaN(chapter)) {
          const book = this.bibleService.getBibleData().getBookById(bookId);
          if (book) {
            const chapterData = book.chapters[chapter - 1];
            if (chapterData) {
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
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadVersesCancel$.complete();
  }

  onVerseSelectionChanged(selection: VerseSelection) {
    this.currentSelection = selection;

    // Store selected book
    if (selection.startVerse) {
      const book = this.bibleService
        .getBibleData()
        .getBookById(selection.startVerse.bookId);
      this.selectedBook = book;
    }

    // Validate FLOW requirements
    const isChapter = selection.mode === 'chapter';
    if (!isChapter && selection.verseCount < 10) {
      this.warningMessage =
        'Please select at least 10 verses or an entire chapter.';
      this.verses = [];
      return;
    } else {
      this.warningMessage = null;
    }

    // Cancel any pending verse loads
    this.loadVersesCancel$.next();

    // Load new verses
    this.loadVerses();
  }

  async loadVerses() {
    if (!this.currentSelection) return;

    this.isLoading = true;
    this.verses = [];

    // Increment request counter to track which request is latest
    const currentRequestId = ++this.requestCounter;

    try {
      // Get verse texts from API.Bible through backend
      const verseTexts = await this.bibleService
        .getVerseTexts(this.userId, this.currentSelection.verseCodes)
        .pipe(
          takeUntil(this.loadVersesCancel$), // Cancel if new request comes in
        )
        .toPromise();

      // Check if this is still the latest request
      if (currentRequestId !== this.requestCounter) {
        console.log('Ignoring outdated request', currentRequestId);
        return;
      }

      // Process verses
      this.verses = this.currentSelection.verseCodes.map(
        (verseCode: string, index: number) => {
          const [bookId, chapter, verse] = verseCode.split('-').map(Number);
          const verseText = verseTexts?.[verseCode] || '';

          // Show error if no text found
          if (!verseText) {
            console.error(`No text found for verse ${verseCode}`);
          }

          return {
            verseCode,
            reference: this.getVerseReference(bookId, chapter, verse),
            text: verseText,
            firstLetters: this.extractFirstLetters(verseText),
            isMemorized: false, // Will be updated from user data
            isFifth: (index + 1) % 5 === 0,
            bookName: this.getBookName(bookId),
            chapter,
            verse,
          };
        },
      );

      // Check if any verses failed to load
      const failedVerses = this.verses.filter((v) => !v.text);
      if (failedVerses.length > 0) {
        console.warn(`Failed to load ${failedVerses.length} verses`);
      }

      // Update memorization status from user data
      this.updateMemorizationStatus();

      // Prepare grid data
      this.prepareGridRows();
    } catch (error: any) {
      // Check if error is due to cancellation
      if (error?.name === 'EmptyError') {
        console.log('Request cancelled');
        return;
      }

      console.error('Error loading verses:', error);
      // Show user-friendly error
      this.verses = [];
      alert(
        'Failed to load verses. Please check your internet connection and try again.',
      );
    } finally {
      // Only update loading state if this is the latest request
      if (currentRequestId === this.requestCounter) {
        this.isLoading = false;
      }
    }
  }

  extractFirstLetters(text: string): string {
    if (!text) return '';

    // Extract first letter of each word while preserving punctuation
    const words = text.split(/\s+/);
    return words
      .map((word) => {
        // Find first alphabetic character
        const match = word.match(/[a-zA-Z]/);
        if (match) {
          const index = word.indexOf(match[0]);
          // Include any leading punctuation with the first letter
          return word.substring(0, index + 1);
        }
        // Return punctuation-only words as is
        return word;
      })
      .join(' ');
  }

  prepareGridRows() {
    this.gridRows = [];
    if (this.layoutMode === 'grid') {
      // Group verses into rows of 5
      for (let i = 0; i < this.verses.length; i += 5) {
        const row = [];
        for (let j = 0; j < 5; j++) {
          row.push(this.verses[i + j] || null);
        }
        this.gridRows.push(row);
      }
    }
  }

  toggleLayout() {
    this.layoutMode = this.layoutMode === 'grid' ? 'single' : 'grid';
    this.prepareGridRows();
  }

  async saveProgress() {
    if (!this.verses.length || !this.selectedBook) return;

    this.isSaving = true;

    try {
      // Convert confidence to practice count (percentage/10)
      const practiceCount = Math.ceil(this.confidenceLevel / 10);

      // Use bulk save for better performance
      const verseCodes = this.verses.map((v) => v.verseCode);
      const bookId = this.selectedBook.id;

      // Group by chapter for bulk operations
      const chapterGroups: Map<number, number[]> = new Map();

      verseCodes.forEach((code) => {
        const [_, chapter, verse] = code.split('-').map(Number);
        if (!chapterGroups.has(chapter)) {
          chapterGroups.set(chapter, []);
        }
        chapterGroups.get(chapter)!.push(verse);
      });

      // Save each chapter as a batch
      const savePromises = Array.from(chapterGroups.entries()).map(
        ([chapter, verses]) => {
          // If it's a full chapter, use chapter save endpoint
          const chapterData = this.selectedBook.chapters[chapter - 1];
          if (verses.length === chapterData.verses.length) {
            return this.bibleService
              .saveChapter(this.userId, bookId, chapter)
              .toPromise();
          } else {
            // Otherwise save individual verses
            return Promise.all(
              verses.map((verse) =>
                this.bibleService
                  .saveVerse(this.userId, bookId, chapter, verse, practiceCount)
                  .toPromise(),
              ),
            );
          }
        },
      );

      await Promise.all(savePromises);

      // Update memorization status
      this.verses.forEach((verse) => {
        verse.isMemorized = true;
      });

      // Show saved message
      this.showSavedMessage = true;
      setTimeout(() => {
        this.showSavedMessage = false;
      }, 3000);
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      this.isSaving = false;
    }
  }

  clearProgress() {
    if (!this.verses.length || !this.selectedBook) return;

    this.isSaving = true;

    try {
      const bookId = this.selectedBook.id;

      // Group by chapter for bulk operations
      const chapterGroups: Map<number, number[]> = new Map();

      this.verses.forEach((verse) => {
        const [_, chapter, verseNum] = verse.verseCode.split('-').map(Number);
        if (!chapterGroups.has(chapter)) {
          chapterGroups.set(chapter, []);
        }
        chapterGroups.get(chapter)!.push(verseNum);
      });

      // Clear each chapter as a batch
      const clearPromises = Array.from(chapterGroups.entries()).map(
        ([chapter, verses]) => {
          // If it's a full chapter, use chapter clear endpoint
          const chapterData = this.selectedBook.chapters[chapter - 1];
          if (verses.length === chapterData.verses.length) {
            return this.bibleService
              .clearChapter(this.userId, bookId, chapter)
              .toPromise();
          } else {
            // Otherwise clear individual verses
            return Promise.all(
              verses.map((verse) =>
                this.bibleService
                  .deleteVerse(this.userId, bookId, chapter, verse)
                  .toPromise(),
              ),
            );
          }
        },
      );

      Promise.all(clearPromises).then(() => {
        // Update memorization status
        this.verses.forEach((verse) => {
          verse.isMemorized = false;
        });

        // Reset confidence
        this.confidenceLevel = 50;

        this.isSaving = false;
      });
    } catch (error) {
      console.error('Error clearing progress:', error);
      this.isSaving = false;
    }
  }

  // Helper methods
  private getVerseReference(
    bookId: number,
    chapter: number,
    verse: number,
  ): string {
    const book = this.bibleService.getBibleData().getBookById(bookId);
    return book
      ? `${book.name} ${chapter}:${verse}`
      : `${bookId}-${chapter}:${verse}`;
  }

  private getBookName(bookId: number): string {
    const book = this.bibleService.getBibleData().getBookById(bookId);
    return book ? book.name : `Book ${bookId}`;
  }

  private updateMemorizationStatus() {
    // Check each verse against user's memorized verses
    this.bibleService
      .getUserVerses(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((userVerses: UserVerseDetail[]) => {
        const memorizedSet = new Set(
          userVerses.map(
            (v: UserVerseDetail) =>
              `${v.verse.book_id}-${v.verse.chapter_number}-${v.verse.verse_number}`,
          ),
        );

        this.verses.forEach((verse) => {
          verse.isMemorized = memorizedSet.has(verse.verseCode);
        });

        // Update grid data after status change
        this.prepareGridRows();
      });
  }

  getVerseClass(verse: FlowVerse | null): string {
    if (!verse) return 'empty-cell';

    const classes = ['verse-cell'];
    if (verse.isFifth && this.highlightFifthVerse) {
      classes.push('fifth-verse');
    }
    // Removed memorized class to keep cells white
    return classes.join(' ');
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
      } as ModalVerse;
    });

    const first = this.verses[0];
    this.modalBookId = this.selectedBook.id;
    this.modalChapterName = `${this.selectedBook.name} ${first.chapter}`;
    this.showMemorization = true;
  }

  onMemorizationCompleted() {
    this.showMemorization = false;
  }
}
