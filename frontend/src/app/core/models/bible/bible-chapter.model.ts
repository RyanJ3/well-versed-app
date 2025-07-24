import { BibleVerse } from './bible-verse.model';
import { BookProgress } from './bible-book.model';

/**
 * Model class representing a Bible chapter
 */
export class BibleChapter {
  public readonly verses: BibleVerse[];
  private _isApocryphal: boolean = false;

  constructor(
    public readonly chapterNumber: number,
    totalVerses: number,
    memorizedVerses: number[] = [],
    private readonly parentBook?: BookProgress,
    versesApocryphalStatus: boolean[] = []
  ) {
    // Create verses with proper parent references
    this.verses = Array.from({ length: totalVerses }, (_, i) => {
      const isVerseApocryphal = versesApocryphalStatus[i] || false;
      return new BibleVerse(
        i + 1,
        memorizedVerses.includes(i + 1),
        this,
        isVerseApocryphal
      );
    });

    // A chapter is considered apocryphal if any of its verses are apocryphal
    this._isApocryphal = this.verses.some(v => v.isApocryphal);
  }

  // Getter for isApocryphal
  get isApocryphal(): boolean {
    return this._isApocryphal;
  }

  // Getter for parent book
  get book(): BookProgress | undefined {
    return this.parentBook;
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

  selectAllVerses(): void {
    this.verses.forEach(verse => verse.memorized = true);
  }

  clearAllVerses(): void {
    this.verses.forEach(verse => verse.memorized = false);
  }
}