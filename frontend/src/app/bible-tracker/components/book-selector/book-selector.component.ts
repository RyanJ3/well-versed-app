// Book-selector.component.ts - Updated for consolidated Bible model
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleService } from '../../../services/bible.service';
import { BibleBook, BookGroupType } from '../../../models/bible.model';
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
  @Input() selectedGroup: BookGroupType = BookGroupType.LAW; 
  @Input() selectedBook: BibleBook | undefined;;

  @Output() bookChange = new EventEmitter<string>();

  constructor() {
    super();
  }

  selectBook(bookName: string): void {
    this.bookChange.emit(bookName);
  }

}