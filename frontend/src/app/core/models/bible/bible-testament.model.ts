// src/app/models/bible/bible-testament.model.ts
import { BibleBook } from './bible-book.model';
import { BibleGroup } from './bible-group.model';
import { TestamentType } from './enums';

/**
 * Model class representing a Bible testament (Old or New)
 */
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

  // Getter to fix the template error
  get groups(): BibleGroup[] {
    return Array.from(this._groupsMap.values());
  }

  // Method for backward compatibility
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
      ? Math.round((this.memorizedVerses / this.totalVerses) * 1000) / 10
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