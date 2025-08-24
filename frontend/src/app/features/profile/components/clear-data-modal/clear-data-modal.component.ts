// frontend/src/app/features/profile/components/clear-data-modal/clear-data-modal.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clear-data-modal',
  standalone: true,
  templateUrl: './clear-data-modal.component.html',
  styleUrls: ['./clear-data-modal.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class ClearDataModalComponent {
  @Input() visible = false;
  @Input() isClearing = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  confirmText = '';

  get isConfirmEnabled(): boolean {
    return this.confirmText.toLowerCase() === 'delete all data';
  }

  onClose(): void {
    if (this.isClearing) return;
    this.confirmText = '';
    this.close.emit();
  }

  onConfirm(): void {
    if (!this.isConfirmEnabled || this.isClearing) return;
    this.confirm.emit();
  }
}
