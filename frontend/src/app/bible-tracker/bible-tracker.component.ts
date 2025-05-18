// frontend/src/app/bible-tracker/bible-tracker.component.ts

import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BibleService } from '../services/bible.service';
import { UserService } from '../services/user.service';
import { Subscription } from 'rxjs';
import { BibleBook, BibleChapter, BibleData, BibleTestament, UserVerseDetail } from '../models/bible';
import { BibleGroup } from '../models/bible/bible-group.modle';
import { BibleVerse } from '../models/bible/bible-verse.model';

@Component({
  selector: 'app-bible-tracker',
  templateUrl: './bible-tracker.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule], 
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
export class BibleTrackerComponent implements OnInit, OnDestroy {
  private bibleData: BibleData;
  private subscriptions: Subscription = new Subscription();

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
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private router: Router // Add router for navigation
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
    // Log book ID mappings for debugging
    this.bibleService.logBookIdMappings();

    // Subscribe to user preferences from UserService
    const userSub = this.userService.currentUser$.subscribe(user => {
      if (user) {
        console.log('BibleTracker - User preferences loaded:', user);

        // Check if apocrypha setting has changed - note we're using camelCase
        const newSetting = user.includeApocrypha || false;
        if (this.includeApocrypha !== newSetting) {
          console.log(`Apocrypha setting changed from ${this.includeApocrypha} to ${newSetting}`);
          this.includeApocrypha = newSetting;

          // Reload verses with the new setting
          this.loadUserVerses();
        } else if (!this.userVerses.length) {
          // Initial load or reload after reset
          this.loadUserVerses();
        }
      } else {
        // Fallback if no user is loaded yet
        this.loadUserVerses();
      }
    });

    // Subscribe to the Bible service preferences
    const prefSub = this.bibleService.preferences$.subscribe(prefs => {
      if (this.includeApocrypha !== prefs.includeApocrypha) {
        console.log(`BibleTracker - Detected preference change: includeApocrypha=${prefs.includeApocrypha}`);
        this.includeApocrypha = prefs.includeApocrypha;

        // Force reload testaments to reflect the updated book list
        this.refreshView();
      }
    });

    // Add subscriptions to be cleaned up on destroy
    this.subscriptions.add(userSub);
    this.subscriptions.add(prefSub);

    // Try to fetch the current user if not already available
    this.userService.fetchCurrentUser();
  }

  ngOnDestroy() {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }

  // Enhanced refreshView with debugging
  refreshView() {
    console.log(`BibleTracker.refreshView() - includeApocrypha=${this.includeApocrypha}`);

    // Reload the current selection to account for new books
    this.bibleData = this.bibleService.getBibleData();

    // Save current selections
    const currentTestamentName = this.selectedTestament?.name;
    const currentGroupName = this.selectedGroup?.name;
    const currentBookName = this.selectedBook?.name;
    const currentChapterNum = this.selectedChapter?.chapterNumber;

    // Reset selections to apply new filters
    this.selectedTestament = null;
    this.selectedGroup = null;
    this.selectedBook = null;
    this.selectedChapter = null;

    // Try to restore previous selection if available
    if (currentTestamentName) {
      const testament = this.testaments.find(t => t.name === currentTestamentName);
      if (testament) {
        this.selectedTestament = testament;

        if (currentGroupName) {
          const group = testament.groups.find(g => g.name === currentGroupName);
          if (group) {
            this.selectedGroup = group;

            if (currentBookName) {
              const book = group.books.find(b => b.name === currentBookName);
              if (book) {
                this.selectedBook = book;

                if (currentChapterNum) {
                  // Get visible chapters based on apocrypha setting
                  const visibleChapters = this.getVisibleChapters(book);
                  const chapter = visibleChapters.find(c => c.chapterNumber === currentChapterNum);
                  if (chapter) {
                    this.selectedChapter = chapter;
                  } else if (visibleChapters.length > 0) {
                    // If current chapter is now hidden, select first visible chapter
                    this.selectedChapter = visibleChapters[0];
                  }
                }
              }
            }
          }
        }
      }
    }

    // If we couldn't restore the selection, initialize with defaults
    if (!this.selectedTestament) {
      this.selectedTestament = this.defaultTestament;
      if (this.selectedTestament?.groups.length > 0) {
        this.setGroup(this.defaultGroup);
      }
    }

    // Reload verses data
    this.loadUserVerses();

    // Force view update
    this.cdr.detectChanges();
  }

  loadUserVerses() {
    this.isLoading = true;

    // Pass the user's apocrypha preference to the service
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

  // UPDATED METHOD: Modified to filter visible chapters based on apocrypha setting
  setBook(book: BibleBook): void {
    this.selectedBook = book;
    
    // Get only the visible chapters based on apocrypha setting
    const visibleChapters = this.getVisibleChapters(book);
    
    if (visibleChapters.length > 0) {
      // Select the first visible chapter
      this.setChapter(visibleChapters[0]);
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

  // UPDATED METHOD: Now we use isApocryphal from API data
  isApocryphalBook(book: BibleBook): boolean {
    // Check if the book has apocryphal content
    return book.canonicalAffiliation !== 'All' &&
      (book.canonicalAffiliation === 'Catholic' ||
        book.canonicalAffiliation === 'Eastern Orthodox');
  }

  // NEW METHOD: Determines if a chapter should be visible
  isChapterVisible(chapter: BibleChapter): boolean {
    if (!chapter) return false;
    
    // If apocrypha is included, all chapters are visible
    if (this.includeApocrypha) {
      return true;
    }
    
    // Otherwise, only show non-apocryphal chapters
    return !chapter.isApocryphal;
  }

  // NEW METHOD: Returns only the chapters that should be visible
  getVisibleChapters(book: BibleBook): BibleChapter[] {
    if (!book) return [];
    
    return book.chapters.filter(chapter => this.isChapterVisible(chapter));
  }

  // NEW METHOD: Check if a book has any apocryphal chapters
  hasApocryphalChapters(book: BibleBook): boolean {
    if (!book) return false;
    return book.chapters.some(chapter => chapter.isApocryphal);
  }

  // NEW METHOD: Navigate to settings page to enable/disable apocrypha
  goToSettings(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/profile']);
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