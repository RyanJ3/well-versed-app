// bible-tracker.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleService } from '../services/bible.service';
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
  userId = 1;

  constructor(
    private bibleService: BibleService,
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
    this.loadUserVerses();
  }

  loadUserVerses() {
    this.isLoading = true;

    this.bibleService.getUserVerses(this.userId).subscribe(
      (verses) => {
        this.userVerses = verses;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading verses:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
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
    ).subscribe(
      (response) => {
        console.log('Save verse response:', response);
        // Update local model
        verse.practiceCount = practiceCount;
        verse.lastPracticed = new Date();
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error saving verse:', error);
      }
    );
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

  isSavingBulk = false;

  saveBulkVerses(chapter: BibleChapter, isMemorized: boolean): void {
    if (!chapter || !chapter.book) return;

    this.isSavingBulk = true; // Start loading
    const verseNums = Array.from({ length: chapter.verses.length }, (_, i) => i + 1);
    const practiceCount = isMemorized ? 1 : 0;

    this.bibleService.saveVersesBulk(
      this.userId, chapter.book.id, chapter.chapterNumber, verseNums, practiceCount
    ).subscribe({
      next: (response) => {
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
        this.cdr.detectChanges();
      }
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