// bible-tracker.component.ts - Main component for the Bible Memorization Tracker
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TestamentSelectorComponent } from './components/testament-selector/testament-selector.component';
import { GroupSelectorComponent } from './components/group-selector/group-selector.component';
import { BookSelectorComponent } from './components/book-selector/book-selector.component';
import { ChapterSelectorComponent } from './components/chapter-selector/chapter-selector.component';
import { ChapterProgressComponent } from './components/chapter-progress/chapter-progress.component';
import { BookInfoComponent } from './components/book-info/book-info.component';
import { BibleService } from '../services/bible.service';
import { BibleBook, BibleChapter, BibleGroup, BibleTestament, BookGroupType, TestamentType } from '../models/bible.model';
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
export class BibleTrackerComponent extends BaseBibleComponent implements OnDestroy {
  // Data sources
  testaments: BibleTestament[] = [];
  booksInGroup: BibleBook[] = [];

  // Selection state - only maintain one reference to each 
  selectedTestament: BibleTestament | undefined;;
  selectedGroup: BibleGroup | undefined;
  
  // Main model objects - these contain all the stats
  selectedBook?: BibleBook;
  selectedChapter?: BibleChapter;
  currentBook: BibleBook|undefined;

  constructor() {
    super();
  }

  // override ngOnInit(): void {
  //   super.ngOnInit();
    
  //   // Initialize default selections when data is loaded
  //   this.onTestamentChange(this.selectedTestament);
  // }

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

}