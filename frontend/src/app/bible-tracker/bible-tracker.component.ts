import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
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
  imports: [CommonModule, RouterModule, DialogsModule, ButtonsModule],
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

  // Dialog properties
  showConfirmDialog = false;
  dialogTitle = '';
  dialogMessage = '';
  dialogDetails = '';
  confirmButtonText = 'Confirm';
  confirmButtonClass = 'k-primary';
  private pendingAction: (() => void) | null = null;

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

  toggleAndSaveVerse(verse: BibleVerse): void {
    verse.toggle();
    this.saveVerse(verse);
  }

  saveVerse(verse: BibleVerse) {
    if (!verse.chapter || !verse.book) {
      console.error('Verse missing required data');
      return;
    }

    // If verse is now memorized, save it; if not, delete it
    if (verse.memorized) {
      const practiceCount = 1;
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
          verse.lastPracticed = new Date();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error saving verse:', error);
          verse.toggle();
          this.cdr.detectChanges();
        }
      });
    } else {
      // Delete the verse - now using separate parameters
      this.bibleService.deleteVerse(
        this.userId,
        verse.book.id,
        verse.chapter.chapterNumber,
        verse.verseNumber
      ).subscribe({
        next: (response) => {
          console.log('Verse deleted successfully');
          verse.practiceCount = 0;
          verse.lastPracticed = undefined;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error deleting verse:', error);
          verse.toggle();
          this.cdr.detectChanges();
        }
      });
    }
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

  // Chapter-level operations
  selectAllVerses(): void {
    if (!this.selectedChapter || !this.selectedBook) return;

    this.isSavingBulk = true;

    this.bibleService.saveChapter(
      this.userId,
      this.selectedBook.id,
      this.selectedChapter.chapterNumber
    ).subscribe({
      next: () => {
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
      }
    });
  }

  clearAllVerses(): void {
    if (!this.selectedChapter || !this.selectedBook) return;

    this.isSavingBulk = true;

    this.bibleService.clearChapter(
      this.userId,
      this.selectedBook.id,
      this.selectedChapter.chapterNumber
    ).subscribe({
      next: () => {
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

  // Book-level operations with confirmation
  selectAllBookVerses(): void {
    if (!this.selectedBook) return;
    
    console.log('selectAllBookVerses called for book:', this.selectedBook.name);

    const totalVerses = this.selectedBook.totalVerses;
    
    // For now, let's use simple confirm to debug
    if (confirm(`Mark all ${totalVerses} verses in ${this.selectedBook.name} as memorized?${totalVerses > 500 ? '\n\nThis is a large book and may take a moment to process.' : ''}`)) {
      console.log('User confirmed, starting book save...');
      this.isSavingBulk = true;
      this.bibleService.saveBook(this.userId, this.selectedBook.id).subscribe({
        next: () => {
          console.log('Book saved successfully');
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
          this.cdr.detectChanges();
        }
      });
    }
  }

  clearAllBookVerses(): void {
    if (!this.selectedBook) return;
    
    console.log('clearAllBookVerses called for book:', this.selectedBook.name);

    if (confirm(`Clear all memorized verses in ${this.selectedBook.name}?\n\nThis action cannot be undone.`)) {
      console.log('User confirmed, starting book clear...');
      this.isSavingBulk = true;
      this.bibleService.clearBook(this.userId, this.selectedBook.id).subscribe({
        next: () => {
          console.log('Book cleared successfully');
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
          this.cdr.detectChanges();
        }
      });
    }
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