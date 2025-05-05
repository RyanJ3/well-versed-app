// bible-tracker.component.ts - Main component for the Bible Memorization Tracker
import { Component, Input } from '@angular/core';
import { BibleBook, BibleChapter, BibleData, BibleGroup, BibleTestament } from "../models/bible.model";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bible-tracker',
  templateUrl: './bible-tracker.component.html',
  imports: [CommonModule],
  styleUrls: [
    './bible-tracker.component.scss',
    './style-sheets/book-selector.scss',
    './style-sheets/chapter-selector.scss',
    './style-sheets/verse-selector.scss',
    './style-sheets/group-selector.scss',
    './style-sheets/testament-selector.scss',
    './style-sheets/shared-bubble.scss',
    './bible-tracker.component.scss'
  ],
})
export class BibleTrackerComponent {

  private bibleData: BibleData = new BibleData();

  selectedTestament: BibleTestament | null = null;
  selectedGroup: BibleGroup | null = null;
  selectedBook: BibleBook | null = null;
  selectedChapter: BibleChapter | null = null;

  constructor() { 
    // Initialize with default testament on component creation
    this.selectedTestament = this.defaultTestament;
    // Set default group from the selected testament
    if (this.selectedTestament && this.selectedTestament.groups.length > 0) {
      this.setGroup(this.defaultGroup);
    }
  }

  setTestament(testament: BibleTestament): void {
    this.selectedTestament = testament;
    // Reset child selections to appropriate defaults from the new testament
    if (testament.groups.length > 0) {
      this.setGroup(testament.groups[0]); // Set first group of the testament
    } else {
      this.selectedGroup = null;
      this.selectedBook = null;
      this.selectedChapter = null;
    }
  }

  setGroup(group: BibleGroup): void {
    this.selectedGroup = group;
    // Reset child selections to appropriate defaults from the new group
    if (group.books.length > 0) {
      this.setBook(group.books[0]); // Set first book of the group
    } else {
      this.selectedBook = null;
      this.selectedChapter = null;
    }
  }

  setBook(book: BibleBook): void {
    this.selectedBook = book;
    // Reset child selections to appropriate defaults from the new book
    if (book.chapters.length > 0) {
      this.setChapter(book.chapters[0]); // Set first chapter of the book
    } else {
      this.selectedChapter = null;
    }
  }

  setChapter(chapter: BibleChapter): void {
    this.selectedChapter = chapter;
  }

  // Convenience methods for accessing Bible data
  getTestamentByName(testamentName: string): BibleTestament {
    return this.bibleData.getTestamentByName(testamentName);
  }

  getGroupByName(groupName: string): BibleBook[] {
    return this.bibleData.getGroupByName(groupName).books;
  }

  getBookByName(bookName: string): BibleBook {
    return this.bibleData.getBookByName(bookName);
  }

  get oldTestament(): BibleTestament {
    return this.getTestamentByName('OLD');
  }

  get newTestament(): BibleTestament {
    return this.getTestamentByName('NEW');
  }

  get defaultTestament(): BibleTestament {
    return this.oldTestament;
  }

  get testaments(): BibleTestament[] {
    return [this.oldTestament, this.newTestament];
  }

  get percentComplete(): number {
    return this.bibleData.percentComplete;
  }

  get defaultGroup(): BibleGroup {
    return this.defaultBook.group;
  }

  get defaultBook(): BibleBook {
    return this.getBookByName("Psalms");
  }

  get defaultChapter(): BibleChapter {
    return this.getBookByName("Psalms").chapters[22];
  }

  selectAllVerses() {
    if (this.selectedChapter) {
      this.selectedChapter.verses.forEach(verse => verse.memorized = true);
    }
  }

  clearAllVerses() {
    if (this.selectedChapter) {
      this.selectedChapter.verses.forEach(verse => verse.memorized = false);
    }
  }
}