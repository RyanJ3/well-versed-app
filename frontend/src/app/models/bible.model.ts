import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import BIBLE_DATA from './../bible-tracker/bible_base_data.json'
// Enums for type safety
export enum TestamentType {
  OLD = 'Old Testament',
  NEW = 'New Testament'
}

export enum BookGroupType {
  LAW = 'Law',
  HISTORY = 'History',
  WISDOM = 'Wisdom',
  PROPHETS = 'Prophets',
  GOSPELS = 'Gospels',
  ACTS = 'Acts',
  PAULINE = 'Pauline Epistles',
  GENERAL = 'General Epistles',
  APOCALYPTIC = 'Apocalyptic'
}

// Model classes that integrate structure and progress
export class BibleVerse {
  constructor(
    public readonly verseNumber: number,
    public memorized: boolean = false
  ) { }

  toggle(): boolean {
    this.memorized = !this.memorized;
    return this.memorized;
  }
}

export class BibleChapter {
  public readonly verses: BibleVerse[];

  constructor(
    public readonly chapterNumber: number,
    totalVerses: number,
    memorizedVerses: number[] = []
  ) {
    // Create verses with proper memorization status
    this.verses = Array.from({ length: totalVerses }, (_, i) =>
      new BibleVerse(i + 1, memorizedVerses.includes(i + 1))
    );
  }

  get totalVerses(): number {
    return this.verses.length;
  }

  get memorizedVerses(): number {
    return this.verses.filter(v => v.memorized).length;
  }

  get percentComplete(): number {
    return this.totalVerses > 0
      ? Math.round((this.memorizedVerses / this.totalVerses) * 100)
      : 0;
  }

  get isComplete(): boolean {
    return this.percentComplete === 100;
  }

  get isInProgress(): boolean {
    return this.memorizedVerses > 0 && !this.isComplete;
  }

  markVerseAsMemorized(verseNumber: number): void {
    const verse = this.verses.find(v => v.verseNumber === verseNumber);
    if (verse) {
      verse.memorized = true;
    }
  }

  toggleVerse(verseNumber: number): boolean {
    const verse = this.verses.find(v => v.verseNumber === verseNumber);
    return verse ? verse.toggle() : false;
  }

  getMemorizedVerseNumbers(): number[] {
    return this.verses
      .filter(verse => verse.memorized)
      .map(verse => verse.verseNumber);
  }

  get remainingVerses(): number[] {
    return this.verses
      .filter(verse => !verse.memorized)
      .map(verse => verse.verseNumber);
  }

  markAllVersesAsMemorized(): void {
    this.verses.forEach(verse => verse.memorized = true);
  }

  reset(): void {
    this.verses.forEach(verse => verse.memorized = false);
  }
}

export class BibleBook {
  public readonly chapters: BibleChapter[];

  constructor(
    public readonly name: string,
    public readonly testament: TestamentType,
    public readonly group: BookGroupType,
    versesPerChapter: number[],
    memorizedData: Record<number, number[]> = {},
    public readonly canonicalAffiliation: string = 'Canonical',
    public readonly order: number = 0
  ) {
    // Create chapters with memorization data
    this.chapters = versesPerChapter.map((verseCount, idx) => {
      const chapterNumber = idx + 1;
      return new BibleChapter(
        chapterNumber,
        verseCount,
        memorizedData[chapterNumber] || []
      );
    });
  }

  // Static factory method for creating from raw data
  public static fromRawData(bookData: any): BibleBook {
    return new BibleBook(
      bookData.name,
      bookData.testament as TestamentType,
      bookData.group as BookGroupType,
      bookData.chapters,
      {}, // No progress data for new books
      bookData.canonicalAffiliation,
      bookData.order
    );
  }

  get totalChapters(): number {
    return this.chapters.length;
  }

  get totalVerses(): number {
    return this.chapters.reduce((sum, chapter) => sum + chapter.totalVerses, 0);
  }

  get memorizedVerses(): number {
    return this.chapters.reduce((sum, chapter) => sum + chapter.memorizedVerses, 0);
  }

  get percentComplete(): number {
    return this.totalVerses > 0
      ? Math.round((this.memorizedVerses / this.totalVerses) * 100)
      : 0;
  }

  get completedChapters(): number {
    return this.chapters.filter(chapter => chapter.isComplete).length;
  }

  get inProgressChapters(): number {
    return this.chapters.filter(chapter => chapter.isInProgress).length;
  }

