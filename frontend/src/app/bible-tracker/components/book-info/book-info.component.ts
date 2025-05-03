// components/book-info.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfirmationModalComponent } from '../../../shared/components/notification/confirmation-modal';
import { BibleService } from '../../../services/bible.service';
import { BibleBook } from '../../../models/bible.model';

@Component({
  selector: 'app-book-info',
  standalone: true,
  imports: [ConfirmationModalComponent],
  templateUrl: './book-info.component.html',
})
export class BookInfoComponent {
  @Input() currentBook: BibleBook | undefined = undefined;
  @Input() memorizedVerses: number = 0;
  @Input() totalVerses: number = 0;
  @Input() completedChapters: number = 0;
  @Input() inProgressChapters: number = 0;

  @Output() resetBook = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;

  constructor(private bibleService: BibleService) {
    // Default to first chapter of Psalms
    this.currentBook = this.bibleService.getBible().getBook("Psalms");
  }

  get percentComplete(): number {
    if (!this.totalVerses) return 0;
    return Math.round((this.memorizedVerses / this.totalVerses) * 100);
  }

  showConfirmModal(): void {
    this.isConfirmModalVisible = true;
  }

  confirmReset(): void {
    this.resetBook.emit();
    this.isConfirmModalVisible = false;
  }

  cancelReset(): void {
    this.isConfirmModalVisible = false;
  }
}
