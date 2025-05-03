// bible-tracker.component.ts - Main component for the Bible Memorization Tracker
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TestamentSelectorComponent } from './components/testament-selector/testament-selector.component';
import { GroupSelectorComponent } from './components/group-selector/group-selector.component';
import { BookSelectorComponent } from './components/book-selector/book-selector.component';
import { ChapterSelectorComponent } from './components/chapter-selector/chapter-selector.component';
import { ChapterProgressComponent } from './components/chapter-progress/chapter-progress.component';
import { BookInfoComponent } from './components/book-info/book-info.component';
import { BibleService } from '../services/bible.service';
import { BibleBook, BibleChapter, BookGroupType, TestamentType } from '../models/bible.model';
import { BaseBibleComponent } from './base-bible.component';

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
export class BibleTrackerComponent extends BaseBibleComponent implements OnInit, OnDestroy {
  // Data sources
  testaments: TestamentType[] = [];
  availableGroups: BookGroupType[] = [];
  booksInGroup: BibleBook[] = [];

  // Selection state - only maintain one reference to each 
  selectedTestament: TestamentType = TestamentType.OLD;
  selectedGroup: BookGroupType = BookGroupType.WISDOM;
  
  // Main model objects - these contain all the stats
  selectedBook?: BibleBook;
  selectedChapter?: BibleChapter;
  currentBook: BibleBook|undefined;

  constructor(bibleService: BibleService) {
    super(bibleService);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    
    // Initialize default selections when data is loaded
    this.onTestamentChange(this.selectedTestament);
  }

  onTestamentChange(testament: TestamentType): void {
    this.selectedTestament = testament;
    this.availableGroups = this.bibleService.getGroupsInTestament(testament);
    
    if (this.availableGroups.length > 0) {
      this.onGroupChange(this.availableGroups[0]);
    }
  }

  onGroupChange(group: BookGroupType): void {
    this.selectedGroup = group;
    this.booksInGroup = this.bibleService.getBooksInGroup(group);
    
    if (this.booksInGroup.length > 0) {
      this.onBookChange(this.booksInGroup[0].name);
    }
  }

  onBookChange(bookName: string): void {
    this.selectedBook = this.getBook(bookName);
    
    // Select first chapter of the book
    if (this.selectedBook && this.selectedBook.chapters.length > 0) {
      this.onChapterSelect(this.selectedBook.chapters[0]);
    }
  }

  onChapterSelect(chapter: BibleChapter): void {
    this.selectedChapter = chapter;
  }

  // Stats access methods that use the main model objects
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
    const testamentObj = this.getTestament(testament);
    return { 
      percentComplete: testamentObj?.percentComplete || 0 
    };
  }

  // Reset methods
  resetChapter(): void {
    if (this.selectedChapter) {
      // this.selectedChapter.resetProgress();
      this.bibleService.saveProgress();
    }
  }

  resetBook(): void {
    if (this.selectedBook) {
      // this.currentBook.resetProgress();
      this.bibleService.saveProgress();
    }
  }

  resetGroup(): void {
    this.bibleService.resetGroup(this.selectedGroup);
  }

  resetTestament(): void {
    this.bibleService.resetTestament(this.selectedTestament);
  }
  
  // Convenience getters for the template
  get memorizedVerses(): number {
    return this.selectedBook?.memorizedVerses || 0;
  }
  
  get totalVerses(): number {
    return this.selectedBook?.totalVerses || 0;
  }
  
  get completedChapters(): number {
    return this.selectedBook?.completedChapters || 0;
  }
  
  get inProgressChapters(): number {
    return this.selectedBook?.inProgressChapters || 0;
  }
  
  get selectedChapterVerses(): number {
    return this.selectedChapter?.totalVerses || 0;
  }
  
  get selectedChapterMemorized(): number {
    return this.selectedChapter?.memorizedVerses || 0;
  }
}