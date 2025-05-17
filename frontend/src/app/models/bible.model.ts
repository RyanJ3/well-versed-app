// src/app/models/bible-data.ts
import BIBLE_DATA from './bible_base_data.json';

// API Interface Models
export interface BibleVerse {
  verse_id: string;
  book_id: string;
  chapter_number: number;
  verse_number: number;
}

export interface UserVerse {
  user_id: number;
  verse_id: string;
  practice_count: number;
  last_practiced?: Date;
  created_at: Date;
  updated_at?: Date;
}

export interface UserVerseDetail {
  verse: BibleVerse;
  practice_count: number;
  last_practiced?: Date;
  created_at: Date;
  updated_at?: Date;
}

// Enums for type safety
export enum TestamentType {
  OLD = 'Old Testament',
  NEW = 'New Testament'
}

export enum BookGroupType {
  LAW = 'Torah',
  HISTORY = 'Historical',
  WISDOM = 'Wisdom',
  MAJOR_PROPHETS = 'Major Prophets',
  MINOR_PROPHETS = 'Minor Prophets',
  GOSPELS = 'Gospels',
  MODERN_HISTORICAL = 'Modern Historical',
  PAULINE = 'Pauline Epistles',
  GENERAL = 'General Epistles',
  APOCALYPTIC = 'Apocalyptic'
}

// Model classes
export class BibleVerse {
  public lastPracticed?: Date;
  public practiceCount: number = 0;

  constructor(
    public readonly verseNumber: number,
    public memorized: boolean = false,
    private readonly parentChapter?: BibleChapter
  ) { }

  toggle(): boolean {
    this.memorized = !this.memorized;
    return this.memorized;
  }

  // Getter for parent chapter
  get chapter(): BibleChapter | undefined {
    return this.parentChapter;
  }

  // Getter for parent book through chapter
  get book(): BibleBook | undefined {
    return this.parentChapter?.book;
  }

  // Getter for reference
  get reference(): string {
    if (!this.parentChapter || !this.book) return `Verse ${this.verseNumber}`;
    return `${this.book.name} ${this.parentChapter.chapterNumber}:${this.verseNumber}`;
  }
}

export class BibleChapter {
  public readonly verses: BibleVerse[];
  isApocryphal: boolean = false;
  isHidden: boolean = false;

