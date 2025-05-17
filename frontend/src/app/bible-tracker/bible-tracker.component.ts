// bible-tracker.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleService } from '../services/bible.service';
import { UserService } from '../services/user.service';
import { BibleBook, BibleChapter, BibleData, BibleGroup, BibleTestament, BibleVerse, UserVerseDetail } from '../models/bible.model';

@Component({
  selector: 'app-bible-tracker',
  templateUrl: './bible-tracker.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: [
    './bible-tracker.component.scss',
    './style-sheets/book-selector.scss',
    './style-sheets/chapter-selector.scss',
    './style-sheets/verse-selector.scss',
    './style-sheets/group-selector.scss',
    './style-sheets/testament-selector.scss',
    './style-sheets/shared-bubble.scss'
  ],
})
export class BibleTrackerComponent implements OnInit {
  private bibleData: BibleData;

  selectedTestament: BibleTestament | null = null;
  selectedGroup: BibleGroup | null = null;
  selectedBook: BibleBook | null = null;
  selectedChapter: BibleChapter | null = null;

  userVerses: UserVerseDetail[] = [];
  isLoading = true;
  isSavingBulk = false;
  userId = 1; // Default test user
  includeApocrypha = false; // Add this property for apocrypha setting

  constructor(
    private bibleService: BibleService,
    private userService: UserService, // Add UserService injection
    private cdr: ChangeDetectorRef
  ) {
    console.log('BibleTrackerComponent initialized');
    this.bibleData = this.bibleService.getBibleData();

    // Initialize with default testament
    this.selectedTestament = this.defaultTestament;
    if (this.selectedTestament?.groups.length > 0) {
      this.setGroup(this.defaultGroup);
    }
  }

