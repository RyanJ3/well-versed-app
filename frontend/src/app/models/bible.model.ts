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
    public readonly testament: BibleTestament,
    public readonly group: BibleGroup,
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
      bookData.testament,
      bookData.group,
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

  get isCompleted(): boolean {
    return this.chapters.every(chapter => chapter.isComplete);
  }

  get percentComplete(): number {
    return this.totalVerses > 0
      ? Math.round((this.memorizedVerses / this.totalVerses) * 100)
      : 0;
  }

  get completedChapters(): number {
    return this.chapters.filter(chapter => chapter.isComplete).length;
  }

  get isInProgress(): boolean {
    return this.chapters.some(chapter => chapter.isInProgress);
  }

  get inProgressChapters(): number {
    return this.chapters.filter(chapter => chapter.isInProgress).length;
  }

  getChapter(chapterNumber: number): BibleChapter {
    if (chapterNumber < 1 || chapterNumber > this.totalChapters) {
      throw new Error(`Chapter ${chapterNumber} not found in book ${this.name}`);
    }
    return this.chapters[chapterNumber - 1];
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

  get memorizedChapters(): number {
    return this.chapters.filter(chapter => chapter.isComplete).length;
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

  getBookByName(name: string): BibleBook {
    const book = this.books.find(book => book.name === name);
    if (!book) {
      throw new Error(`Book ${name} not found in group ${this.name}`);
    }
    return book;
  }

  reset(): void {
    this.books.forEach(book => book.reset());
  }
}

export class BibleTestament {

  public readonly books: BibleBook[];

  constructor(
    public readonly name: 'Old Testament' | 'New Testament',
    public readonly testamentBooks: BibleBook[]
  ) {
    this.books = testamentBooks;
  }

  get groups(): BibleGroup[] {
    const groupMap = new Map<string, BibleGroup>();

    this.books.forEach(book => {
      if (!groupMap.has(book.group.name)) {
        groupMap.set(book.group.name, book.group);
      }
    });

    return Array.from(groupMap.values());
  }

  get bookMap(): Map<string, BibleBook> {
    return new Map(this.books.map(book => [book.name, book]));
  }

  get isOld(): boolean {
    return this.name === TestamentType.OLD;
  }

  get isNew(): boolean {
    return this.name === TestamentType.NEW;
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

  getGroup(name: string): BibleGroup {
    const group = this.groups.find(g => g.name === name);
    if (!group) {
      throw new Error(`Group ${name} not found in testament ${this.name}`);
    }
    return group;
  }

  getBook(name: string): BibleBook {
    const book = this.bookMap.get(name);
    if (!book) {
      throw new Error(`Book ${name} not found in testament ${this.name}`);
    }
    return book;
  }

  reset(): void {
    this.books.forEach(book => book.reset());
  }
}

export class BibleData {
  private readonly testamentMap: Map<string, BibleTestament> = new Map();
  private readonly bookMap: Map<string, BibleBook> = new Map();
  private readonly synonyms: Record<string, string> = {};
  private readonly bookIndex: Record<string, number> = {};
  private readonly books: BibleBook[] = [];

  constructor(progressData: Record<string, Record<number, number[]>> = {}) {
    // Store lookup data
    this.synonyms = Object.fromEntries(
      Object.entries(BIBLE_DATA.synonyms || {}).map(([key, value]) => [key, String(value)])
    );
    this.bookIndex = BIBLE_DATA.bookIndex || {};

    // First, create all group objects
    const groupMap = new Map<string, BibleGroup>();
    BIBLE_DATA.books.forEach((bookData: any) => {
      if (!groupMap.has(bookData.bookGroup)) {
        groupMap.set(bookData.bookGroup, new BibleGroup(bookData.bookGroup as BookGroupType));
      }
    });
    
    // Create temporary testament objects
    const oldTestament = new BibleTestament(TestamentType.OLD, []);
    const newTestament = new BibleTestament(TestamentType.NEW, []);
    
    // Sort books into old and new testament collections
    const oldBooks: BibleBook[] = [];
    const newBooks: BibleBook[] = [];
    
    // Create book objects with proper references
    BIBLE_DATA.books.forEach((bookData: any) => {
      const isOldTestament = bookData.testament === TestamentType.OLD;
      const testament = isOldTestament ? oldTestament : newTestament;
      const group = groupMap.get(bookData.bookGroup);
      
      if (!group) {
        console.error(`Group ${bookData.bookGroup} not found for book ${bookData.name}`);
        return;
      }
      
      const book = new BibleBook(
        bookData.name,
        testament,
        group,
        bookData.chapters,
        progressData[bookData.name] || {},
        bookData.canonicalAffiliation,
        bookData.order
      );
      
      // Add to bookMap and books array
      this.bookMap.set(book.name, book);
      this.books.push(book);
      
      // Add to group's books array
      group.books.push(book);
      
      // Add to the appropriate testament collection
      if (isOldTestament) {
        oldBooks.push(book);
      } else {
        newBooks.push(book);
      }
    });
    
    // Create final testament objects with all books
    const finalOldTestament = new BibleTestament(TestamentType.OLD, oldBooks);
    const finalNewTestament = new BibleTestament(TestamentType.NEW, newBooks);
    
    // Store in the testament map
    this.testamentMap.set('OLD', finalOldTestament);
    this.testamentMap.set('NEW', finalNewTestament);
  }

  get totalChpaters(): number {
    return this.books.reduce((sum, book) => sum + book.totalChapters, 0);
  }

  get testaments(): BibleTestament[] {
    return Array.from(this.testamentMap.values());
  }

  getTestamentByName(name: string): BibleTestament {
    let testament = this.testamentMap.get(name);
    if (testament) {
      return testament;
    }
    throw new Error(`Testament ${name} not found`);
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

  getTestament(name: string): BibleTestament {
    const testament = this.testamentMap.get(name);
    if (!testament) {
      throw new Error(`Testament ${name} not found`);
    }
    return testament;
  }

  getBookByName(name: string): BibleBook {
    const book = this.bookMap.get(name);
    if (!book) {
      throw new Error(`Book ${name} not found`);
    }
    return book;
  }

  markVerseAsMemorized(bookName: string, chapterNumber: number, verseNumber: number): void {
    const book = this.getBookByName(bookName);
    if (book) {
      book.markVerseAsMemorized(chapterNumber, verseNumber);
    }
  }

  toggleVerse(bookName: string, chapterNumber: number, verseNumber: number): boolean {
    const book = this.getBookByName(bookName);
    return book ? book.toggleVerse(chapterNumber, verseNumber) : false;
  }

  reset(): void {
    this.books.forEach(book => book.reset());
  }

  resetBook(bookName: string): void {
    const book = this.getBookByName(bookName);
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
      try {
        const group = testament.getGroup(groupName);
        if (group) {
          group.reset();
        }
      } catch (e) {
        // Group might not exist in this testament, continue
      }
    });
  }

  getGroupByName(groupName: string): BibleGroup {
    for (const testament of this.testaments) {
      try {
        const group = testament.getGroup(groupName as BookGroupType);
        if (group) {
          return group;
        }
      } catch (e) {
        // Group might not exist in this testament, continue
      }
    }
    throw new Error(`Group ${groupName} not found`);
  }
}