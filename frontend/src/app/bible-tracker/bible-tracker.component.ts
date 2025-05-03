// bible-tracker.component.ts - Main component for the Bible Memorization Tracker
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TestamentSelectorComponent } from './components/testament-selector/testament-selector.component';
import { GroupSelectorComponent } from './components/group-selector/group-selector.component';
import { BookSelectorComponent } from './components/book-selector/book-selector.component';
import { ChapterSelectorComponent } from './components/chapter-selector/chapter-selector.component';
import { ChapterProgressComponent } from './components/chapter-progress/chapter-progress.component';
import { BookInfoComponent } from './components/book-info/book-info.component';
import { BibleService } from '../services/bible.service';
import { BibleBook, BookGroupType, TestamentType } from '../models/bible.model';

@Component({
  selector: 'app-bible-tracker',
  templateUrl: './bible-tracker.component.html',
  imports: [
    TestamentSelectorComponent,
    GroupSelectorComponent,
    BookSelectorComponent,
    BookInfoComponent,
    ChapterSelectorComponent,
    ChapterProgressComponent,
  ],
  styleUrls: ['./bible-tracker.component.css'],
})
export class BibleTrackerComponent implements OnInit, OnDestroy {
  // Data sources
  testaments: TestamentType[] = [];
  availableGroups: BookGroupType[] = [];
  booksInGroup: BibleBook[] = [];

  // Selection state
  selectedTestament: TestamentType = TestamentType.OLD;
  selectedGroup: BookGroupType = BookGroupType.WISDOM;
  selectedBook: string = 'Psalms';
  selectedChapter: number = 1;

  // Current book data
  currentBook?: BibleBook;

  // Selected chapter data
  selectedChapterIndex: number = 0;
  selectedChapterVerses: number = 0;
  selectedChapterMemorized: number = 0;

  // Book statistics
  memorizedVerses: number = 0;
  totalVerses: number = 0;
  completedChapters: number = 0;
  inProgressChapters: number = 0;

  private destroy$ = new Subject<void>();

  constructor(private bibleService: BibleService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTestamentChange(testament: TestamentType): void {
    this.selectedTestament = testament;

    // Get available groups for this testament
    this.availableGroups = this.bibleService.getGroupsInTestament(testament);

    // Select first group in the testament
    if (this.availableGroups.length > 0) {
      this.onGroupChange(this.availableGroups[0]);
    }
  }

  onBookChange(bookName: string): void {
    this.selectedBook = bookName;
    this.selectedChapter = 1;
    this.updateSelections();
  }

  onChapterSelect(chapterNumber: number): void {
    this.selectedChapter = chapterNumber;
    this.updateSelections();
  }

  getGroupStats(group: BookGroupType): {
    percentComplete: number;
    memorizedVerses: number;
    totalVerses: number;
  } {
    const groupObj = this.bibleService.getBible()?.testaments
      .flatMap(t => t.groups)
      .find(g => g.name === group);
      
    return {
      percentComplete: groupObj?.percentComplete || 0,
      memorizedVerses: groupObj?.memorizedVerses || 0,
      totalVerses: groupObj?.totalVerses || 0
    };
  }

  getTestamentStats(testament: TestamentType): { percentComplete: number } {
    return this.bibleService.calculateTestamentStats(testament);
  }

  getBookStats(bookName: string): number {
    const book = this.bibleService.getBook(bookName);
    return book?.percentComplete || 0;
  }

  resetChapter(): void {
    const book = this.bibleService.getBook(this.selectedBook);
    const chapter = book?.getChapter(this.selectedChapter);
    if (chapter) {
      chapter.reset();
      this.bibleService.saveProgress();
      this.updateBookStatistics();
    }
  }

  resetBook(): void {
    this.bibleService.resetBook(this.selectedBook);
    this.updateBookStatistics();
  }

  resetGroup(): void {
    this.bibleService.resetGroup(this.selectedGroup);
    this.updateBookStatistics();
  }

  resetTestament(): void {
    this.bibleService.resetTestament(this.selectedTestament);
    this.updateBookStatistics();
  }

  createArray(length: number): any[] {
    return Array(length).fill(null);
  }

  trackByFn(index: number): number {
    return index;
  }

  onGroupChange(group: BookGroupType): void {
    this.selectedGroup = group;

    // Get books in this group
    this.booksInGroup = this.bibleService.getBooksInGroup(group);

    // If we have books, select the first one
    if (this.booksInGroup.length > 0) {
      this.onBookChange(this.booksInGroup[0].name);
    }
  }

  updateMemorizedVerses(selectedVerses: number[]): void {
    selectedVerses.forEach(verse => {
      this.bibleService.markVerseAsMemorized(
        this.selectedBook,
        this.selectedChapter,
        verse
      );
    });

    // Force an immediate update of book statistics
    this.updateBookStatistics();
  }

  ngOnInit(): void {
    // Subscribe to Bible data changes
    this.bibleService.bible$
      .pipe(takeUntil(this.destroy$))
      .subscribe((bible) => {
        if (bible) {
          // Get testaments and ensure they're in the right order
          this.testaments = bible.getTestamentNames().sort((a, b) => {
            // Make sure Old Testament comes before New Testament
            if (a === TestamentType.OLD && b === TestamentType.NEW) return -1;
            if (a === TestamentType.NEW && b === TestamentType.OLD) return 1;
            return 0;
          });
          
          this.updateSelections();
          this.updateBookStatistics();
        }
      });

    // Set initial selections once Bible is loaded
    this.bibleService.bible$.subscribe(bible => {
      if (bible) {
        this.onTestamentChange(this.selectedTestament);
      }
    });
  }

  private updateSelections(): void {
    // Update available groups
    this.availableGroups = this.bibleService.getGroupsInTestament(
      this.selectedTestament
    );

    // Update books in selected group
    this.booksInGroup = this.bibleService.getBooksInGroup(
      this.selectedGroup
    );

    // Update current book
    this.currentBook = this.bibleService.getBook(this.selectedBook);

    // Update selected chapter data
    this.selectedChapterIndex = this.selectedChapter - 1;
    
    if (this.currentBook) {
      const chapter = this.currentBook.getChapter(this.selectedChapter);
      if (chapter) {
        this.selectedChapterVerses = chapter.totalVerses;
        this.selectedChapterMemorized = chapter.memorizedVerses;
      } else {
        this.selectedChapterVerses = 0;
        this.selectedChapterMemorized = 0;
      }
    } else {
      this.selectedChapterVerses = 0;
      this.selectedChapterMemorized = 0;
    }
  }

  private updateBookStatistics(): void {
    if (this.currentBook) {
      this.memorizedVerses = this.currentBook.memorizedVerses;
      this.totalVerses = this.currentBook.totalVerses;
      this.completedChapters = this.currentBook.completedChapters;
      this.inProgressChapters = this.currentBook.inProgressChapters;
    } else {
      this.memorizedVerses = 0;
      this.totalVerses = 0;
      this.completedChapters = 0;
      this.inProgressChapters = 0;
    }
  }
}