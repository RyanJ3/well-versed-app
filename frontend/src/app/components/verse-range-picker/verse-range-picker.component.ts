// frontend/src/app/components/verse-picker/verse-picker.component.ts
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BibleService } from '../../services/bible.service';

export interface VerseSelection {
  mode: 'single' | 'range';
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
  @Output() selectionChanged = new EventEmitter<VerseSelection>();

  mode: 'single' | 'range' = 'range';
  
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

  constructor(private bibleService: BibleService) {}

  ngOnInit() {
    this.loadBooks();
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
      this.selectedEndChapter = this.selectedChapter;
      this.selectedEndVerse = 1;
      this.loadEndVerses();
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

  onModeChange(newMode: 'single' | 'range') {
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
      for (let ch = this.selectedChapter; ch <= endChapter; ch++) {
        const startV = ch === this.selectedChapter ? this.selectedVerse : 1;
        const endV = ch === endChapter ? endVerse : this.selectedBook.chapters[ch - 1].verses.length;
        
        for (let v = startV; v <= endV; v++) {
          verseCodes.push(`${this.selectedBook.id}-${ch}-${v}`);
        }
      }
      
      verseCount = verseCodes.length;
    }

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