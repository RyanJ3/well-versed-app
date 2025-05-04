// components/testament-selector.component.ts - Enhanced version with vertical layout
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BibleStatsComponent } from '../../bible-stats.component';

@Component({
  selector: 'app-testament-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testament-selector.component.html',
  styleUrls: ['./testament-selector.component.scss'],
})
export class TestamentSelectorComponent extends BibleStatsComponent {

  isConfirmModalVisible: boolean = false;

  constructor() {
    super();
  }

  showConfirmModal(): void {
    this.isConfirmModalVisible = true;
  }

  confirmReset(): void {
    this.isConfirmModalVisible = false;
  }

  cancelReset(): void {
    this.isConfirmModalVisible = false;
  }

}