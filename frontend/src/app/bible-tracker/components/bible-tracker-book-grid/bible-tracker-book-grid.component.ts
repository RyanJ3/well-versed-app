import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleBook } from '../../../core/models/bible';
import { BibleGroup } from '../../../core/models/bible/bible-group.modle';

@Component({
  selector: 'app-bible-tracker-book-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bible-tracker-book-grid.component.html',
  styleUrls: ['./bible-tracker-book-grid.component.scss']
})
export class BibleTrackerBookGridComponent {
  @Input() selectedGroup: BibleGroup | null = null;
  @Input() selectedBook: BibleBook | null = null;
  @Output() bookSelected = new EventEmitter<BibleBook>();
  
  isApocryphalBook(book: BibleBook): boolean {
    return book.canonicalAffiliation !== 'All' &&
      (book.canonicalAffiliation === 'Catholic' ||
        book.canonicalAffiliation === 'Eastern Orthodox');
  }
  
  getBookColor(book: BibleBook): string {
    const percent = book.percentComplete;
    if (percent >= 80) return '#10b981';
    if (percent >= 50) return '#3b82f6';
    if (percent >= 20) return '#8b5cf6';
    return '#f59e0b';
  }
  
  selectBook(book: BibleBook): void {
    this.bookSelected.emit(book);
  }
}