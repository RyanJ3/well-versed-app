// Book-selector.component.ts - Updated for consolidated Bible model
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleService } from '../../../services/bible.service';
import { BibleBook, BookGroupType } from '../../../models/bible.model';

@Component({
  selector: 'app-book-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-selector.component.html',
  styleUrls: ['./book-selector.component.scss'],
})
export class BookSelectorComponent {
  @Input() booksInGroup: BibleBook[] = [];
  @Input() selectedGroup: BookGroupType = BookGroupType.LAW; 
  @Input() selectedBook: string = '';

  @Output() bookChange = new EventEmitter<string>();

  constructor(private bibleService: BibleService) {}

  selectBook(bookName: string): void {
    this.bookChange.emit(bookName);
  }

  getBookStats(bookName: string): number {
    const book = this.bibleService.getBook(bookName);
    return book?.percentComplete || 0;
  }

  getCompletedChapters(bookName: string): number {
    const book = this.bibleService.getBook(bookName);
    return book?.completedChapters || 0;
  }

  getTotalChapters(bookName: string): number {
    const book = this.bibleService.getBook(bookName);
    return book?.totalChapters || 0;
  }

  getMemorizedVerses(bookName: string): number {
    const book = this.bibleService.getBook(bookName);
    return book?.memorizedVerses || 0;
  }

  getTotalVerses(bookName: string): number {
    const book = this.bibleService.getBook(bookName);
    return book?.totalVerses || 0;
  }

  isBookCompleted(bookName: string): boolean {
    const book = this.bibleService.getBook(bookName);
    return book?.percentComplete === 100;
  }

  isBookInProgress(bookName: string): boolean {
    const book = this.bibleService.getBook(bookName);
    if (!book) return false;
    return book.memorizedVerses > 0 && book.percentComplete < 100;
  }
}