  constructor(
    public readonly chapterNumber: number,
    totalVerses: number,
    memorizedVerses: number[] = [],
    private readonly parentBook?: BibleBook
  ) {
    // Create verses with proper memorization status and parent reference
    this.verses = Array.from({ length: totalVerses }, (_, i) =>
      new BibleVerse(i + 1, memorizedVerses.includes(i + 1), this)
    );
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

export class BibleBook {
  public readonly chapters: BibleChapter[];
  public readonly id: string;

  constructor(
    public readonly name: string,
    public readonly testament: BibleTestament,
    public readonly group: BibleGroup,
    versesPerChapter: number[],
    memorizedData: Record<number, number[]> = {},
    public readonly canonicalAffiliation: string = 'All',
    public readonly order: number = 0
  ) {
    // Generate appropriate ID based on book name
    this.id = this.generateBookId(name);

    // Create chapters with memorization data and parent reference
    this.chapters = versesPerChapter.map((verseCount, idx) => {
      const chapterNumber = idx + 1;
      return new BibleChapter(
        chapterNumber,
        verseCount,
        memorizedData[chapterNumber] || [],
        this // Pass this book as parent
      );
    });
  }
  /**
     * Check if a specific chapter is apocryphal
     */
  isApocryphalChapter(chapterNumber: number): boolean {
    // Special handling for Psalms
    if (this.name === 'Psalms' && chapterNumber === 151) {
      return true;
    }

    // Get the chapter
    const chapter = this.chapters.find(ch => ch.chapterNumber === chapterNumber);
    return chapter ? chapter.isApocryphal : false;
  }

  /**
   * Gets visible chapters based on user preferences
   */
  getVisibleChapters(includeApocrypha: boolean): BibleChapter[] {
    if (includeApocrypha) {
      return this.chapters;
    }

    return this.chapters.filter(chapter => !chapter.isApocryphal);
  }
  // Generate book ID (shorthand code like GEN, MAT, etc.)
  private generateBookId(bookName: string): string {
    // Special cases for books that might have abbreviation issues
    const specialCases: Record<string, string> = {
      'Psalms': 'PSA',
      'Psalm': 'PSA',
      'Psalm 151': 'PS151',  // Special case for Psalm 151
      'Genesis': 'GEN',
      'Exodus': 'EXO',
      'Leviticus': 'LEV',
      'Numbers': 'NUM',
      'Deuteronomy': 'DEU',
      'Joshua': 'JOS',
      'Judges': 'JDG',
      'Ruth': 'RUT',
      'Esther': 'EST',
      'Job': 'JOB',
      'Proverbs': 'PRO',
      'Ecclesiastes': 'ECC',
      'Isaiah': 'ISA',
      'Jeremiah': 'JER',
      'Lamentations': 'LAM',
      'Ezekiel': 'EZK',
      'Daniel': 'DAN',
      'Hosea': 'HOS',
      'Joel': 'JOL',
      'Amos': 'AMO',
      'Obadiah': 'OBA',
      'Jonah': 'JON',
      'Micah': 'MIC',
      'Nahum': 'NAH',
      'Habakkuk': 'HAB',
      'Zephaniah': 'ZEP',
      'Haggai': 'HAG',
      'Zechariah': 'ZEC',
      'Malachi': 'MAL',
      'Matthew': 'MAT',
      'Mark': 'MRK',
      'Luke': 'LUK',
      'John': 'JHN',
      'Acts': 'ACT',
      'Romans': 'ROM',
      'Revelation': 'REV'
    };

    // Check if the book is in our special cases list
    if (specialCases[bookName]) {
      return specialCases[bookName];
    }

    // Handle numbered books like "1 Samuel" -> "1SA"
    if (bookName.match(/^\d+\s/)) {
      const parts = bookName.split(' ');
      const number = parts[0];
      const abbr = parts.slice(1).join(' ').substring(0, 3).toUpperCase();
      return `${number}${abbr}`;
    }

    // Default: first 3 letters uppercase
    return bookName.substring(0, 3).toUpperCase();
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
    this.chapters.forEach(chapter => chapter.clearAllVerses());
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

  // Add book-level operations
  selectAllVerses(): void {
    this.chapters.forEach(chapter => chapter.selectAllVerses());
  }

  clearAllVerses(): void {
    this.chapters.forEach(chapter => chapter.clearAllVerses());
  }
}

export class BibleGroup {
  constructor(
    public readonly name: string,
    public books: BibleBook[] = []
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
  public readonly books: BibleBook[] = [];
  private readonly _groupsMap: Map<string, BibleGroup> = new Map();

  constructor(
    public readonly name: TestamentType | string,
    books: any[] = []
  ) { }

  addBook(book: BibleBook): void {
    this.books.push(book);

    // Add to group map if not exists
    if (!this._groupsMap.has(book.group.name)) {
      this._groupsMap.set(book.group.name, book.group);
    }
  }

  // Add this getter to fix the template error
  get groups(): BibleGroup[] {
    return Array.from(this._groupsMap.values());
  }

  // Keep the method but rename it to avoid conflicts
  getGroupsArray(): BibleGroup[] {
    return Array.from(this._groupsMap.values());
  }

  get isOld(): boolean {
    return this.name === TestamentType.OLD;
  }

  get isNew(): boolean {
    return this.name === TestamentType.NEW;
  }

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

  getGroup(name: string): BibleGroup | undefined {
    return this._groupsMap.get(name);
  }

  getBook(name: string): BibleBook | undefined {
    return this.books.find(book => book.name === name);
  }

  reset(): void {
    this.books.forEach(book => book.reset());
  }
}

// This is the BibleData class from bible.model.ts with our fixes
// You would replace just this class in your existing bible.model.ts file

export class BibleData {
  private readonly testamentMap: Map<string, BibleTestament> = new Map();
  private readonly bookMap: Map<string, BibleBook> = new Map();
  private readonly bookIdMap: Map<string, BibleBook> = new Map();

  // Store all books regardless of filter status
  private readonly _allBooks: BibleBook[] = [];

  // Visible books after filtering (when not showing apocrypha)
  public readonly visibleBooks: BibleBook[] = [];

  // Add the book ID aliases property
  private readonly bookIdAliases: Record<string, string> = {
    // Standard aliases
    'JOH': 'JHN',  // John
    'JN': 'JHN',   // John
    'JO': 'JHN',   // John
    'JUD': 'JDE',  // Jude
    'PSM': 'PSA',  // Psalms
    'PS': 'PSA',   // Psalms
    'PRV': 'PRO',  // Proverbs
    'MAT': 'MAT',  // Matthew
    'MRK': 'MRK',  // Mark
    'LUK': 'LUK',  // Luke
    'ACT': 'ACT',  // Acts
    'ROM': 'ROM',  // Romans
    'CO1': '1CO',  // 1 Corinthians
    'CO2': '2CO',  // 2 Corinthians
    'GAL': 'GAL',  // Galatians
    'EPH': 'EPH',  // Ephesians
    'PHP': 'PHP',  // Philippians
    'COL': 'COL',  // Colossians
    'TH1': '1TH',  // 1 Thessalonians
    'TH2': '2TH',  // 2 Thessalonians
    'TI1': '1TI',  // 1 Timothy
    'TI2': '2TI',  // 2 Timothy
    'TIT': 'TIT',  // Titus
    'PHM': 'PHM',  // Philemon
    'HEB': 'HEB',  // Hebrews
    'JAS': 'JAS',  // James
    'PE1': '1PE',  // 1 Peter
    'PE2': '2PE',  // 2 Peter
    'JN1': '1JN',  // 1 John
    'JN2': '2JN',  // 2 John
    'JN3': '3JN',  // 3 John
    'REV': 'REV',   // Revelation
    'SIR': 'SIR',  // Sirach - You might need to use an actual ID that exists in your books collection
    'MAR': 'MRK',  // Mark - This maps to the standard 'MRK' ID for Mark
  };

  // Add property to track apocrypha preference 
  private _includeApocrypha: boolean = false;

  // Getter to provide the appropriate book list based on preferences
  get books(): BibleBook[] {
    // If we're showing apocrypha, return all books
    if (this._includeApocrypha) {
      return this._allBooks;
    }
    // Otherwise return the filtered list
    return this.visibleBooks;
  }

  constructor(progressData: Record<string, Record<number, number[]>> = {}) {
    console.log('Initializing BibleData from JSON');

    // Create testament objects
    const oldTestament = new BibleTestament(TestamentType.OLD);
    const newTestament = new BibleTestament(TestamentType.NEW);

    // Store in maps for lookups
    this.testamentMap.set('OLD', oldTestament);
    this.testamentMap.set('NEW', newTestament);

    // Create group maps
    const groupMap = new Map<string, BibleGroup>();

    // Process each book from the JSON data
    BIBLE_DATA.books.forEach((bookData: any) => {
      // Skip books with canonicalAffiliation NONE
      if (bookData.canonicalAffiliation === 'NONE') {
        return;
      }

      const isOldTestament = bookData.testament === TestamentType.OLD;
      const testament = isOldTestament ? oldTestament : newTestament;

      // Get or create group
      if (!groupMap.has(bookData.bookGroup)) {
        groupMap.set(bookData.bookGroup, new BibleGroup(bookData.bookGroup));
      }
      const group = groupMap.get(bookData.bookGroup)!;

      // Create book
      const book = new BibleBook(
        bookData.name,
        testament,
        group,
        bookData.chapters,
        progressData[bookData.name] || {},
        bookData.canonicalAffiliation
      );

      // Add to book collections
      this.bookMap.set(book.name, book);
      this.bookIdMap.set(book.id, book);
      this._allBooks.push(book); // Store in the complete books collection

      // Add to group's books array
      group.books.push(book);

      // Add to testament
      testament.addBook(book);
    });

    // Initial filtering to populate visibleBooks
    this.refreshBooksBasedOnSettings();

    console.log(`Initialized ${this._allBooks.length} books in BibleData`);
  }

  // Add this getter and setter for apocrypha preference
  get includeApocrypha(): boolean {
    return this._includeApocrypha;
  }

  set includeApocrypha(value: boolean) {
    if (this._includeApocrypha !== value) {
      this._includeApocrypha = value;
      this.refreshBooksBasedOnSettings();
    }
  }

  // Method to ensure all books are loaded from the original data source
  reloadAllBooks(): void {
    console.log('Reloading all books from original data');

    // Process each testament to restore all books to their groups
    this.testaments.forEach(testament => {
      testament.groups.forEach(group => {
        // Find all books that belong to this group
        const groupBooks = this._allBooks.filter(book => book.group === group);

        // Replace the group's books with the complete set
        group.books = [...groupBooks];

        // Log the books in this group for debugging
        console.log(`Group ${group.name} has ${group.books.length} books after reload`);
      });
    });

    // Now apply filtering based on current settings
    this.refreshBooksBasedOnSettings();
  }

  // 2. Update the refreshBooksBasedOnSettings method in BibleData class
  // Modified version:
  refreshBooksBasedOnSettings(): void {
    console.log(`Refreshing books with includeApocrypha=${this._includeApocrypha}`);

    // Clear the visible books list
    this.visibleBooks.length = 0;

    // Populate the filtered books list
    this._allBooks.forEach(book => {
      // Add to visible books if it should be visible
      if (this._includeApocrypha ||
        (book.canonicalAffiliation === 'All') ||
        (book.canonicalAffiliation !== 'Catholic' &&
          book.canonicalAffiliation !== 'Eastern Orthodox')) {
        this.visibleBooks.push(book);
      }
    });

    console.log(`Filtered to ${this.visibleBooks.length} visible books out of ${this._allBooks.length} total books`);

    // If we're not showing apocrypha, we need to hide Psalm 151
    if (!this._includeApocrypha) {
      // Find the Psalms book
      const psalmsBook = this._allBooks.find(book => book.name === 'Psalms');
      if (psalmsBook && psalmsBook.chapters.length > 150) {
        // Hide chapter 151 by setting a flag or filtering it out of the displayed chapters
        console.log('Hiding Psalm 151 chapter');
        // We need a way to mark chapters as hidden
        // This could be a new property on the chapter model
        if (psalmsBook.chapters[150]) {
          psalmsBook.chapters[150].isApocryphal = true;
          psalmsBook.chapters[150].isHidden = !this._includeApocrypha;
        }
      }
    }

    // Update the groups in each testament to show/hide books
    this.testaments.forEach(testament => {
      testament.groups.forEach(group => {
        // Filter books based on visibility
        group.books = group.books.filter(book => this.visibleBooks.includes(book));

        // Log how many books are in the group after filtering
        console.log(`Group ${group.name}: ${group.books.length} books after filtering (apocrypha: ${this._includeApocrypha})`);
      });
    });
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

  getBookByName(name: string): BibleBook {
    // Always search in the complete book list
    const book = this.bookMap.get(name);
    if (!book) {
      throw new Error(`Book ${name} not found`);
    }
    return book;
  }

  getBookById(id: string): BibleBook | undefined {
    // Always search in the complete book list
    return this.bookIdMap.get(id);
  }

  getGroupByName(groupName: string): BibleGroup {
    for (const testament of this.testaments) {
      const group = testament.getGroup(groupName);
      if (group) {
        return group;
      }
    }
    throw new Error(`Group ${groupName} not found`);
  }

  // Helper method to get a book by ID with fallback to aliases
  private getBookByIdWithFallback(bookId: string): BibleBook | undefined {
    // Try direct lookup first
    let book = this.bookIdMap.get(bookId);

    // If not found, check for aliases
    if (!book && this.bookIdAliases[bookId]) {
      const standardId = this.bookIdAliases[bookId];
      book = this.bookIdMap.get(standardId);
      // console.log(`Book ID ${bookId} mapped to standard ID ${standardId}`);
    }

    return book;
  }

  // Helper method for handling special cases
  private normalizeChapterAndVerse(book: BibleBook, chapterNum: number, verseNum: number): { chapterNum: number, verseNum: number, valid: boolean } {
    // Single-chapter books to handle specially
    const singleChapterBooks = [
      'OBA', 'PHM', 'JDE', '2JN', '3JN'  // Obadiah, Philemon, Jude, 2 John, 3 John
    ];

    // If it's a single-chapter book and not requesting chapter 1
    if (book.chapters.length === 1 && chapterNum > 1) {
      // For single-chapter books, normalize to chapter 1
      // console.log(`Normalizing reference: ${book.name} ${chapterNum}:${verseNum} -> ${book.name} 1:${verseNum}`);
      return { chapterNum: 1, verseNum, valid: true };
    }

    // Regular validation
    const isValidChapter = chapterNum > 0 && chapterNum <= book.chapters.length;

    if (!isValidChapter) {
      return { chapterNum, verseNum, valid: false };
    }

    // Get the actual chapter and check if verse is valid
    const chapter = book.chapters[chapterNum - 1];
    const isValidVerse = verseNum > 0 && verseNum <= chapter.verses.length;

    return {
      chapterNum,
      verseNum,
      valid: isValidChapter && isValidVerse
    };
  }

  // Replace this method entirely
  mapUserVersesToModel(userVerses: UserVerseDetail[]): void {
    console.log(`Mapping ${userVerses.length} API verses to Bible model`);

    // Keep track of success rate for debugging
    let successCount = 0;
    let errorCount = 0;

    userVerses.forEach(userVerse => {
      try {
        if (!userVerse.verse) {
          console.error('Missing verse data in user verse object');
          errorCount++;
          return;
        }

        const { book_id, chapter_number, verse_number } = userVerse.verse;

        // Find the book by ID with fallback to aliases - search in all books, not just visible ones
        const book = this.getBookByIdWithFallback(book_id);
        if (!book) {
          console.error(`Book not found with ID: ${book_id}`);
          errorCount++;
          return;
        }

        // Handle special cases and validate chapter/verse
        const normalized = this.normalizeChapterAndVerse(book, chapter_number, verse_number);

        if (!normalized.valid) {
          // Skip this verse but don't flood the console with errors
          if (errorCount < 10 || errorCount % 50 === 0) {
            //console.error(`Invalid reference: ${book.name} ${chapter_number}:${verse_number}`);
          }
          errorCount++;
          return;
        }

        // Get the chapter and verse using normalized numbers
        const chapter = book.chapters[normalized.chapterNum - 1];

        // One final safety check for verse bounds
        if (normalized.verseNum <= 0 || normalized.verseNum > chapter.verses.length) {
          errorCount++;
          return;
        }

        const verse = chapter.verses[normalized.verseNum - 1];

        // Update verse properties
        verse.practiceCount = userVerse.practice_count || 0;
        verse.memorized = userVerse.practice_count > 0;
        verse.lastPracticed = userVerse.last_practiced;

        // Count successful mapping
        successCount++;
      } catch (error) {
        console.error('Error mapping verse:', error);
        errorCount++;
      }
    });

    console.log(`Mapping complete: ${successCount} verses mapped successfully, ${errorCount} errors`);
  }

}
