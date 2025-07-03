// frontend/src/app/shared/components/verse-range-picker/verse-picker.component.ts
import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  HostListener,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { BibleService } from '../../../core/services/bible.service';

export interface VerseSelection {
  mode: 'single' | 'range' | 'chapter';
  startVerse: {
    book: string;
    bookId: number;
    chapter: number;
    verse: number;
  };
  endVerse?: {
    chapter: number;
    verse: number;
  };
  verseCodes: string[];
  verseCount: number;
  reference: string;
}

@Component({
  selector: 'app-verse-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verse-picker.component.html',
  styleUrls: ['./verse-picker.component.scss'],
})
export class VersePickerComponent implements OnInit, OnChanges {
  @Input() theme: 'enhanced' | 'minimal' | 'cyberpunk' = 'enhanced';
  @Input() showFilters = false;
  @Input() minimumVerses = 0;
  @Input() maximumVerses = 0; // 0 means no maximum
  @Input() disabledModes: ('single' | 'range' | 'chapter')[] = [];
  @Input() pageType: 'FLOW' | 'flashcard' | 'general' = 'general';
  @Input() showFlowTip = true;

  @Output() selectionChanged = new EventEmitter<VerseSelection>();
  @Output() selectionApplied = new EventEmitter<VerseSelection>();

  @Input() warningMessage: string | null = null;
  @Input() initialSelection: VerseSelection | null = null;

  private appliedInitial = false;

  mode: 'single' | 'range' | 'chapter' = 'range';

  userId = 1;

  // Open state
  isOpen = false;

  // Available options
  books: any[] = [];
  private allBooks: any[] = [];
  chapters: number[] = [];
  verses: number[] = [];
  endChapters: number[] = [];
  endVerses: number[] = [];
  availableModes: ('single' | 'range' | 'chapter')[] = [
    'single',
    'range',
    'chapter',
  ];

  // Selected values
  selectedBook: any = null;
  selectedChapter = 1;
  selectedVerse = 1;
  selectedEndChapter = 1;
  selectedEndVerse = 1;
  testamentFilter: 'old' | 'new' = 'old';

