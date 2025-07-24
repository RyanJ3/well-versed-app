import { BibleVerse } from './bible-verse.model';
import { BibleBook } from './bible-book.model';

/**
 * Model class representing a Bible chapter
 */
export class BibleChapter {
  public readonly verses: BibleVerse[];
  private _isApocryphal: boolean = false;
  
  // Progress tracking properties
  public completedDate: string | null = null;
  public notes: string | null = null;

  constructor(
    public readonly chapterNumber: number,
    totalVerses: number,
    memorizedVerses: number[] = [],
    private readonly parentBook?: BibleBook,
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
  get book(): BibleBook | undefined {
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

  // New getter to match ChapterProgress format
  get versesRead(): number[] {
    return this.verses
      .filter(v => v.memorized)
      .map(v => v.verseNumber);
  }

  markVerseAsMemorized(verseNumber: number): void {
    const verse = this.verses.find(v => v.verseNumber === verseNumber);
    if (verse) {
      verse.memorized = true;
      this.updateCompletionStatus();
    }
  }

  toggleVerse(verseNumber: number): boolean {
    const verse = this.verses.find(v => v.verseNumber === verseNumber);
    const result = verse ? verse.toggle() : false;
    if (result) {
      this.updateCompletionStatus();
    }
    return result;
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
    this.updateCompletionStatus();
  }

  clearAllVerses(): void {
    this.verses.forEach(verse => verse.memorized = false);
    // Clear completion date when verses are cleared
    this.completedDate = null;
  }

  /**
   * Updates the completion status of the chapter
   * Sets completedDate when chapter reaches 100% completion
   */
  private updateCompletionStatus(): void {
    if (this.isComplete && !this.completedDate) {
      this.completedDate = new Date().toISOString();
    } else if (!this.isComplete && this.completedDate) {
      // If chapter is no longer complete, clear the completion date
      this.completedDate = null;
    }
  }
}