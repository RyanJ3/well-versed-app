import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BibleBook, BibleVerse } from '@models/bible';
import { BibleService } from '@services/api/bible.service';
import { debounceTime, Subject } from 'rxjs';

interface VerseReference {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  verseCode: string;
  displayText: string;
}

@Component({
  selector: 'app-verse-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="verse-picker-container">
      <div class="verse-picker-label">
        🔗 Cross References for:
      </div>
      
      <div class="verse-picker-dropdown" [class.open]="isOpen">
        <button class="verse-picker-button" (click)="toggleDropdown()">
          <span class="verse-text">{{ selectedVerse?.displayText || 'Select a verse' }}</span>
          <svg class="dropdown-icon" [class.rotated]="isOpen" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div class="dropdown-panel" *ngIf="isOpen" (click)="$event.stopPropagation()">
          <div class="search-container">
            <input 
              #searchInput
              type="text" 
              class="search-input"
              [(ngModel)]="searchText"
              (ngModelChange)="onSearchChange()"
              placeholder="Type to search (e.g., John 3:16 or Gen 1:1)"
              (keydown.enter)="selectFirstResult()"
            />
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          
          <div class="results-container">
            <div *ngIf="searching" class="loading">
              Searching...
            </div>
            
            <div *ngIf="!searching && searchResults.length === 0 && searchText" class="no-results">
              No verses found matching "{{ searchText }}"
            </div>
            
            <div *ngIf="!searching && searchResults.length > 0" class="results-list">
              <button 
                *ngFor="let result of searchResults" 
                class="result-item"
                [class.selected]="selectedVerse?.verseCode === result.verseCode"
                (click)="selectVerse(result)"
              >
                <span class="result-book">{{ result.bookName }}</span>
                <span class="result-reference">{{ result.chapter }}:{{ result.verse }}</span>
              </button>
            </div>
            
            <div *ngIf="!searching && !searchText" class="quick-picks">
              <div class="quick-picks-title">Quick Picks</div>
              <button 
                *ngFor="let pick of quickPicks" 
                class="result-item"
                (click)="selectVerse(pick)"
              >
                <span class="result-book">{{ pick.bookName }}</span>
                <span class="result-reference">{{ pick.chapter }}:{{ pick.verse }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="selected-indicator" *ngIf="selectedVerse">
        <span class="indicator-badge">{{ crossReferenceCount }} references</span>
      </div>
    </div>
  `,
  styles: [`
    .verse-picker-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .verse-picker-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b5cf6;
      white-space: nowrap;
    }

    .verse-picker-dropdown {
      position: relative;
      min-width: 250px;
    }

    .verse-picker-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        border-color: #6b5cf6;
      }
    }

    .verse-picker-dropdown.open .verse-picker-button {
      border-color: #6b5cf6;
      box-shadow: 0 0 0 3px rgba(107, 92, 246, 0.1);
    }

    .verse-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1f2937;
    }

    .dropdown-icon {
      transition: transform 0.2s;
      
      &.rotated {
        transform: rotate(180deg);
      }
    }

    .dropdown-panel {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-height: 400px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .search-container {
      position: relative;
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      
      &:focus {
        outline: none;
        border-color: #6b5cf6;
        box-shadow: 0 0 0 3px rgba(107, 92, 246, 0.1);
      }
    }

    .search-icon {
      position: absolute;
      right: 1.5rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
    }

    .results-container {
      flex: 1;
      overflow-y: auto;
      max-height: 300px;
    }

    .loading,
    .no-results {
      padding: 2rem;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .results-list,
    .quick-picks {
      padding: 0.5rem;
    }

    .quick-picks-title {
      padding: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }

    .result-item {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem;
      background: transparent;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: background-color 0.2s;
      text-align: left;
      
      &:hover {
        background-color: #f3f4f6;
      }
      
      &.selected {
        background-color: #eff6ff;
        color: #1d4ed8;
      }
    }

    .result-book {
      font-weight: 500;
      font-size: 0.875rem;
      color: #1f2937;
    }

    .result-reference {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .selected-indicator {
      display: flex;
      align-items: center;
    }

    .indicator-badge {
      padding: 0.25rem 0.5rem;
      background-color: #eff6ff;
      color: #1d4ed8;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
  `]
})
export class VersePickerComponent implements OnInit {
  @Input() books: BibleBook[] = [];
  @Input() currentBookId?: number;
  @Input() currentChapter?: number;
  @Input() crossReferenceCount = 0;
  
  @Output() verseSelected = new EventEmitter<VerseReference>();
  
  @ViewChild('searchInput') searchInputRef?: ElementRef;
  
  isOpen = false;
  searchText = '';
  searching = false;
  searchResults: VerseReference[] = [];
  selectedVerse: VerseReference | null = null;
  quickPicks: VerseReference[] = [];
  
  private searchSubject = new Subject<string>();
  
  constructor(private bibleService: BibleService) {}
  
  ngOnInit() {
    // Set up search debouncing
    this.searchSubject
      .pipe(debounceTime(300))
      .subscribe(searchText => {
        this.performSearch(searchText);
      });
    
    // Initialize quick picks with popular verses
    this.initializeQuickPicks();
    
    // Set default verse if current chapter is provided
    if (this.currentBookId && this.currentChapter) {
      const book = this.books.find(b => b.id === this.currentBookId);
      if (book) {
        this.selectedVerse = {
          bookId: book.id,
          bookName: book.name,
          chapter: this.currentChapter,
          verse: 1,
          verseCode: `${book.id}-${this.currentChapter}-1`,
          displayText: `${book.name} ${this.currentChapter}:1`
        };
        this.verseSelected.emit(this.selectedVerse);
      }
    }
  }
  
  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => {
        this.searchInputRef?.nativeElement.focus();
      }, 100);
    }
  }
  
  onSearchChange() {
    this.searchSubject.next(this.searchText);
  }
  
  performSearch(searchText: string) {
    if (!searchText.trim()) {
      this.searchResults = [];
      return;
    }
    
    this.searching = true;
    
    // Parse the search text to find matching verses
    // Support formats like "John 3:16", "Gen 1:1", "Genesis 1:1"
    const matches = this.parseSearchText(searchText);
    
    this.searchResults = matches;
    this.searching = false;
  }
  
  parseSearchText(text: string): VerseReference[] {
    const results: VerseReference[] = [];
    
    // Normalize the search text
    const normalized = text.trim().toLowerCase();
    
    // Try to match pattern: [book] [chapter]:[verse]
    const pattern = /^(.+?)\s+(\d+):(\d+)$/;
    const match = normalized.match(pattern);
    
    if (match) {
      const bookPart = match[1];
      const chapter = parseInt(match[2]);
      const verse = parseInt(match[3]);
      
      // Find matching books
      const matchingBooks = this.books.filter(book => 
        book.name.toLowerCase().includes(bookPart)
      );
      
      for (const book of matchingBooks) {
        // Validate chapter and verse exist
        if (chapter > 0 && chapter <= book.totalChapters) {
          results.push({
            bookId: book.id,
            bookName: book.name,
            chapter: chapter,
            verse: verse,
            verseCode: `${book.id}-${chapter}-${verse}`,
            displayText: `${book.name} ${chapter}:${verse}`
          });
        }
      }
    } else {
      // If no pattern match, search for book names
      const matchingBooks = this.books.filter(book =>
        book.name.toLowerCase().includes(normalized)
      );
      
      // Show first chapter first verse of matching books
      for (const book of matchingBooks.slice(0, 5)) {
        results.push({
          bookId: book.id,
          bookName: book.name,
          chapter: 1,
          verse: 1,
          verseCode: `${book.id}-1-1`,
          displayText: `${book.name} 1:1`
        });
      }
    }
    
    return results;
  }
  
  selectVerse(verse: VerseReference) {
    this.selectedVerse = verse;
    this.verseSelected.emit(verse);
    this.isOpen = false;
    this.searchText = '';
    this.searchResults = [];
  }
  
  selectFirstResult() {
    if (this.searchResults.length > 0) {
      this.selectVerse(this.searchResults[0]);
    }
  }
  
  initializeQuickPicks() {
    // Popular verses for quick selection
    const popularVerses = [
      { bookId: 43, bookName: 'John', chapter: 3, verse: 16 },
      { bookId: 1, bookName: 'Genesis', chapter: 1, verse: 1 },
      { bookId: 19, bookName: 'Psalms', chapter: 23, verse: 1 },
      { bookId: 45, bookName: 'Romans', chapter: 8, verse: 28 },
      { bookId: 20, bookName: 'Proverbs', chapter: 3, verse: 5 }
    ];
    
    this.quickPicks = popularVerses.map(v => ({
      ...v,
      verseCode: `${v.bookId}-${v.chapter}-${v.verse}`,
      displayText: `${v.bookName} ${v.chapter}:${v.verse}`
    }));
  }
}