import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TestamentType, BookGroupType, BibleBook, BibleGroup, BibleData, BibleTestament } from '../models/bible.model';

@Injectable({
  providedIn: 'root',
})
export class BibleService {

    private bible!: BibleData;
  
  private apiUrl = 'http://localhost:8000/api';
  private userId = 1;

  constructor(private http: HttpClient) {
    this.initializeBible();
  }

  private initializeBible(): void {
   // todo initialize bible data
  }

  // Core data access methods
  getBible(): BibleData {
    return this.bible;
  }

  getTestaments(): TestamentType[] {
    return this.bible?.getTestamentNames() || [];
  }

  getTestament(testament: TestamentType): BibleTestament | undefined {
    return this.bible.getTestamentByName(testament);
  }

  getGroupsInTestament(testament: TestamentType): BookGroupType[] {
    return this.bible?.getGroupsInTestament(testament) || [];
  }

  getBooksInGroup(group: BookGroupType): BibleBook[] {
    return this.bible?.getGroupByName(group)?.books || [];
  }

  getBook(name: string): BibleBook | undefined {
    return this.bible?.getBook(name);
  }

  // Progress-related methods
  markVerseAsMemorized(bookName: string, chapterNumber: number, verseNumber: number): void {
    if (this.bible) {
      this.bible.markVerseAsMemorized(bookName, chapterNumber, verseNumber);
      this.saveProgress();
    }
  }

  toggleVerse(bookName: string, chapterNumber: number, verseNumber: number): boolean {
    if (this.bible) {
      const result = this.bible.toggleVerse(bookName, chapterNumber, verseNumber);
      this.saveProgress();
      return result;
    }
    return false;
  }

  updateMemorizedVerses(bookName: string, chapterNumber: number, verses: number[]): void {
    verses.forEach(verse => this.markVerseAsMemorized(bookName, chapterNumber, verse));
  }

  // Reset methods
  resetBook(bookName: string): void {
    if (this.bible) {
      this.bible.resetBook(bookName);
      this.saveProgress();
    }
  }

  resetTestament(testament: TestamentType): void {
    if (this.bible) {
      this.bible.resetTestament(testament);
      this.saveProgress();
    }
  }

  resetGroup(group: BookGroupType): void {
    if (this.bible) {
      this.bible.resetGroup(group);
      this.saveProgress();
    }
  }

  // Stats methods
  getTestamentVerseCount(testament: TestamentType): number {
    const testamentObj = this.getTestament(testament);
    return testamentObj?.memorizedVerses || 0;
  }

  getTestamentChapterCount(testament: TestamentType): number {
    const testamentObj = this.getTestament(testament);
    return testamentObj?.totalChapters || 0;
  }

  getTestamentBookCount(testament: TestamentType): number {
    const testamentObj = this.getTestament(testament);
    return testamentObj?.totalBooks || 0;
  }

  calculateTestamentStats(testament: TestamentType): { percentComplete: number; } {
    const testamentObj = this.getTestament(testament);
    return { 
      percentComplete: testamentObj?.percentComplete || 0
    };
  }

  saveProgress(): void {
    // First, update the observable
    //todo save bible data
  }

  getGroupByName(group: string) : BibleGroup | undefined {
    return this.bible.getGroupByName(group as BookGroupType);
  }
  getBooksInGroupType(group: BibleGroup) {
    throw new Error('Method not implemented.');
  }

}