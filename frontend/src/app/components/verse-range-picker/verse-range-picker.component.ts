// frontend/src/app/components/verse-range-picker/verse-range-picker.component.ts
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BibleService } from '../../services/bible.service';
import { UserService } from '../../services/user.service';

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
  styleUrls: ['./verse-picker.component.scss']
})
export class VersePickerComponent implements OnInit {
  @Input() theme: 'enhanced' | 'minimal' | 'cyberpunk' = 'enhanced';
  @Input() showFilters = false;
  @Input() minimumVerses = 0;
  @Output() selectionChanged = new EventEmitter<VerseSelection>();

  mode: 'single' | 'range' | 'chapter' = 'range';
  
  userId = 1;
  
  // Available options
  books: any[] = [];
  chapters: number[] = [];
  verses: number[] = [];
  endChapters: number[] = [];
  endVerses: number[] = [];

  // Selected values
  selectedBook: any = null;
  selectedChapter = 1;
  selectedVerse = 1;
  selectedEndChapter = 1;
  selectedEndVerse = 1;

  // Computed properties
  verseCount = 1;
  isValidSelection = true;
  validationMessage = '';

  constructor(
    private bibleService: BibleService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadBooks();
    
    // Get user ID
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      }
    });
  }

  loadBooks() {
    const bibleData = this.bibleService.getBibleData();
    this.books = bibleData.books;
    
    if (this.books.length > 0) {
      this.selectedBook = this.books[0];
      this.loadChapters();
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

  loadChapters() {
    if (this.selectedBook) {
      this.chapters = Array.from({length: this.selectedBook.chapters.length}, (_, i) => i + 1);
      this.endChapters = [...this.chapters];
      this.loadVerses();
    }
  }

  onChapterChange() {
    this.loadVerses();
    this.selectedVerse = 1;
    
    if (this.mode === 'range') {
      // Auto-adjust if end chapter is before start chapter
      if (this.selectedEndChapter < this.selectedChapter) {
        this.selectedEndChapter = this.selectedChapter;
        this.selectedEndVerse = this.selectedVerse;
      } else if (this.selectedEndChapter === this.selectedChapter && this.selectedEndVerse < this.selectedVerse) {
        this.selectedEndVerse = this.selectedVerse;
      }
      
      this.loadEndVerses();
      // this.autoAdjustForMinimumVerses();
    }
    
    this.emitSelection();
  }

  loadVerses() {
    if (this.selectedBook && this.selectedChapter) {
      const chapterData = this.selectedBook.chapters[this.selectedChapter - 1];
      this.verses = Array.from({length: chapterData.verses.length}, (_, i) => i + 1);
      
      if (this.mode === 'range') {
        this.loadEndVerses();
      }
    }
  }

  onVerseChange() {
    if (this.mode === 'range' && this.selectedEndChapter === this.selectedChapter) {
      this.selectedEndVerse = Math.max(this.selectedVerse, this.selectedEndVerse);
    }
    this.emitSelection();
  }

  onEndChapterChange() {
    this.loadEndVerses();
    this.selectedEndVerse = 1;
    this.emitSelection();
  }

  loadEndVerses() {
    if (this.selectedBook && this.selectedEndChapter) {
      const chapterData = this.selectedBook.chapters[this.selectedEndChapter - 1];
      this.endVerses = Array.from({length: chapterData.verses.length}, (_, i) => i + 1);
      
      // If same chapter, ensure end verse is >= start verse
      if (this.selectedEndChapter === this.selectedChapter) {
        this.endVerses = this.endVerses.filter(v => v >= this.selectedVerse);
        if (this.selectedEndVerse < this.selectedVerse) {
          this.selectedEndVerse = this.selectedVerse;
        }
      }
    }
  }

  onEndVerseChange() {
    this.emitSelection();
  }

  onModeChange(newMode: 'single' | 'range' | 'chapter') {
    this.mode = newMode;
    this.emitSelection();
  }

  private emitSelection() {
    if (!this.selectedBook) return;

    const startVerse = {
      book: this.selectedBook.name,
      bookId: this.selectedBook.id,
      chapter: this.selectedChapter,
      verse: this.selectedVerse
    };

    let verseCodes: string[] = [];
    let verseCount = 1;
    let reference = `${this.selectedBook.name} ${this.selectedChapter}:${this.selectedVerse}`;

    if (this.mode === 'single') {
      verseCodes = [`${this.selectedBook.id}-${this.selectedChapter}-${this.selectedVerse}`];
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
      
      if (endChapter !== this.selectedChapter || endVerse !== this.selectedVerse) {
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

    // Clear any previous validation messages
    this.isValidSelection = true;
    this.validationMessage = '';

    this.verseCount = verseCount;

    const selection: VerseSelection = {
      mode: this.mode,
      startVerse,
      endVerse: this.mode === 'range' ? {
        chapter: this.selectedEndChapter,
        verse: this.selectedEndVerse
      } : undefined,
      verseCodes,
      verseCount,
      reference
    };

    this.selectionChanged.emit(selection);
  }
}