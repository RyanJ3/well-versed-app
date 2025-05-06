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

  saveVerse(verse: BibleVerse, confidence: number) {
    if (!verse.chapter || !verse.book) {
      console.error('Cannot save verse without proper hierarchy');
      return;
    }
    
    this.bibleService.saveVerse(
      this.userId,
      verse.book.id,
      verse.chapter.chapterNumber,
      verse.verseNumber,
      confidence
    ).subscribe(() => {
      // Update local model
      verse.confidence = confidence;
      verse.memorized = confidence >= 500;
      verse.lastPracticed = new Date();
      verse.practiceCount++;
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

  selectAllVerses() {
    if (this.selectedChapter) {
      this.selectedChapter.selectAllVerses();
      this.cdr.detectChanges();
    }
  }

  clearAllVerses() {
    if (this.selectedChapter) {
      this.selectedChapter.clearAllVerses();
      this.cdr.detectChanges();
    }
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 800) return 'high-confidence';
    if (confidence >= 500) return 'medium-confidence';
    return 'low-confidence';
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
    return this.bibleData.getBookByName("Psalms");
  }

  get percentComplete(): number {
    return this.bibleData.percentComplete;
  }
}