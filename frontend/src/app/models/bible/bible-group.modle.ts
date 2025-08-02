// src/app/models/bible/bible-group.model.ts
import { BibleBook } from './bible-book.model';

/**
 * Model class representing a group of Bible books
 */
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