  getChapter(chapterNumber: number): BibleChapter | undefined {
    return this.chapters.find(c => c.chapterNumber === chapterNumber);
  }

  markVerseAsMemorized(chapterNumber: number, verseNumber: number): void {
    const chapter = this.getChapter(chapterNumber);
    if (chapter) {
      chapter.markVerseAsMemorized(verseNumber);
    }
  }

  toggleVerse(chapterNumber: number, verseNumber: number): boolean {
    const chapter = this.getChapter(chapterNumber);
    return chapter ? chapter.toggleVerse(verseNumber) : false;
  }

  reset(): void {
    this.chapters.forEach(chapter => chapter.reset());
  }

  getProgressData(): Record<number, number[]> {
    const result: Record<number, number[]> = {};

    this.chapters.forEach(chapter => {
      const memorizedVerses = chapter.getMemorizedVerseNumbers();
      if (memorizedVerses.length > 0) {
        result[chapter.chapterNumber] = memorizedVerses;
      }
    });

    return result;
  }
}

export class BibleGroup {
  constructor(
    public readonly name: BookGroupType,
    public readonly books: BibleBook[] = []
  ) { }

  get totalBooks(): number {
    return this.books.length;
  }

  get totalChapters(): number {
    return this.books.reduce((sum, book) => sum + book.totalChapters, 0);
  }

  get totalVerses(): number {
    return this.books.reduce((sum, book) => sum + book.totalVerses, 0);
  }

  get memorizedVerses(): number {
    return this.books.reduce((sum, book) => sum + book.memorizedVerses, 0);
  }

  get percentComplete(): number {
    return this.totalVerses > 0
      ? Math.round((this.memorizedVerses / this.totalVerses) * 100)
      : 0;
  }

  get completedBooks(): number {
    return this.books.filter(book => book.percentComplete === 100).length;
  }

  getBook(name: string): BibleBook | undefined {
    return this.books.find(book => book.name === name);
  }

  reset(): void {
    this.books.forEach(book => book.reset());
  }
}

export class BibleTestament {
  public readonly groups: BibleGroup[] = [];
  public readonly bookMap: Map<string, BibleBook> = new Map();
  public readonly _books;

  constructor(
    public readonly name: TestamentType,
    public readonly testamentBooks: BibleBook[]
  ) {
    this._books = testamentBooks;
    // Organize books into groups
    const groupMap = new Map<BookGroupType, BibleBook[]>();

    // Create group objects
    groupMap.forEach((groupBooks, groupName) => {
      this.groups.push(new BibleGroup(groupName, groupBooks));
    });
  }

  get books(): BibleBook[] {
    return this._books;
  }

  get totalBooks(): number {
    return this.bookMap.size;
  }

  get totalChapters(): number {
    return this.books.reduce((sum, book) => sum + book.totalChapters, 0);
  }

  get totalVerses(): number {
    return this.books.reduce((sum, book) => sum + book.totalVerses, 0);
  }

  get memorizedVerses(): number {
    return this.books.reduce((sum, book) => sum + book.memorizedVerses, 0);
  }

  get percentComplete(): number {
    return this.totalVerses > 0
      ? Math.round((this.memorizedVerses / this.totalVerses) * 100)
      : 0;
  }

  getGroupNames(): BookGroupType[] {
    return this.groups.map(group => group.name);
  }

  getGroup(name: BookGroupType): BibleGroup | undefined {
    return this.groups.find(group => group.name === name);
  }

  getBook(name: string): BibleBook | undefined {
    return this.bookMap.get(name);
  }

  getBooksInGroup(groupName: BookGroupType): BibleBook[] {
    const group = this.getGroup(groupName);
    return group ? group.books : [];
  }

  reset(): void {
    this.books.forEach(book => book.reset());
  }
}

export class BibleData {

  private readonly testamentMap: Map<TestamentType, BibleTestament> = new Map();
  private readonly bookMap: Map<string, BibleBook> = new Map();
  private readonly synonyms: Record<string, string> = {};
  private readonly bookIndex: Record<string, number> = {};

