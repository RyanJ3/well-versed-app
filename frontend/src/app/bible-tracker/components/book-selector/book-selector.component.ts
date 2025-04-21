// In book-selector.component.ts - Enhanced version
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { BIBLE_DATA, BibleBook } from '../../models';
import { BibleTrackerService } from '../../bible-tracker-service';

@Component({
  selector: 'app-book-selector',
  standalone: true,
  imports: [NgClass, NgFor, NgIf],
  templateUrl: './book-selector.component.html',
  styleUrls: ['./book-selector.component.scss'],
})
export class BookSelectorComponent {
  @Input() booksInGroup: BibleBook[] = [];
  @Input() selectedGroup: string = '';
  @Input() selectedBook: string = '';

  @Output() bookChange = new EventEmitter<string>();

  constructor(private bibleTrackerService: BibleTrackerService) {}

  get getBooksInGroup(): BibleBook[] {
    // Return the books in the original order provided by the input
    return BIBLE_DATA.getBooksByGroup(this.selectedGroup);
  }

  selectBook(bookName: string): void {
    this.bookChange.emit(bookName);
  }

  getBookStats(bookName: string): number {
    return this.bibleTrackerService.calculateBookStats(bookName)
      .percentComplete;
  }

  getCompletedChapters(bookName: string): number {
    return this.bibleTrackerService.calculateBookStats(bookName)
    .memorizedChapters;
  }

  isBookCompleted(bookName: string): boolean {
    const stats = this.bibleTrackerService.calculateBookStats(bookName);
    return stats.percentComplete === 100;
  }

  isBookInProgress(bookName: string): boolean {
    const stats = this.bibleTrackerService.calculateBookStats(bookName);
    return !this.isBookCompleted(bookName) && stats.memorizedVerses > 0;
  }
}
