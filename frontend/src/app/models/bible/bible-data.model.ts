// src/app/models/bible/bible-data.model.ts
import { BibleBook } from './bible-book.model';
import { BibleTestament } from './bible-testament.model';
import { UserVerseDetail } from './interfaces';
import { TestamentType } from './enums';
import BIBLE_DATA from '../bible_base_data.json';
import { BibleGroup } from './bible-group.modle';

/**
 * The main class that manages the entire Bible data structure
 */
export class BibleData {
  private readonly testamentMap: Map<string, BibleTestament> = new Map();
  private readonly bookMap: Map<string, BibleBook> = new Map();
  private readonly bookIdMap: Map<string, BibleBook> = new Map();

  // Store all books regardless of filter status
  private readonly _allBooks: BibleBook[] = [];

  // Visible books after filtering (when not showing apocrypha)
  public readonly visibleBooks: BibleBook[] = [];

  // Book ID aliases property
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
    'REV': 'REV',  // Revelation
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

  // Getter and setter for apocrypha preference
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
      });
    });

    // Now apply filtering based on current settings
    this.refreshBooksBasedOnSettings();
  }

  // Method to update book visibility based on apocrypha preference
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

    // Update the groups in each testament to show/hide books
    this.testaments.forEach(testament => {
      testament.groups.forEach(group => {
        // Filter books based on visibility
        group.books = group.books.filter(book => this.visibleBooks.includes(book));
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

  // Method to map user verses from API to the Bible model 
  // This is where we update our model with apocryphal data from the API
  mapUserVersesToModel(userVerses: UserVerseDetail[]): void {
    console.log(`Mapping ${userVerses.length} API verses to Bible model`);

    // First pass: collect apocryphal status information by chapter
    const apocryphalInfo: Record<string, Record<number, boolean[]>> = {};
    
    userVerses.forEach(userVerse => {
      try {
        if (!userVerse.verse) {
          return;
        }

        const { book_id, chapter_number, verse_number, isApocryphal } = userVerse.verse;
        
        // Initialize book record if not exists
        if (!apocryphalInfo[book_id]) {
          apocryphalInfo[book_id] = {};
        }
        
        // Initialize chapter array if not exists
        if (!apocryphalInfo[book_id][chapter_number]) {
          // Initialize with an array of false values with length equal to the max verse number
          const book = this.getBookByIdWithFallback(book_id);
          if (book) {
            const chapter = book.chapters[chapter_number - 1];
            if (chapter) {
              apocryphalInfo[book_id][chapter_number] = new Array(chapter.verses.length).fill(false);
            }
          }
        }
        
        // Set the apocryphal status for this verse
        if (apocryphalInfo[book_id][chapter_number]) {
          apocryphalInfo[book_id][chapter_number][verse_number - 1] = isApocryphal || false;
        }
      } catch (error) {
        console.error('Error processing verse for apocryphal info:', error);
      }
    });
    
    // Second pass: update the model with apocryphal info and other verse data
    userVerses.forEach(userVerse => {
      try {
        if (!userVerse.verse) {
          console.error('Missing verse data in user verse object');
          return;
        }

        const { book_id, chapter_number, verse_number, isApocryphal } = userVerse.verse;

        // Find the book by ID with fallback to aliases
        const book = this.getBookByIdWithFallback(book_id);
        if (!book) {
          console.error(`Book not found with ID: ${book_id}`);
          return;
        }

        // Handle special cases and validate chapter/verse
        const normalized = this.normalizeChapterAndVerse(book, chapter_number, verse_number);

        if (!normalized.valid) {
          return;
        }

        // Get the chapter and verse using normalized numbers
        const chapter = book.chapters[normalized.chapterNum - 1];

        // One final safety check for verse bounds
        if (normalized.verseNum <= 0 || normalized.verseNum > chapter.verses.length) {
          return;
        }

        const verse = chapter.verses[normalized.verseNum - 1];

        // Update verse properties
        verse.practiceCount = userVerse.practice_count || 0;
        verse.memorized = userVerse.practice_count > 0;
        verse.lastPracticed = userVerse.last_practiced;
        verse.isApocryphal = isApocryphal || false;
      } catch (error) {
        console.error('Error mapping verse:', error);
      }
    });

    // After processing all verses, check for apocryphal chapters
    // A chapter is considered apocryphal if any of its verses is apocryphal
    this._allBooks.forEach(book => {
      book.chapters.forEach(chapter => {
        // We can't directly set isApocryphal since it's a getter,
        // but recalculating through the verses will update the state
        if (chapter.isApocryphal) {
          console.log(`Chapter ${book.name} ${chapter.chapterNumber} contains apocryphal content`);
        }
      });
    });

    console.log(`Mapping complete`);
  }
}