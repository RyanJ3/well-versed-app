// frontend/src/app/features/memorize/flow/flow.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  VersePickerComponent,
  VerseSelection,
} from '../../../shared/components/verse-range-picker/verse-range-picker.component';
import { PracticeModalComponent } from '../../shared/components/practice-modal/practice-modal.component';
import { BibleService } from '../../../core/services/bible.service';
import { UserService } from '../../../core/services/user.service';
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

@Component({
  selector: 'app-flow',
  standalone: true,
  imports: [CommonModule, VersePickerComponent, PracticeModalComponent],
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss'],
})
export class FlowComponent implements OnInit, OnDestroy {
  warningMessage: string | null = null;

  // Data
  verses: FlowVerse[] = [];
  currentSelection: VerseSelection | null = null;
  initialSelection: VerseSelection | null = null;
  isLoading = false;
  userId = 1;

  // Modal state
  showPracticeModal = false;

  // Add property for selected book
  selectedBook: any = null;

  // Request management
  private destroy$ = new Subject<void>();
  private loadVersesCancel$ = new Subject<void>();
  private requestCounter = 0;

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
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
              const verseCodes = chapterData.verses.map(v => `${book.id}-${chapter}-${v.verseNumber}`);
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

      // Open practice modal when verses are ready
      this.showPracticeModal = true;
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
      });
  }

  onPracticeClosed() {
    this.showPracticeModal = false;
  }

  onPracticeCompleted() {
    if (!this.selectedBook || !this.currentSelection?.startVerse) {
      this.showPracticeModal = false;
      return;
    }

    const chapter = this.currentSelection.startVerse.chapter;
    const bookId = this.selectedBook.id;

    this.bibleService.saveChapter(this.userId, bookId, chapter).subscribe({
      next: () => {
        this.showPracticeModal = false;
        this.router.navigate(['/user']);
      },
      error: () => {
        this.showPracticeModal = false;
        this.router.navigate(['/user']);
      },
    });
  }

  // No visual helpers needed here; handled in modal
}
