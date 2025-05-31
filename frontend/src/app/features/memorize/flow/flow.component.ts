// frontend/src/app/features/memorize/flow/flow.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VersePickerComponent, VerseSelection } from '../../../shared/components/verse-range-picker/verse-range-picker.component';
import { BibleService } from '../../../core/services/bible.service';
import { UserService } from '../../../core/services/user.service';
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
}

@Component({
  selector: 'app-flow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    VersePickerComponent
  ],
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss']
})
export class FlowComponent implements OnInit {
  // View state
  layoutMode: 'grid' | 'single' = 'grid';
  showVerseText = false;
  highlightFifthVerse = true;
  showSavedMessage = false;
  
  // Data
  verses: FlowVerse[] = [];
  currentSelection: VerseSelection | null = null;
  confidenceLevel = 50;
  isLoading = false;
  isSaving = false;
  userId = 1;
  
  // Grid rows for manual grid
  gridRows: FlowVerse[][] = [];
  
  // Add property for selected book
  selectedBook: any = null;
  
  constructor(
    private bibleService: BibleService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userService.currentUser$.subscribe((user: User | null) => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      }
    });
  }

  onVerseSelectionChanged(selection: VerseSelection) {
    this.currentSelection = selection;
    
    // Store selected book
    if (selection.startVerse) {
      const book = this.bibleService.getBibleData().getBookById(selection.startVerse.bookId);
      this.selectedBook = book;
    }
    
    // No validation needed - verse picker auto-adjusts
    this.loadVerses();
  }

  async loadVerses() {
    if (!this.currentSelection) return;
    
    this.isLoading = true;
    this.verses = [];
    
    try {
      // Get verse texts (mocked for now - will be replaced with API)
      const verseTexts = await this.getVerseTexts(this.currentSelection.verseCodes);
      
      // Process verses
      this.verses = this.currentSelection.verseCodes.map((verseCode: string, index: number) => {
        const [bookId, chapter, verse] = verseCode.split('-').map(Number);
        const verseText = verseTexts[verseCode] || this.generateMockText(verseCode);
        
        return {
          verseCode,
          reference: this.getVerseReference(bookId, chapter, verse),
          text: verseText,
          firstLetters: this.extractFirstLetters(verseText),
          isMemorized: false, // Will be updated from user data
          isFifth: (index + 1) % 5 === 0,
          bookName: this.getBookName(bookId),
          chapter,
          verse
        };
      });
      
      // Update memorization status from user data
      this.updateMemorizationStatus();
      
      // Prepare grid data
      this.prepareGridRows();
      
    } catch (error) {
      console.error('Error loading verses:', error);
    } finally {
      this.isLoading = false;
    }
  }

  extractFirstLetters(text: string): string {
    // Extract first letter of each word while preserving punctuation
    const words = text.split(/\s+/);
    return words.map(word => {
      // Find first alphabetic character
      const match = word.match(/[a-zA-Z]/);
      if (match) {
        const index = word.indexOf(match[0]);
        // Include any leading punctuation with the first letter
        return word.substring(0, index + 1);
      }
      // Return punctuation-only words as is
      return word;
    }).join(' ');
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
      const verseCodes = this.verses.map(v => v.verseCode);
      const bookId = this.selectedBook.id;
      
      // Group by chapter for bulk operations
      const chapterGroups: Map<number, number[]> = new Map();
      
      verseCodes.forEach(code => {
        const [_, chapter, verse] = code.split('-').map(Number);
        if (!chapterGroups.has(chapter)) {
          chapterGroups.set(chapter, []);
        }
        chapterGroups.get(chapter)!.push(verse);
      });
      
      // Save each chapter as a batch
      const savePromises = Array.from(chapterGroups.entries()).map(([chapter, verses]) => {
        // If it's a full chapter, use chapter save endpoint
        const chapterData = this.selectedBook.chapters[chapter - 1];
        if (verses.length === chapterData.verses.length) {
          return this.bibleService.saveChapter(this.userId, bookId, chapter).toPromise();
        } else {
          // Otherwise save individual verses
          return Promise.all(verses.map(verse => 
            this.bibleService.saveVerse(this.userId, bookId, chapter, verse, practiceCount).toPromise()
          ));
        }
      });
      
      await Promise.all(savePromises);
      
      // Update memorization status
      this.verses.forEach(verse => {
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
      
      this.verses.forEach(verse => {
        const [_, chapter, verseNum] = verse.verseCode.split('-').map(Number);
        if (!chapterGroups.has(chapter)) {
          chapterGroups.set(chapter, []);
        }
        chapterGroups.get(chapter)!.push(verseNum);
      });
      
      // Clear each chapter as a batch
      const clearPromises = Array.from(chapterGroups.entries()).map(([chapter, verses]) => {
        // If it's a full chapter, use chapter clear endpoint
        const chapterData = this.selectedBook.chapters[chapter - 1];
        if (verses.length === chapterData.verses.length) {
          return this.bibleService.clearChapter(this.userId, bookId, chapter).toPromise();
        } else {
          // Otherwise clear individual verses
          return Promise.all(verses.map(verse => 
            this.bibleService.deleteVerse(this.userId, bookId, chapter, verse).toPromise()
          ));
        }
      });
      
      Promise.all(clearPromises).then(() => {
        // Update memorization status
        this.verses.forEach(verse => {
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
  private async getVerseTexts(verseCodes: string[]): Promise<Record<string, string>> {
    // TODO: Replace with actual API call
    const texts: Record<string, string> = {};
    verseCodes.forEach(code => {
      texts[code] = this.generateMockText(code);
    });
    return texts;
  }

  private generateMockText(verseCode: string): string {
    // Mock verse text generator
    const templates = [
      "In the beginning God created the heaven and the earth.",
      "And God said, Let there be light: and there was light.",
      "For God so loved the world, that he gave his only begotten Son.",
      "The Lord is my shepherd; I shall not want.",
      "Trust in the Lord with all thine heart; and lean not unto thine own understanding."
    ];
    
    const hash = verseCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return templates[hash % templates.length];
  }

  private getVerseReference(bookId: number, chapter: number, verse: number): string {
    const book = this.bibleService.getBibleData().getBookById(bookId);
    return book ? `${book.name} ${chapter}:${verse}` : `${bookId}-${chapter}:${verse}`;
  }

  private getBookName(bookId: number): string {
    const book = this.bibleService.getBibleData().getBookById(bookId);
    return book ? book.name : `Book ${bookId}`;
  }

  private updateMemorizationStatus() {
    // Check each verse against user's memorized verses
    this.bibleService.getUserVerses(this.userId).subscribe((userVerses: UserVerseDetail[]) => {
      const memorizedSet = new Set(userVerses.map((v: UserVerseDetail) => 
        `${v.verse.book_id}-${v.verse.chapter_number}-${v.verse.verse_number}`
      ));
      
      this.verses.forEach(verse => {
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
}