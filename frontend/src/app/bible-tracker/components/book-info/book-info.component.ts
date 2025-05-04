// components/book-info.component.ts
import { Component } from '@angular/core';
import { BibleStatsComponent } from '../../bible-stats.component';

@Component({
  selector: 'app-book-info',
  standalone: true,
  templateUrl: './book-info.component.html',
})
export class BookInfoComponent extends BibleStatsComponent {

  isConfirmModalVisible: boolean = false;

  constructor() {
    super()
  }

  showConfirmModal(): void {
    this.isConfirmModalVisible = true;
  }

  confirmReset(): void {
    // this.selectedBook.reset();
    this.isConfirmModalVisible = false;
  }

  cancelReset(): void {
    this.isConfirmModalVisible = false;
  }
}
