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
  includeApocrypha = false;

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.bibleData = this.bibleService.getBibleData();
    this.selectedTestament = this.defaultTestament;
    if (this.selectedTestament?.groups.length > 0) {
      this.setGroup(this.defaultGroup);
    }
  }

  ngOnInit() {
    // Subscribe to user preferences
    const userSub = this.userService.currentUser$.subscribe(user => {
      if (user) {
        const newSetting = user.includeApocrypha || false;
        if (this.includeApocrypha !== newSetting) {
          this.includeApocrypha = newSetting;
          this.loadUserVerses();
        } else if (!this.userVerses.length) {
          this.loadUserVerses();
        }
      } else {
        this.loadUserVerses();
      }
    });

    this.subscriptions.add(userSub);
    this.userService.fetchCurrentUser();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadUserVerses() {
    this.isLoading = true;
    
    this.bibleService.getUserVerses(this.userId, this.includeApocrypha).subscribe({
      next: (verses) => {
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

  /**
   * Toggle and save a single verse
   */
  toggleAndSaveVerse(verse: BibleVerse): void {
    // Toggle the verse state
    verse.toggle();
    
    // Save the change
    this.saveVerse(verse);
  }

  /**
   * Save a single verse
   */
  saveVerse(verse: BibleVerse) {
    if (!verse.chapter || !verse.book) {
      console.error('Verse missing required data');
      return;
    }

    // Determine practice count based on memorized state
    const practiceCount = verse.memorized ? 1 : 0;
    
    this.bibleService.saveVerse(
      this.userId,
      verse.book.id,
      verse.chapter.chapterNumber,
      verse.verseNumber,
      practiceCount
    ).subscribe({
      next: (response) => {
        console.log('Verse saved successfully');
        verse.practiceCount = practiceCount;
        verse.lastPracticed = practiceCount > 0 ? new Date() : undefined;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error saving verse:', error);
        // Revert the toggle on error
        verse.toggle();
        this.cdr.detectChanges();
      }
    });
  }

  // Navigation methods
  setTestament(testament: BibleTestament): void {
    this.selectedTestament = testament;
    if (testament.groups.length > 0) {
      this.setGroup(testament.groups[0]);
    }
  }

  setGroup(group: BibleGroup): void {
    this.selectedGroup = group;
    if (group.books.length > 0) {
      this.setBook(group.books[0]);
    }
  }

  setBook(book: BibleBook): void {
    this.selectedBook = book;
    const visibleChapters = this.getVisibleChapters(book);
    if (visibleChapters.length > 0) {
      this.setChapter(visibleChapters[0]);
    }
  }

  setChapter(chapter: BibleChapter): void {
    this.selectedChapter = chapter;
  }

  refreshVerses() {
    this.loadUserVerses();
  }

  // Chapter-level operations using efficient single-call endpoints
  selectAllVerses(): void {
    if (!this.selectedChapter || !this.selectedBook) return;
    
    this.isSavingBulk = true;
    
    // Use the efficient save endpoint
    this.bibleService.saveChapter(
      this.userId,
      this.selectedBook.id,
      this.selectedChapter.chapterNumber
    ).subscribe({
      next: () => {
        // Update local state
        this.selectedChapter!.verses.forEach(verse => {
          verse.memorized = true;
          verse.practiceCount = 1;
          verse.lastPracticed = new Date();
        });
        this.isSavingBulk = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error saving chapter:', error);
        this.isSavingBulk = false;
        // Optionally show error message to user
      }
    });
  }

  clearAllVerses(): void {
    if (!this.selectedChapter || !this.selectedBook) return;
    
    this.isSavingBulk = true;
    
    // Use the efficient clear endpoint
    this.bibleService.clearChapter(
      this.userId,
      this.selectedBook.id,
      this.selectedChapter.chapterNumber
    ).subscribe({
      next: () => {
        // Update local state
        this.selectedChapter!.verses.forEach(verse => {
          verse.memorized = false;
          verse.practiceCount = 0;
          verse.lastPracticed = undefined;
        });
        this.isSavingBulk = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error clearing chapter:', error);
        this.isSavingBulk = false;
      }
    });
  }

  // Book-level operations using efficient single-call endpoints
  selectAllBookVerses(): void {
    if (!this.selectedBook) return;
    
    // Optional: Add confirmation for large books
    const totalVerses = this.selectedBook.totalVerses;
    if (totalVerses > 500) {
      if (!confirm(`This will mark ${totalVerses} verses as memorized. Continue?`)) {
        return;
      }
    }
    
    this.isSavingBulk = true;
    
    // Use the efficient save endpoint
    this.bibleService.saveBook(this.userId, this.selectedBook.id).subscribe({
      next: () => {
        // Update local state for all chapters
        this.selectedBook!.chapters.forEach(chapter => {
          chapter.verses.forEach(verse => {
            verse.memorized = true;
            verse.practiceCount = 1;
            verse.lastPracticed = new Date();
          });
        });
        this.isSavingBulk = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error saving book:', error);
        this.isSavingBulk = false;
        // Optionally show error message
        alert('Failed to save book. Please try again.');
      }
    });
  }

  clearAllBookVerses(): void {
    if (!this.selectedBook) return;
    
    // Optional: Add confirmation
    if (!confirm(`Clear all memorized verses in ${this.selectedBook.name}?`)) {
      return;
    }
    
    this.isSavingBulk = true;
    
    // Use the efficient clear endpoint
    this.bibleService.clearBook(this.userId, this.selectedBook.id).subscribe({
      next: () => {
        // Update local state for all chapters
        this.selectedBook!.chapters.forEach(chapter => {
          chapter.verses.forEach(verse => {
            verse.memorized = false;
            verse.practiceCount = 0;
            verse.lastPracticed = undefined;
          });
        });
        this.isSavingBulk = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error clearing book:', error);
        this.isSavingBulk = false;
        alert('Failed to clear book. Please try again.');
      }
    });
  }

  // Helper methods
  isChapterVisible(chapter: BibleChapter): boolean {
    return this.includeApocrypha || !chapter.isApocryphal;
  }

  getVisibleChapters(book: BibleBook): BibleChapter[] {
    return book.chapters.filter(chapter => this.isChapterVisible(chapter));
  }

  hasApocryphalChapters(book: BibleBook): boolean {
    return book.chapters.some(chapter => chapter.isApocryphal);
  }

  goToSettings(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/profile']);
  }

  getTestamentClass(testament: BibleTestament): string {
    return testament.name === 'Old Testament' ? 'old-testament' : 'new-testament';
  }

  isApocryphalBook(book: BibleBook): boolean {
    return book.canonicalAffiliation !== 'All' &&
      (book.canonicalAffiliation === 'Catholic' ||
        book.canonicalAffiliation === 'Eastern Orthodox');
  }

  // Getters
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