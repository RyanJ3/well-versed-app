// frontend/src/app/features/memorize/flow/flow.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  VersePickerComponent,
  VerseSelection,
} from '../../../shared/components/verse-range-picker/verse-range-picker.component';
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

type PracticeStage = 'full' | 'initials' | 'memory';

interface VerseGroup {
  verses: FlowVerse[];
  currentStage: PracticeStage;
  confidence: number;
  audioBlob?: Blob;
  audioUrl?: string;
}

@Component({
  selector: 'app-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, VersePickerComponent],
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

  // Practice settings
  showSettings = true;
  versesPerGroup = 2;
  groups: VerseGroup[] = [];
  currentGroupIndex = 0;
  isPracticing = false;
  canRecord = false;
  isRecording = false;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

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
    this.checkMicrophonePermission();
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
    this.cleanup();
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

  selectVersesPerGroup(count: number) {
    this.versesPerGroup = count;
  }

  async startPractice() {
    this.showSettings = false;
    this.createGroups();
    if (this.groups.length > 0) {
      this.isPracticing = true;
    }
  }

  createGroups() {
    this.groups = [];
    for (let i = 0; i < this.verses.length; i += this.versesPerGroup) {
      const slice = this.verses.slice(i, i + this.versesPerGroup);
      this.groups.push({ verses: slice, currentStage: 'full', confidence: 50 });
    }
    this.currentGroupIndex = 0;
  }

  get currentGroup(): VerseGroup | null {
    return this.groups[this.currentGroupIndex] || null;
  }

  getCurrentGroupReference(): string {
    const group = this.currentGroup;
    if (!group) return '';
    const verses = group.verses;
    if (verses.length === 1) {
      return verses[0].reference;
    } else {
      const first = verses[0];
      const last = verses[verses.length - 1];
      if (first.chapter === last.chapter) {
        return `${first.reference}-${last.verse}`;
      } else {
        return `${first.reference}-${last.chapter}:${last.verse}`;
      }
    }
  }

  nextStage() {
    const group = this.currentGroup;
    if (!group) return;

    if (group.currentStage === 'full') {
      group.currentStage = 'initials';
    } else if (group.currentStage === 'initials') {
      group.currentStage = 'memory';
    } else {
      this.finishGroup();
    }
  }

  previousStage() {
    const group = this.currentGroup;
    if (!group) return;

    if (group.currentStage === 'initials') {
      group.currentStage = 'full';
    } else if (group.currentStage === 'memory') {
      group.currentStage = 'initials';
    } else if (this.currentGroupIndex > 0) {
      this.currentGroupIndex--;
    }
  }

  getNextButtonText(): string {
    const group = this.currentGroup;
    if (!group) return 'Next';

    switch (group.currentStage) {
      case 'full':
        return 'Continue to FLOW';
      case 'initials':
        return 'Continue to Recite';
      case 'memory':
        return 'Next Group';
      default:
        return 'Next';
    }
  }

  finishGroup() {
    if (this.currentGroupIndex < this.groups.length - 1) {
      this.currentGroupIndex++;
    } else {
      this.completePractice();
    }
  }

  async completePractice() {
    this.isPracticing = false;
    if (this.currentSelection?.startVerse && this.selectedBook) {
      await this.bibleService
        .saveChapter(
          this.userId,
          this.selectedBook.id,
          this.currentSelection.startVerse.chapter,
        )
        .toPromise();
    }
    this.showSavedMessage = true;
    setTimeout(() => (this.showSavedMessage = false), 3000);
  }

  async checkMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      this.canRecord = true;
    } catch {
      this.canRecord = false;
    }
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const group = this.groups[this.currentGroupIndex];
        group.audioBlob = blob;
        group.audioUrl = URL.createObjectURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.error('Recording error', err);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  playAudio() {
    if (this.audioPlayer) {
      this.audioPlayer.nativeElement.play();
    }
  }

  cleanup() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    this.groups.forEach((g) => {
      if (g.audioUrl) {
        URL.revokeObjectURL(g.audioUrl);
      }
    });
  }
}
