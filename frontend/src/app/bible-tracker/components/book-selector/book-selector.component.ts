import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BibleBook, BibleGroup } from '../../../models/bible.model';
import { BaseBibleComponent } from '../../base-bible.component';

@Component({
  selector: 'app-book-selector',
  standalone: true,
  templateUrl: './book-selector.component.html',
  styleUrls: ['./book-selector.component.scss'],
  imports: [CommonModule],
})
export class BookSelectorComponent extends BaseBibleComponent {

  @Input() selectedGroup: BibleGroup = this.getDefaultGroup();
  @Input() selectedBook: BibleBook = this.getDefaultBook();
  @Output() bookChange = new EventEmitter<BibleBook>();

  isConfirmModalVisible = false;

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