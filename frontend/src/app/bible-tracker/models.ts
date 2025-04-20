// models.ts - Contains all the data models for the application
import bibleData from './bible_base_data.json';

// Convert BibleBook from interface to class
export class BibleBook {
  // Properties
  public name: string;
  public testament: string;
  public bookGroup: string;
  public canonicalAffiliation: string;
  public chapters: number[];
  public totalVerses: number;
  public totalChapters: number;
  public group: string;
  public order?: number;

  constructor(data: {
    name: string;
    testament: string;
    bookGroup: string;
    canonicalAffiliation: string;
    chapters: number[];
    order?: number;
  }) {
    this.name = data.name;
    this.testament = data.testament;
    this.bookGroup = data.bookGroup;
    this.canonicalAffiliation = data.canonicalAffiliation;
    this.chapters = data.chapters;
    this.order = data.order;

    // Compute derived properties
    this.group = data.bookGroup;
    this.totalChapters = this.getTotalChapters();
    this.totalVerses = this.getTotalVerses();
  }

  // Methods
  public getTotalVerses(): number {
    return this.chapters.reduce((sum, verses) => sum + verses, 0);
  }

  public getTotalChapters(): number {
    return this.chapters.length;
  }

  public getVerseCount(chapterIndex: number): number {
    if (chapterIndex < 0 || chapterIndex >= this.chapters.length) {
      return 0;
    }
    return this.chapters[chapterIndex];
  }

  public isInTestament(testament: string): boolean {
    return this.testament === testament;
  }

  public isInGroup(group: string): boolean {
    return this.bookGroup === group;
  }

  getChapterProgress(chapterIndex: number): ChapterProgress {
    if (chapterIndex < 0 || chapterIndex >= this.chapters.length) {
      throw new Error(`Chapter index out of bounds: ${chapterIndex}`);
    }
    return new ChapterProgress(chapterIndex + 1, this.chapters[chapterIndex]);
  }

  // Static factory method to create from raw data
  public static fromRawData(bookData: any): BibleBook {
    return new BibleBook({
      name: bookData.name,
      testament: bookData.testament,
      bookGroup: bookData.bookGroup,
      canonicalAffiliation: bookData.canonicalAffiliation,
      chapters: bookData.chapters,
      order: bookData.order,
    });
  }
}

// Convert BibleData from interface to class
export class BibleData {
  public books: BibleBook[];
  public bookIndex: { [key: string]: number };
  public synonyms: { [key: string]: number };
  private booksByName: { [key: string]: BibleBook } = {};

  constructor(data: any) {
    this.bookIndex = data.bookIndex || {};
    this.synonyms = data.synonyms || {};

    // Create enhanced book objects
    this.books = (data.books || []).map((book: any) =>
      BibleBook.fromRawData(book),
    );

    // Build lookup map for books by name
    this.books.forEach((book) => {
      this.booksByName[book.name] = book;
    });
  }

  // Allow getting a book by name as a property
  public get(bookName: string): BibleBook | undefined {
    return this.booksByName[bookName];
  }

  // Methods
  public getBookByName(name: string): BibleBook {
    // Try direct lookup first
    if (this.booksByName[name]) {
      return this.booksByName[name];
    }

    // Try book index lookup
    const bookIndex = this.bookIndex[name];
    if (bookIndex && bookIndex > 0 && bookIndex <= this.books.length) {
      return this.books[bookIndex - 1];
    }

    // Try synonym lookup
    const synonymIndex = this.synonyms[name];
    if (synonymIndex && synonymIndex > 0 && synonymIndex <= this.books.length) {
      return this.books[synonymIndex - 1];
    }

    // Case insensitive search as fallback
    const lowerName = name.toLowerCase();
    for (const [key, index] of Object.entries(this.synonyms)) {
      if (
        key.toLowerCase() === lowerName &&
        index > 0 &&
        index <= this.books.length
      ) {
        return this.books[index - 1];
      }
    }

    throw new Error(`Book not found: ${name}`);
  }

  public getBooksByTestament(testament: string): BibleBook[] {
    return this.books.filter((book) => book.testament === testament);
  }

  public getBooksByGroup(bookGroup: string): BibleBook[] {
    return this.books
      .filter((book) => book.bookGroup === bookGroup)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public getGroupsInTestament(testament: string): string[] {
    return [
      ...new Set(
        this.books
          .filter((book) => book.testament === testament)
          .map((book) => book.bookGroup),
      ),
    ];
  }

  public getTestaments(): string[] {
    return [...new Set(this.books.map((book) => book.testament))];
  }

  public getBookGroups(): string[] {
    return [...new Set(this.books.map((book) => book.bookGroup))];
  }

  public isValidReference(
    bookName: string,
    chapter: number,
    verse?: number,
  ): boolean {
    const book = this.getBookByName(bookName);
    if (!book || chapter < 1 || chapter > book.chapters.length) {
      return false;
    }

    if (verse !== undefined) {
      const verseCount = book.chapters[chapter - 1];
      return verse >= 1 && verse <= verseCount;
    }

    return true;
  }
}

// Chapter progress tracking with added methods
export class ChapterProgress {
  public chapter: number;
  public memorizedVerses: number;
  public inProgress: boolean;
  public completed: boolean;
  public versesMemorized: boolean[];

