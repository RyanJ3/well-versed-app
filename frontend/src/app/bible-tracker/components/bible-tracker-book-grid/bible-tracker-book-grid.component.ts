import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookProgress } from '@app/state/bible-tracker/models/bible-tracker.model';

@Component({
  selector: 'app-bible-tracker-book-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bible-tracker-book-grid.component.html',
  styleUrls: ['./bible-tracker-book-grid.component.scss']
})
export class BibleTrackerBookGridComponent {
  @Input() selectedBook: BookProgress | null = null;
  @Input() books: BookProgress[] = [];
  @Input() viewMode: 'grid' | 'list' | 'reading' = 'grid';
  @Output() versesMarked = new EventEmitter<{ bookId: string; chapter: number; verses: number[] }>();
  @Output() bookSelected = new EventEmitter<BookProgress>();
  
  isApocryphalBook(_book: BookProgress): boolean {
    return false;
  }
  
  getBookProgressColor(book: BookProgress): string {
    const percent = book.percentComplete;
    if (percent >= 80) return '#10b981';
    if (percent >= 50) return '#3b82f6';
    if (percent >= 20) return '#8b5cf6';
    return '#f59e0b';
  }
  
  selectBook(book: BookProgress): void {
    this.bookSelected.emit(book);
  }
}