  // Computed properties
  verseCount = 1;
  isValidSelection = true;
  validationMessage = '';

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialSelection'] && !changes['initialSelection'].firstChange) {
      this.appliedInitial = false;
      if (this.books.length > 0) {
        this.applyInitialSelection();
      }
    }
  }

  ngOnInit() {
    this.loadBooks();

    // Filter available modes
    this.availableModes = this.availableModes.filter(
      (m) => !this.disabledModes.includes(m),
    );

    // Default FLOW pages to chapter mode when available
    if (this.pageType === 'FLOW' && !this.disabledModes.includes('chapter')) {
      this.mode = 'chapter';
    }

    // Set default mode based on disabled modes
    if (this.disabledModes.includes(this.mode)) {
      // Find first available mode
      const availableMode = this.availableModes[0];
      if (availableMode) {
        this.mode = availableMode;
      }
    }

    // Get user ID
    this.userService.currentUser$.subscribe((user) => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      }
    });

    // Emit initial selection
    setTimeout(() => {
      this.emitSelection();
    }, 100);
  }

  // Open handling
  toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.hover-container')) {
      this.isOpen = false;
    }
  }

  // Display helpers
  getDisplayReference(): string {
    if (!this.selectedBook) return 'Select verses';

    let reference = `${this.selectedBook.name} ${this.selectedChapter}`;

    if (this.mode === 'single') {
      reference += `:${this.selectedVerse}`;
    } else if (this.mode === 'range') {
      reference += `:${this.selectedVerse}`;
      if (
        this.selectedEndChapter !== this.selectedChapter ||
        this.selectedEndVerse !== this.selectedVerse
      ) {
        if (this.selectedEndChapter === this.selectedChapter) {
          reference += `-${this.selectedEndVerse}`;
        } else {
          reference += `-${this.selectedEndChapter}:${this.selectedEndVerse}`;
        }
      }
    }

    return reference;
  }

  getModeLabel(mode?: 'single' | 'range' | 'chapter'): string {
    const modeToCheck = mode || this.mode;
    switch (modeToCheck) {
      case 'single':
        return 'Single';
      case 'range':
        return 'Range';
      case 'chapter':
        return 'Chapter';
      default:
        return '';
    }
  }

  getModeButtonClass(mode: 'single' | 'range' | 'chapter'): string {
    let classes = 'mode-button';
    if (this.mode === mode) {
      classes += ' active';
    }
    if (this.isModeDisabled(mode)) {
      classes += ' disabled';
    }
    return classes;
  }

  loadBooks() {
    const bibleData = this.bibleService.getBibleData();
    this.allBooks = bibleData.books;

    if (this.initialSelection) {
      const initBook = this.allBooks.find(
        (b) => b.id === this.initialSelection!.startVerse.bookId,
      );
      if (initBook) {
        this.testamentFilter = initBook.testament.isOld ? 'old' : 'new';
      }
    }

    this.applyTestamentFilter();

    if (this.books.length > 0) {
      if (this.initialSelection) {
        const book = this.books.find(
          (b) => b.id === this.initialSelection!.startVerse.bookId,
        );
        this.selectedBook = book || this.books[0];
      } else {
        this.selectedBook = this.books[0];
      }
      this.loadChapters();
      this.applyInitialSelection();
    }
  }

  onBookChange() {
    this.loadChapters();
    this.selectedChapter = 1;
    this.selectedVerse = 1;
    this.selectedEndChapter = 1;
    this.selectedEndVerse = 1;
    this.emitSelection();
  }

  onTestamentChange() {
    this.applyTestamentFilter();
    if (this.books.length > 0) {
      this.selectedBook = this.books[0];
      this.loadChapters();
    }
    this.emitSelection();
  }

  private applyTestamentFilter() {
    if (!this.allBooks.length) {
      const bibleData = this.bibleService.getBibleData();
      this.allBooks = bibleData.books;
    }

    this.books = this.allBooks.filter((b) =>
      this.testamentFilter === 'old' ? b.testament.isOld : b.testament.isNew,
    );
  }

  private updateEndChapters() {
    this.endChapters = this.chapters.filter((c) => c >= this.selectedChapter);
    if (this.selectedEndChapter < this.selectedChapter) {
      this.selectedEndChapter = this.selectedChapter;
      this.selectedEndVerse = this.selectedVerse;
    }
  }

  loadChapters() {
    if (this.selectedBook) {
      this.chapters = Array.from(
        { length: this.selectedBook.chapters.length },
        (_, i) => i + 1,
      );
      this.updateEndChapters();
      this.loadVerses();
    }
  }

  onChapterChange() {
    this.loadVerses();
    this.selectedVerse = 1;
    this.updateEndChapters();

    if (this.mode === 'range') {
      // Auto-adjust if end chapter is before start chapter
      if (this.selectedEndChapter < this.selectedChapter) {
        this.selectedEndChapter = this.selectedChapter;
        this.selectedEndVerse = this.selectedVerse;
      } else if (
        this.selectedEndChapter === this.selectedChapter &&
        this.selectedEndVerse < this.selectedVerse
      ) {
        this.selectedEndVerse = this.selectedVerse;
      }

      this.loadEndVerses();
      this.autoAdjustForMinimumVerses();
      this.ensureRangeMinimum();
    }

    this.emitSelection();
  }

  loadVerses() {
    if (this.selectedBook && this.selectedChapter) {
      const chapterData = this.selectedBook.chapters[this.selectedChapter - 1];
      this.verses = Array.from(
        { length: chapterData.verses.length },
        (_, i) => i + 1,
      );

      if (this.mode === 'range') {
        this.loadEndVerses();
      }
    }
  }

  onVerseChange() {
    if (
      this.mode === 'range' &&
      this.selectedEndChapter === this.selectedChapter
    ) {
      this.selectedEndVerse = Math.max(
        this.selectedVerse,
        this.selectedEndVerse,
      );
    }
    this.ensureRangeMinimum();
    this.emitSelection();
  }

  onEndChapterChange() {
    this.loadEndVerses();
    this.selectedEndVerse = 1;
    this.ensureRangeMinimum();
    this.emitSelection();
  }

  loadEndVerses() {
    if (this.selectedBook && this.selectedEndChapter) {
      const chapterData =
        this.selectedBook.chapters[this.selectedEndChapter - 1];
      this.endVerses = Array.from(
        { length: chapterData.verses.length },
        (_, i) => i + 1,
      );

      // If same chapter, ensure end verse is >= start verse
      if (this.selectedEndChapter === this.selectedChapter) {
        this.endVerses = this.endVerses.filter((v) => v >= this.selectedVerse);
        if (this.selectedEndVerse < this.selectedVerse) {
          this.selectedEndVerse = this.selectedVerse;
        }
      }
    }
  }

  onEndVerseChange() {
    this.ensureRangeMinimum();
    this.emitSelection();
  }

  private applyInitialSelection() {
    if (!this.initialSelection || this.appliedInitial) return;

    const sel = this.initialSelection;
    this.mode = sel.mode;
    this.selectedChapter = sel.startVerse.chapter;
    this.selectedVerse = sel.startVerse.verse;
    this.selectedEndChapter = sel.endVerse
      ? sel.endVerse.chapter
      : sel.startVerse.chapter;
    this.selectedEndVerse = sel.endVerse
      ? sel.endVerse.verse
      : sel.startVerse.verse;

    this.loadVerses();
    this.updateEndChapters();
    if (this.mode === 'range') {
      this.ensureRangeMinimum();
    }
    this.appliedInitial = true;
    this.emitSelection();
  }

  onModeChange(newMode: 'single' | 'range' | 'chapter') {
    // Check if mode is disabled
    if (this.disabledModes.includes(newMode)) {
      return;
    }

    this.mode = newMode;

    // Auto-adjust for minimum verses if in range mode
    if (newMode === 'range' && this.minimumVerses > 0) {
      this.autoAdjustForMinimumVerses();
    }
    if (newMode === 'range') {
      this.updateEndChapters();
      this.ensureRangeMinimum();
    }

    this.emitSelection();
  }

  isModeDisabled(mode: 'single' | 'range' | 'chapter'): boolean {
    return this.disabledModes.includes(mode);
  }

  applySelection() {
    const selection = this.emitSelection();
    this.selectionApplied.emit(selection as VerseSelection);
    this.isOpen = false;
  }

  private autoAdjustForMinimumVerses() {
    if (this.mode !== 'range' || this.minimumVerses === 0 || !this.selectedBook)
      return;

    // Calculate current verse count
    let currentCount = this.calculateVerseCount();

    // If we already meet the minimum, don't adjust
    if (currentCount >= this.minimumVerses) return;

    // Try to extend to meet minimum
    const bookChapters = this.selectedBook.chapters;
    let endChapter = this.selectedEndChapter;
    let endVerse = this.selectedEndVerse;

    while (
      currentCount < this.minimumVerses &&
      endChapter <= bookChapters.length
    ) {
      const chapterData = bookChapters[endChapter - 1];

      if (endChapter === this.selectedEndChapter) {
        // Extend within current chapter
        if (endVerse < chapterData.verses.length) {
          endVerse++;
        } else if (endChapter < bookChapters.length) {
          // Move to next chapter
          endChapter++;
          endVerse = 1;
        } else {
          break; // Reached end of book
        }
      } else {
        // We're in a new chapter
        if (endVerse < chapterData.verses.length) {
          endVerse++;
        } else if (endChapter < bookChapters.length) {
          endChapter++;
          endVerse = 1;
        } else {
          break;
        }
      }

      currentCount++;
    }

    // Update the selections
    this.selectedEndChapter = endChapter;
    this.selectedEndVerse = endVerse;
    this.loadEndVerses();
  }

  private ensureRangeMinimum() {
    if (this.mode !== 'range' || !this.selectedBook) return;

    const MIN_RANGE = 2;
    let count = this.calculateVerseCount();
    if (count >= MIN_RANGE) return;

    const chapters = this.selectedBook.chapters;
    let startCh = this.selectedChapter;
    let startV = this.selectedVerse;
    let endCh = this.selectedEndChapter;
    let endV = this.selectedEndVerse;

    while (count < MIN_RANGE) {
      const endChapData = chapters[endCh - 1];
      if (endV < endChapData.verses.length) {
        endV++;
      } else if (endCh < chapters.length) {
        endCh++;
        endV = 1;
      } else if (startV > 1) {
        startV--;
      } else if (startCh > 1) {
        startCh--;
        const startChapData = chapters[startCh - 1];
        startV = startChapData.verses.length;
      } else {
        break;
      }
      this.selectedChapter = startCh;
      this.selectedVerse = startV;
      this.selectedEndChapter = endCh;
      this.selectedEndVerse = endV;
      count = this.calculateVerseCount();
    }

    this.loadVerses();
  }

  private calculateVerseCount(): number {
    if (!this.selectedBook) return 0;

    if (this.mode === 'single') {
      return 1;
    } else if (this.mode === 'chapter') {
      const chapterData = this.selectedBook.chapters[this.selectedChapter - 1];
      return chapterData.verses.length;
    } else {
      // Range mode
      let count = 0;
      for (let ch = this.selectedChapter; ch <= this.selectedEndChapter; ch++) {
        const startV = ch === this.selectedChapter ? this.selectedVerse : 1;
        const chapterData = this.selectedBook.chapters[ch - 1];
        const endV =
          ch === this.selectedEndChapter
            ? this.selectedEndVerse
            : chapterData.verses.length;
        count += endV - startV + 1;
      }
      return count;
    }
  }

  private validateSelection(): boolean {
    const count = this.calculateVerseCount();

    // Check minimum
    if (this.minimumVerses > 0 && count < this.minimumVerses) {
      if (this.pageType === 'FLOW') {
        this.validationMessage = '';
        return true;
      }
      this.validationMessage = `Please select at least ${this.minimumVerses} verses`;
      return false;
    }

    // Check maximum
    if (this.maximumVerses > 0 && count > this.maximumVerses) {
      this.validationMessage = `Please select no more than ${this.maximumVerses} verses`;
      return false;
    }

    this.validationMessage = '';
    return true;
  }

  private emitSelection(): VerseSelection | undefined {
    if (!this.selectedBook) return;

    const startVerse = {
      book: this.selectedBook.name,
      bookId: this.selectedBook.id,
      chapter: this.selectedChapter,
      verse: this.selectedVerse,
    };

    let verseCodes: string[] = [];
    let verseCount = 1;
    let reference = `${this.selectedBook.name} ${this.selectedChapter}:${this.selectedVerse}`;

    if (this.mode === 'single') {
      verseCodes = [
        `${this.selectedBook.id}-${this.selectedChapter}-${this.selectedVerse}`,
      ];
      verseCount = 1;
    } else if (this.mode === 'chapter') {
      // Chapter mode - all verses in the chapter
      const chapterData = this.selectedBook.chapters[this.selectedChapter - 1];
      reference = `${this.selectedBook.name} ${this.selectedChapter}`;

      for (let v = 1; v <= chapterData.verses.length; v++) {
        const verseCode = `${this.selectedBook.id}-${this.selectedChapter}-${v}`;
        verseCodes.push(verseCode);
      }

      verseCount = verseCodes.length;
    } else {
      // Range mode
      const endChapter = this.selectedEndChapter;
      const endVerse = this.selectedEndVerse;

      reference = `${this.selectedBook.name} ${this.selectedChapter}:${this.selectedVerse}`;

      if (
        endChapter !== this.selectedChapter ||
        endVerse !== this.selectedVerse
      ) {
        if (endChapter === this.selectedChapter) {
          reference += `-${endVerse}`;
        } else {
          reference += `-${endChapter}:${endVerse}`;
        }
      }

      // Generate verse codes for range
      verseCodes = [];
      for (let ch = this.selectedChapter; ch <= endChapter; ch++) {
        const startV = ch === this.selectedChapter ? this.selectedVerse : 1;
        const chapterData = this.selectedBook.chapters[ch - 1];
        const endV = ch === endChapter ? endVerse : chapterData.verses.length;

        for (let v = startV; v <= endV; v++) {
          const verseCode = `${this.selectedBook.id}-${ch}-${v}`;
          verseCodes.push(verseCode);
        }
      }

      verseCount = verseCodes.length;
    }

    // Update validation
    this.verseCount = verseCount;
    this.isValidSelection = this.validateSelection();

    const selection: VerseSelection = {
      mode: this.mode,
      startVerse,
      endVerse:
        this.mode === 'range'
          ? {
              chapter: this.selectedEndChapter,
              verse: this.selectedEndVerse,
            }
          : undefined,
      verseCodes,
      verseCount,
      reference,
    };

    this.selectionChanged.emit(selection);
    return selection;
  }
}
