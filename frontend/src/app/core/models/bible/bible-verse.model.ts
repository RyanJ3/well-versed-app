// src/app/models/bible/bible-verse.model.ts
import { BibleChapter } from './bible-chapter.model';
import { BookProgress } from './bible-book.model';

/**
 * Model class representing a single Bible verse
 */
export class BibleVerse {
  public lastPracticed?: Date;
  public practiceCount: number = 0;
  public isApocryphal: boolean = false;

  constructor(
    public readonly verseNumber: number,
    public memorized: boolean = false,
    private readonly parentChapter?: BibleChapter,
    isApocryphal: boolean = false
  ) { 
    this.isApocryphal = isApocryphal;
  }

  /**
   * Toggle the memorization status of the verse
   * @returns The new memorization status
   */
  toggle(): boolean {
    this.memorized = !this.memorized;
    return this.memorized;
  }

  // Getter for parent chapter
  get chapter(): BibleChapter | undefined {
    return this.parentChapter;
  }

  // Getter for parent book through chapter
  get book(): BookProgress | undefined {
    return this.parentChapter?.book;
  }

  // Getter for reference
  get reference(): string {
    if (!this.parentChapter || !this.book) return `Verse ${this.verseNumber}`;
    return `${this.book.name} ${this.parentChapter.chapterNumber}:${this.verseNumber}`;
  }
}