// frontend/src/app/models/bible/bible-data.model.ts (key changes only)
import { BibleBook } from './bible-book.model';
import { BibleTestament } from './bible-testament.model';
import { UserVerseDetail } from './interfaces';
import { TestamentType } from './enums';
import BIBLE_DATA from './../bible_base_data.json';
import { BibleGroup } from './bible-group.modle';

export class BibleData {
  private readonly testamentMap: Map<string, BibleTestament> = new Map();
  private readonly bookMap: Map<string, BibleBook> = new Map();
  private readonly bookIdMap: Map<number, BibleBook> = new Map(); // Changed to number key

  // Store all books regardless of filter status
  private readonly _allBooks: BibleBook[] = [];

  public readonly visibleBooks: BibleBook[] = [];

  get books(): BibleBook[] {
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
        progressData[bookData.name] || {}
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

    // All books are visible since apocrypha has been removed
    this.visibleBooks.push(...this._allBooks);

    console.log(`Initialized ${this._allBooks.length} books in BibleData`);
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
      ? Math.round((this.memorizedVerses / this.totalVerses) * 1000) / 10
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
      } catch (error) {
        console.error('Error mapping verse:', error);
      }
    });

    console.log(`Mapping complete`);
  }
}