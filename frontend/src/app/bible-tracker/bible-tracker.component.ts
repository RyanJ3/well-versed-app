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
  ],
})
export class BibleTrackerComponent {

  private bibleData: BibleData = new BibleData();

  selectedTestament: BibleTestament = this.defaultTestament;
  selectedGroup: BibleGroup = this.defaultGroup;
  selectedBook: BibleBook = this.defaultBook;
  selectedChapter: BibleChapter = this.defaultChapter;

  constructor() { }

  setTestament(testament: BibleTestament): void {
    this.selectedTestament = testament;
  }

  setGroup(group: BibleGroup): void {
    this.selectedGroup = group;
  }

  setBook(book: BibleBook): void {
    this.selectedBook = book;
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
    this.selectedChapter.verses.forEach(verse => verse.memorized = true);
  }

  clearAllVerses() {
    this.selectedChapter.verses.forEach(verse => verse.memorized = false);
  }


}