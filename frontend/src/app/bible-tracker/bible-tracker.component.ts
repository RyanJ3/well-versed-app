// frontend/src/app/bible-tracker/bible-tracker.component.ts
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { Subscription } from 'rxjs';
import { BibleBook, BibleChapter, BibleData, BibleTestament, UserVerseDetail } from '../core/models/bible';
import { BibleGroup } from '../core/models/bible/bible-group.modle';
import { BibleService } from '../core/services/bible.service';
import { UserService } from '../core/services/user.service';
import { BibleVerse } from '../core/models/bible/bible-verse.model';
import { ModalService } from '../core/services/modal.service';

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

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private modalService: ModalService,
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
        this.modalService.alert(
          'Error Loading Verses',
          'Unable to load your saved verses. Please check your connection and try again.',
          'danger'
        );
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
          this.modalService.alert(
            'Error Saving Verse',
            'Unable to save this verse. Please try again.',
            'danger'
          );
          this.cdr.detectChanges();
        }
      });
    } else {
      // Delete the verse
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
          this.modalService.alert(
            'Error Removing Verse',
            'Unable to remove this verse. Please try again.',
            'danger'
          );
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
        this.modalService.success(
          'Chapter Saved',
          `All verses in ${this.selectedBook!.name} ${this.selectedChapter!.chapterNumber} have been marked as memorized.`
        );
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error saving chapter:', error);
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Saving Chapter',
          'Unable to save all verses in this chapter. Please try again.',
          'danger'
        );
      }
    });
  }

  async clearAllVerses(): Promise<void> {
    if (!this.selectedChapter || !this.selectedBook) return;

    const confirmed = await this.modalService.danger(
      'Clear All Verses?',
      `Are you sure you want to clear all memorized verses in ${this.selectedBook.name} ${this.selectedChapter.chapterNumber}? This action cannot be undone.`,
      'Clear Verses'
    );

    if (!confirmed) return;

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
        this.modalService.success(
          'Chapter Cleared',
          `All verses in ${this.selectedBook!.name} ${this.selectedChapter!.chapterNumber} have been cleared.`
        );
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error clearing chapter:', error);
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Clearing Chapter',
          'Unable to clear verses in this chapter. Please try again.',
          'danger'
        );
      }
    });
  }

  // Book-level operations with confirmation modals
  async selectAllBookVerses(): Promise<void> {
    if (!this.selectedBook) return;
    
    const totalVerses = this.selectedBook.totalVerses;
    const message = totalVerses > 500 
      ? `Mark all ${totalVerses} verses in ${this.selectedBook.name} as memorized? This is a large book and may take a moment to process.`
      : `Mark all ${totalVerses} verses in ${this.selectedBook.name} as memorized?`;
    
    const confirmed = await this.modalService.confirm({
      title: 'Memorize Entire Book',
      message,
      confirmText: 'Memorize Book',
      type: 'info'
    });

    if (!confirmed.confirmed) return;

    this.isSavingBulk = true;
    this.bibleService.saveBook(this.userId, this.selectedBook.id).subscribe({
      next: () => {
        this.selectedBook!.chapters.forEach(chapter => {
          chapter.verses.forEach(verse => {
            verse.memorized = true;
            verse.practiceCount = 1;
            verse.lastPracticed = new Date();
          });
        });
        this.isSavingBulk = false;
        this.modalService.success(
          'Book Saved',
          `All verses in ${this.selectedBook!.name} have been marked as memorized!`
        );
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error saving book:', error);
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Saving Book',
          'Unable to save all verses in this book. Please try again.',
          'danger'
        );
        this.cdr.detectChanges();
      }
    });
  }

  async clearAllBookVerses(): Promise<void> {
    if (!this.selectedBook) return;

    const confirmed = await this.modalService.danger(
      'Clear Entire Book?',
      `Are you sure you want to clear all memorized verses in ${this.selectedBook.name}? This action cannot be undone.`,
      'Clear Book'
    );

    if (!confirmed) return;

    this.isSavingBulk = true;
    this.bibleService.clearBook(this.userId, this.selectedBook.id).subscribe({
      next: () => {
        this.selectedBook!.chapters.forEach(chapter => {
          chapter.verses.forEach(verse => {
            verse.memorized = false;
            verse.practiceCount = 0;
            verse.lastPracticed = undefined;
          });
        });
        this.isSavingBulk = false;
        this.modalService.success(
          'Book Cleared',
          `All verses in ${this.selectedBook!.name} have been cleared.`
        );
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error clearing book:', error);
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Clearing Book',
          'Unable to clear verses in this book. Please try again.',
          'danger'
        );
        this.cdr.detectChanges();
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

  get totalVerses(): number {
    return this.bibleData.totalVerses;
  }

  get memorizedVerses(): number {
    return this.bibleData.memorizedVerses;
  }
}