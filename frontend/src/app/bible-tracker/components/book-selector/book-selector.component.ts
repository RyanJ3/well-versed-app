import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BibleStatsComponent } from '../../bible-stats.component';

@Component({
  selector: 'app-book-selector',
  standalone: true,
  templateUrl: './book-selector.component.html',
  styleUrls: ['./book-selector.component.scss'],
  imports: [CommonModule],
})
export class BookSelectorComponent extends BibleStatsComponent {

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