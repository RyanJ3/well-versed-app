// components/book-info.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfirmationModalComponent } from '../../../shared/components/notification/confirmation-modal';
import { BibleService } from '../../../services/bible.service';
import { BibleBook, BibleChapter } from '../../../models/bible.model';
import { BaseBibleComponent } from '../../base-bible.component';

@Component({
  selector: 'app-book-info',
  standalone: true,
  templateUrl: './book-info.component.html',
})
export class BookInfoComponent extends BaseBibleComponent {

  @Input() selectedBook: BibleBook = this.getDefaultBook();
  @Input() selectedChapter: BibleChapter = this.getDefaultChapter();

  isConfirmModalVisible: boolean = false;

  constructor() {
    super()
  }

  showConfirmModal(): void {
    this.isConfirmModalVisible = true;
  }

  confirmReset(): void {
    this.selectedBook.reset();
    this.isConfirmModalVisible = false;
  }

  cancelReset(): void {
    this.isConfirmModalVisible = false;
  }
}