  constructor(
    chapter: number,
    totalVerses: number,
    memorizedVerses: number = 0,
    inProgress: boolean = false,
    completed: boolean = false,
    versesMemorized?: boolean[],
  ) {
    this.chapter = chapter;
    this.memorizedVerses = memorizedVerses;
    this.inProgress = inProgress;
    this.completed = completed;

    // Initialize versesMemorized array if not provided
    if (versesMemorized && versesMemorized.length === totalVerses) {
      this.versesMemorized = versesMemorized;
    } else {
      this.versesMemorized = Array(totalVerses).fill(false);
      // If we have memorizedVerses count but no specific verses marked,
      // mark the first N verses as memorized
      for (let i = 0; i < memorizedVerses && i < totalVerses; i++) {
        this.versesMemorized[i] = true;
      }
    }
  }

  public getCompletionPercentage(): number {
    if (!this.versesMemorized || this.versesMemorized.length === 0) {
      return 0;
    }
    const memorizedCount = this.versesMemorized.filter((v) => v).length;
    return Math.round((memorizedCount / this.versesMemorized.length) * 100);
  }

  public getMemorizedVerseCount(): number {
    if (!this.versesMemorized) {
      return this.memorizedVerses;
    }
    return this.versesMemorized.filter((v) => v).length;
  }

  public getUnmemorizedVerseCount(): number {
    if (!this.versesMemorized) {
      return 0;
    }
    return this.versesMemorized.filter((v) => !v).length;
  }

  public isVerseMemorized(verseNumber: number): boolean {
    if (
      !this.versesMemorized ||
      verseNumber < 1 ||
      verseNumber > this.versesMemorized.length
    ) {
      return false;
    }
    return this.versesMemorized[verseNumber - 1];
  }

  public getRemainingVerses(): number[] {
    if (!this.versesMemorized) {
      return [];
    }
    return this.versesMemorized
      .map((isMemorized, index) => (isMemorized ? -1 : index + 1))
      .filter((index) => index !== -1);
  }

  public getMemorizedVerses(): number[] {
    if (!this.versesMemorized) {
      return [];
    }
    return this.versesMemorized
      .map((isMemorized, index) => (isMemorized ? index + 1 : -1))
      .filter((index) => index !== -1);
  }

  // Create from existing data (for migration)
  public static fromExistingData(
    data: any,
    totalVerses: number,
  ): ChapterProgress {
    if (!data) {
      return new ChapterProgress(1, totalVerses);
    }

    return new ChapterProgress(
      data.chapter || 1,
      totalVerses,
      data.memorizedVerses || 0,
      data.inProgress || false,
      data.completed || false,
      data.versesMemorized,
    );
  }
}

// Keep BookProgress as interface since it's just an index signature
export interface BookProgress {
  [bookName: string]: ChapterProgress[];
}

// Convert GroupStats to class
export class GroupStats {
  constructor(
    public percentComplete: number = 0,
    public completedChapters: number = 0,
    public totalChapters: number = 0,
  ) {}

  public getFormattedProgress(): string {
    return `${this.percentComplete}% (${this.completedChapters}/${this.totalChapters} chapters)`;
  }

  public isComplete(): boolean {
    return this.percentComplete === 100;
  }
}

// Convert BookStats to class
export class BookStats {
  constructor(
    public percentComplete: number = 0,
    public memorizedVerses: number = 0,
    public totalVerses: number = 0,
    public completedChapters: number = 0,
    public inProgressChapters: number = 0,
  ) {}

  public getFormattedProgress(): string {
    return `${this.percentComplete}% (${this.memorizedVerses}/${this.totalVerses} verses)`;
  }

  public getChapterSummary(): string {
    return `${this.completedChapters} completed, ${this.inProgressChapters} in progress`;
  }

  public getRemainingVerses(): number {
    return this.totalVerses - this.memorizedVerses;
  }

  public isComplete(): boolean {
    return this.percentComplete === 100;
  }
}

// Add TestamentStats class
export class TestamentStats {
  constructor(
    public percentComplete: number = 0,
    public memorizedVerses: number = 0,
    public totalVerses: number = 0,
    public completedChapters: number = 0,
    public totalChapters: number = 0,
  ) {}

  public getFormattedProgress(): string {
    return `${this.percentComplete}%`;
  }

  public getVerseSummary(): string {
    return `${this.memorizedVerses} of ${this.totalVerses} verses`;
  }

  public getChapterSummary(): string {
    return `${this.completedChapters} of ${this.totalChapters} chapters`;
  }

  public isComplete(): boolean {
    return this.percentComplete === 100;
  }

  public hasProgress(): boolean {
    return this.memorizedVerses > 0;
  }

  public getRemainingVerses(): number {
    return this.totalVerses - this.memorizedVerses;
  }
}

// Create the BIBLE_DATA instance
export const BIBLE_DATA = new BibleData(bibleData);

// Convert enhance functions to use the new classes

// This replaces the old enhanceChapterProgress function
export function createChapterProgress(
  progressData: any,
  totalVerses: number,
): ChapterProgress {
  return ChapterProgress.fromExistingData(progressData, totalVerses);
}
