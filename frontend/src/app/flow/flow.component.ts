// frontend/src/app/flow/flow.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VersePickerComponent, VerseSelection } from '../components/verse-range-picker/verse-range-picker.component';
import { BibleService } from '../services/bible.service';
import { UserService } from '../services/user.service';

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
  showMemorizedOnly = false;
  
  // Data
  verses: FlowVerse[] = [];
  currentSelection: VerseSelection | null = null;
  confidenceLevel = 50;
  isLoading = false;
  isSaving = false;
  userId = 1;
  
  // Grid rows for manual grid
  gridRows: FlowVerse[][] = [];
  
  constructor(
    private bibleService: BibleService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      }
    });
  }

  onVerseSelectionChanged(selection: VerseSelection) {
    this.currentSelection = selection;
    
    // Validate minimum verses for range mode
    if (selection.mode === 'range' && selection.verseCount < 10) {
      return;
    }
    
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
      this.verses = this.currentSelection.verseCodes.map((verseCode, index) => {
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
    if (!this.verses.length) return;
    
    this.isSaving = true;
    
    try {
      // Convert confidence to practice count (percentage/10)
      const practiceCount = Math.ceil(this.confidenceLevel / 10);
      
      // Save all verses with same confidence
      const savePromises = this.verses.map(verse => {
        const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
        return this.bibleService.saveVerse(
          this.userId,
          bookId,
          chapter,
          verseNum,
          practiceCount
        ).toPromise();
      });
      
      await Promise.all(savePromises);
      
      // Update memorization status
      this.verses.forEach(verse => {
        verse.isMemorized = true;
      });
      
      console.log('Progress saved successfully');
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      this.isSaving = false;
    }
  }

  clearProgress() {
    if (!this.verses.length) return;
    
    this.isSaving = true;
    
    try {
      // Delete all verses
      const deletePromises = this.verses.map(verse => {
        const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
        return this.bibleService.deleteVerse(
          this.userId,
          bookId,
          chapter,
          verseNum
        ).toPromise();
      });
      
      Promise.all(deletePromises).then(() => {
        // Update memorization status
        this.verses.forEach(verse => {
          verse.isMemorized = false;
        });
        
        // Reset confidence
        this.confidenceLevel = 50;
        
        console.log('Progress cleared successfully');
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
    this.bibleService.getUserVerses(this.userId).subscribe(userVerses => {
      const memorizedSet = new Set(userVerses.map(v => 
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
    if (verse.isMemorized) {
      classes.push('memorized');
    }
    return classes.join(' ');
  }
}