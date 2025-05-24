// frontend/src/app/models/bible/bible-data.model.ts (key changes only)
import { BibleBook } from './bible-book.model';
import { BibleTestament } from './bible-testament.model';
import { UserVerseDetail } from './interfaces';
import { TestamentType } from './enums';
import BIBLE_DATA from '../bible_base_data.json';
import { BibleGroup } from './bible-group.modle';

export class BibleData {
  private readonly testamentMap: Map<string, BibleTestament> = new Map();
  private readonly bookMap: Map<string, BibleBook> = new Map();
  private readonly bookIdMap: Map<number, BibleBook> = new Map(); // Changed to number key

  // Store all books regardless of filter status
  private readonly _allBooks: BibleBook[] = [];

  // Visible books after filtering (when not showing apocrypha)
  public readonly visibleBooks: BibleBook[] = [];

  // Property to track apocrypha preference 
  private _includeApocrypha: boolean = false;

  // Getter to provide the appropriate book list based on preferences
  get books(): BibleBook[] {
    if (this._includeApocrypha) {
      return this._allBooks;
    }
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
      this.bookIdMap.set(book.id, book); // Use numerical ID
      this._allBooks.push(book);

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
    const book = this.bookMap.get(name);
    if (!book) {
      throw new Error(`Book ${name} not found`);
    }
    return book;
  }

  getBookById(id: number): BibleBook | undefined {
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

  // Method to map user verses from API to the Bible model 
  mapUserVersesToModel(userVerses: UserVerseDetail[]): void {
    console.log(`Mapping ${userVerses.length} API verses to Bible model`);

    // First pass: collect apocryphal status information by chapter
    const apocryphalInfo: Record<number, Record<number, boolean[]>> = {};
    
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
          const book = this.getBookById(book_id);
          if (book && book.chapters[chapter_number - 1]) {
            const chapter = book.chapters[chapter_number - 1];
            apocryphalInfo[book_id][chapter_number] = new Array(chapter.verses.length).fill(false);
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

        // Find the book by numerical ID
        const book = this.getBookById(book_id);
        if (!book) {
          console.error(`Book not found with ID: ${book_id}`);
          return;
        }

        // Validate chapter and verse
        if (chapter_number <= 0 || chapter_number > book.chapters.length) {
          console.error(`Invalid chapter number ${chapter_number} for book ${book.name}`);
          return;
        }

        const chapter = book.chapters[chapter_number - 1];

        // Validate verse bounds
        if (verse_number <= 0 || verse_number > chapter.verses.length) {
          console.error(`Invalid verse number ${verse_number} for ${book.name} ${chapter_number}`);
          return;
        }

        const verse = chapter.verses[verse_number - 1];

        // Update verse properties
        verse.practiceCount = userVerse.practice_count || 0;
        verse.memorized = userVerse.practice_count > 0;
        verse.lastPracticed = userVerse.last_practiced;
        verse.isApocryphal = isApocryphal || false;
      } catch (error) {
        console.error('Error mapping verse:', error);
      }
    });

    console.log(`Mapping complete`);
  }
}