  constructor(progressData: Record<string, Record<number, number[]>> = {}) {
    // Process the Bible data and create the object hierarchy
    const oldTestamentBooks: BibleBook[] = [];
    const newTestamentBooks: BibleBook[] = [];

    // Store lookup data
    this.synonyms = Object.fromEntries(
      Object.entries(BIBLE_DATA.synonyms || {}).map(([key, value]) => [key, String(value)])
    );
    this.bookIndex = BIBLE_DATA.bookIndex || {};

    // Create book objects with progress data
    BIBLE_DATA.books.forEach((bookData: any) => {
      const book = new BibleBook(
        bookData.name,
        bookData.testament as TestamentType,
        bookData.group as BookGroupType,
        bookData.chapters,
        progressData[bookData.name] || {},
        bookData.canonicalAffiliation,
        bookData.order
      );

      // Add to bookMap for direct access
      this.bookMap.set(book.name, book);

      // Add to appropriate testament array
      if (book.testament === TestamentType.OLD) {
        oldTestamentBooks.push(book);
      } else {
        newTestamentBooks.push(book);
      }
    });

    // Create testament objects
    this.testamentMap.set(TestamentType.OLD, new BibleTestament(TestamentType.OLD, oldTestamentBooks));
    this.testamentMap.set(TestamentType.NEW, new BibleTestament(TestamentType.NEW, newTestamentBooks));
  }

  get testaments(): BibleTestament[] {
    return Array.from(this.testamentMap.values());
  }

  getTestamentByName(name: TestamentType): BibleTestament | undefined {
    return this.testamentMap.get(name);
  }


  get books(): BibleBook[] {
    return Array.from(this.bookMap.values());
  }

  get totalBooks(): number {
    return this.bookMap.size;
  }

  get totalVerses(): number {
    return this.testaments.reduce((sum, testament) => sum + testament.totalVerses, 0);
  }

  get memorizedVerses(): number {
    return this.testaments.reduce((sum, testament) => sum + testament.memorizedVerses, 0);
  }

  get percentComplete(): number {
    return this.totalVerses > 0
      ? Math.round((this.memorizedVerses / this.totalVerses) * 100)
      : 0;
  }

  getTestamentNames(): TestamentType[] {
    return Array.from(this.testamentMap.keys());
  }

  getTestament(name: TestamentType): BibleTestament | undefined {
    return this.testamentMap.get(name);
  }

  getBook(name: string): BibleBook | undefined {
    // Direct lookup first (fastest)
    const book = this.bookMap.get(name);
    if (book) return book;

    // Try case insensitive lookup
    const lowercaseName = name.toLowerCase();
    for (const [bookName, book] of this.bookMap.entries()) {
      if (bookName.toLowerCase() === lowercaseName) {
        return book;
      }
    }

    // Try synonyms
    if (this.synonyms[name]) {
      const synonymBook = this.getBook(this.synonyms[name]);
      if (synonymBook) return synonymBook;
    }

    // Try bookIndex
    const bookIndex = this.bookIndex[name];
    if (bookIndex !== undefined) {
      const bookByIndex = this.books.find(b => b.order === bookIndex);
      if (bookByIndex) return bookByIndex;
    }

    return undefined;
  }

  getGroupsInTestament(testamentName: TestamentType): BookGroupType[] {
    const testament = this.getTestament(testamentName);
    return testament ? testament.getGroupNames() : [];
  }

  markVerseAsMemorized(bookName: string, chapterNumber: number, verseNumber: number): void {
    const book = this.getBook(bookName);
    if (book) {
      book.markVerseAsMemorized(chapterNumber, verseNumber);
    }
  }

  toggleVerse(bookName: string, chapterNumber: number, verseNumber: number): boolean {
    const book = this.getBook(bookName);
    return book ? book.toggleVerse(chapterNumber, verseNumber) : false;
  }

  reset(): void {
    this.books.forEach(book => book.reset());
  }

  resetBook(bookName: string): void {
    const book = this.getBook(bookName);
    if (book) {
      book.reset();
    }
  }

  resetTestament(testamentName: TestamentType): void {
    const testament = this.getTestament(testamentName);
    if (testament) {
      testament.reset();
    }
  }

  resetGroup(groupName: BookGroupType): void {
    this.testaments.forEach(testament => {
      const group = testament.getGroup(groupName);
      if (group) {
        group.reset();
      }
    });
  }

  getProgressData(): Record<string, Record<number, number[]>> {
    const result: Record<string, Record<number, number[]>> = {};

    this.books.forEach(book => {
      const bookProgress = book.getProgressData();
      if (Object.keys(bookProgress).length > 0) {
        result[book.name] = bookProgress;
      }
    });

    return result;
  }


  getGroupByName(groupName : string): BibleGroup | undefined {
    for (const testament of this.testaments) {
      const group = testament.getGroup(groupName as BookGroupType);
      if (group) {
        return group;
      }
    }
    return undefined;
  }

}
