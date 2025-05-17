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
  ) {}

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
  ) {}

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

export class BibleData {
  private readonly testamentMap: Map<string, BibleTestament> = new Map();
  private readonly bookMap: Map<string, BibleBook> = new Map();
  private readonly bookIdMap: Map<string, BibleBook> = new Map();
  public readonly books: BibleBook[] = [];
  
  // Add property to track apocrypha preference 
  private _includeApocrypha: boolean = false;

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
      this.books.push(book);
      
      // Add to group's books array
      group.books.push(book);
      
      // Add to testament
      testament.addBook(book);
    });
    
    console.log(`Initialized ${this.books.length} books in BibleData`);
    
    // Apply initial filtering based on apocrypha setting
    this.refreshBooksBasedOnSettings();
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

  // Add this method to filter books based on settings
  refreshBooksBasedOnSettings(): void {
    console.log(`Refreshing books with includeApocrypha=${this._includeApocrypha}`);
    
    // For each testament, filter books
    this.testaments.forEach(testament => {
      testament.groups.forEach(group => {
        // Filter out apocryphal books if not enabled
        group.books = group.books.filter(book => {
          if (!this._includeApocrypha && book.canonicalAffiliation !== 'All') {
            // Check specific cases
            if (book.name === 'Psalm 151' || 
                book.canonicalAffiliation === 'Catholic' || 
                book.canonicalAffiliation === 'Eastern Orthodox') {
              console.log(`Filtering out apocryphal book: ${book.name}`);
              return false;
            }
          }
          return true;
        });
      });
    });
    
    // Re-initialize maps and arrays after filtering
    this.rebuildMaps();
  }

  // Add this helper method to rebuild maps after filtering
  private rebuildMaps(): void {
    // Clear existing maps and arrays
    this.bookMap.clear();
    this.bookIdMap.clear();
    this.books.length = 0;
    
    // Rebuild from filtered testament groups
    this.testaments.forEach(testament => {
      testament.groups.forEach(group => {
        group.books.forEach(book => {
          this.bookMap.set(book.name, book);
          this.bookIdMap.set(book.id, book);
          this.books.push(book);
        });
      });
    });
    
    console.log(`Books rebuilt, total count: ${this.books.length}`);
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
    const book = this.bookMap.get(name);
    if (!book) {
      throw new Error(`Book ${name} not found`);
    }
    return book;
  }

  getBookById(id: string): BibleBook | undefined {
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

  // Map API verses to model verses
  mapUserVersesToModel(userVerses: UserVerseDetail[]): void {
    console.log(`Mapping ${userVerses.length} API verses to Bible model`);
    
    userVerses.forEach(userVerse => {
      try {
        if (!userVerse.verse) {
          console.error('Missing verse data in user verse object');
          return;
        }
        
        const { book_id, chapter_number, verse_number } = userVerse.verse;
        
        // Find the book by ID
        const book = this.getBookById(book_id);
        if (!book) {
          console.error(`Book not found with ID: ${book_id}`);
          return;
        }
        
        // Get chapter (array is 0-based, chapter numbers are 1-based)
        if (chapter_number <= 0 || chapter_number > book.chapters.length) {
          console.error(`Invalid chapter number: ${chapter_number} for book ${book.name}`);
          return;
        }
        
        const chapter = book.chapters[chapter_number - 1];
        
        // Get verse (array is 0-based, verse numbers are 1-based)
        if (verse_number <= 0 || verse_number > chapter.verses.length) {
          console.error(`Invalid verse number: ${verse_number} for chapter ${chapter_number}`);
          return;
        }
        
        const verse = chapter.verses[verse_number - 1];
        
        // Update verse properties
        verse.practiceCount = userVerse.practice_count || 0;
        verse.memorized = userVerse.practice_count > 0;
        verse.lastPracticed = userVerse.last_practiced;
        
        // console.log(`Mapped verse: ${book.name} ${chapter_number}:${verse_number} (practice count: ${userVerse.practice_count})`);
      } catch (error) {
        console.error('Error mapping verse:', error);
      }
    });
    
    console.log('Mapping complete');
  }
}