// Book-selector.component.ts - Updated for consolidated Bible model
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleService } from '../../../services/bible.service';
import { BibleBook, BibleGroup, BookGroupType } from '../../../models/bible.model';
import { BaseBibleComponent } from '../../base-bible.component';

@Component({
  selector: 'app-book-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-selector.component.html',
  styleUrls: ['./book-selector.component.scss'],
})
export class BookSelectorComponent extends BaseBibleComponent {
  @Input() booksInGroup: BibleBook[] = [];
  @Input() selectedGroup: BibleGroup; 
  @Input() selectedBook: BibleBook;

  @Output() bookChange = new EventEmitter<BibleBook>();

  constructor() {
    super();

    this.selectedBook = this.getDefaultBook();
    this.selectedGroup = this.getDefaultGroup();
    this.booksInGroup = this.selectedGroup?.books;
  }

  selectBook(bibleBook: BibleBook): void {
    this.bookChange.emit(bibleBook);
  }

}