  ngOnInit() {
    // Get user preferences first
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        console.log('User preferences loaded:', user);
        this.includeApocrypha = user.includeApocrypha || false;
        console.log(`User apocrypha setting: ${this.includeApocrypha}`);
        
        // Now load verses with the correct setting
        this.loadUserVerses();
      } else {
        // Fallback if no user is loaded yet
        this.loadUserVerses();
      }
    });
    
    // Also try to fetch the current user if not already available
    this.userService.fetchCurrentUser();
  }

  loadUserVerses() {
    this.isLoading = true;

    this.bibleService.getUserVerses(this.userId, this.includeApocrypha).subscribe({
      next: (verses) => {
        console.log(`Loaded ${verses.length} verses for user ${this.userId}`);
        this.userVerses = verses;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading verses:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleAndSaveVerse(verse: BibleVerse): void {
    // Toggle the verse state
    verse.toggle();

    // Save the change to database
    this.saveVerse(verse);
  }

  saveVerse(verse: BibleVerse) {
    if (!verse.chapter || !verse.book) {
      console.error('Cannot save verse without proper hierarchy', verse);
      return;
    }

    console.log(`Saving verse: ${verse.book.name} ${verse.chapter.chapterNumber}:${verse.verseNumber}`);
    console.log(`Current memorization status: ${verse.memorized}, Practice count: ${verse.practiceCount}`);

    // If verse is memorized, increment practice count
    const practiceCount = verse.memorized ? verse.practiceCount + 1 : verse.practiceCount;

    console.log(`Calling bibleService.saveVerse with practice count: ${practiceCount}`);

    this.bibleService.saveVerse(
      this.userId,
      verse.book.id,
      verse.chapter.chapterNumber,
      verse.verseNumber,
      practiceCount
    ).subscribe({
      next: (response) => {
        console.log('Save verse response:', response);
        // Update local model
        verse.practiceCount = practiceCount;
        verse.lastPracticed = new Date();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error saving verse:', error);
        // Even if there's an error, we keep the UI state
        // It may be due to network issues and will sync later
      }
    });
  }

  // Replace the button click methods
  selectAllVerses(): void {
    if (this.selectedChapter) {
      this.selectedChapter.selectAllVerses();
      this.saveBulkVerses(this.selectedChapter, true);
      this.cdr.detectChanges();
    }
  }

  clearAllVerses(): void {
    if (this.selectedChapter) {
      this.selectedChapter.clearAllVerses();
      this.saveBulkVerses(this.selectedChapter, false);
      this.cdr.detectChanges();
    }
  }

  // Add book-level operations
  selectAllBookVerses(): void {
    if (this.selectedBook) {
      this.isSavingBulk = true;
      this.selectedBook.selectAllVerses();
      
      // Bulk save all chapters in the book
      this.saveBulkBook(this.selectedBook, true);
    }
  }

  clearAllBookVerses(): void {
    if (this.selectedBook) {
      this.isSavingBulk = true;
      this.selectedBook.clearAllVerses();
      
      // Bulk save all chapters in the book
      this.saveBulkBook(this.selectedBook, false);
    }
  }

  saveBulkVerses(chapter: BibleChapter, isMemorized: boolean): void {
    if (!chapter || !chapter.book) return;

    this.isSavingBulk = true; // Start loading
    const verseNums = Array.from({ length: chapter.verses.length }, (_, i) => i + 1);
    const practiceCount = isMemorized ? 1 : 0;

    this.bibleService.saveVersesBulk(
      this.userId, chapter.book.id, chapter.chapterNumber, verseNums, practiceCount
    ).subscribe({
      next: (response) => {
        console.log('Bulk save successful:', response);
        chapter.verses.forEach(verse => {
          verse.memorized = isMemorized;
          verse.practiceCount = practiceCount;
          if (isMemorized) verse.lastPracticed = new Date();
        });
        this.isSavingBulk = false; // End loading
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error saving verses in bulk:', error);
        this.isSavingBulk = false; // End loading
        // Keep the UI state even if there's an error
        this.cdr.detectChanges();
      }
    });
  }

  // Method to save all chapters in a book
  saveBulkBook(book: BibleBook, isMemorized: boolean): void {
    if (!book) return;
    
    // Create an array to track pending operations
    const operations: Promise<any>[] = [];
    
    // Process each chapter
    book.chapters.forEach(chapter => {
      const verseNums = Array.from({ length: chapter.verses.length }, (_, i) => i + 1);
      const practiceCount = isMemorized ? 1 : 0;
      
      // Create a promise for this chapter
      const operation = this.bibleService.saveVersesBulkWithPromise(
        this.userId, book.id, chapter.chapterNumber, verseNums, practiceCount
      );
      
      operations.push(operation);
    });
    
    // Wait for all operations to complete
    Promise.all(operations)
      .then(() => {
        console.log(`All ${operations.length} chapters in ${book.name} saved successfully`);
        this.isSavingBulk = false;
        this.cdr.detectChanges();
      })
      .catch(error => {
        console.error(`Error saving chapters in ${book.name}:`, error);
        this.isSavingBulk = false;
        this.cdr.detectChanges();
      });
  }

  setTestament(testament: BibleTestament): void {
    this.selectedTestament = testament;
    if (testament.groups.length > 0) {
      // Select the first group from the new testament
      const firstGroup = testament.groups[0];
      this.setGroup(firstGroup);
    } else {
      this.selectedGroup = null;
      this.selectedBook = null;
      this.selectedChapter = null;
    }
  }

  setGroup(group: BibleGroup): void {
    this.selectedGroup = group;
    if (group.books.length > 0) {
      this.setBook(group.books[0]);
    } else {
      this.selectedBook = null;
      this.selectedChapter = null;
    }
  }

  setBook(book: BibleBook): void {
    this.selectedBook = book;
    if (book.chapters.length > 0) {
      this.setChapter(book.chapters[0]);
    } else {
      this.selectedChapter = null;
    }
  }

  setChapter(chapter: BibleChapter): void {
    this.selectedChapter = chapter;
  }

  getMemorizationClass(verse: BibleVerse): string {
    if (verse.practiceCount >= 5) return 'high-practice';
    if (verse.practiceCount >= 2) return 'medium-practice';
    return 'low-practice';
  }

  refreshVerses() {
    this.loadUserVerses();
  }

  // Helper method to check if a book is apocryphal
  isApocryphalBook(book: BibleBook): boolean {
    return book.canonicalAffiliation !== 'All' && 
           (book.canonicalAffiliation === 'Catholic' || 
            book.canonicalAffiliation === 'Eastern Orthodox' ||
            book.name === 'Psalm 151');
  }

  // Helper method to determine testament styling
  getTestamentClass(testament: BibleTestament): string {
    return testament.name === 'Old Testament' ? 'old-testament' : 'new-testament';
  }

  get testaments(): BibleTestament[] {
    return this.bibleData.testaments;
  }

  get oldTestament(): BibleTestament {
    return this.bibleData.getTestamentByName('OLD');
  }

  get newTestament(): BibleTestament {
    return this.bibleData.getTestamentByName('NEW');
  }

  get defaultTestament(): BibleTestament {
    return this.oldTestament;
  }

  get defaultGroup(): BibleGroup {
    return this.defaultBook.group;
  }

  get defaultBook(): BibleBook {
    return this.bibleData.getBookByName("Genesis");
  }

  get percentComplete(): number {
    return this.bibleData.percentComplete;
  }
}