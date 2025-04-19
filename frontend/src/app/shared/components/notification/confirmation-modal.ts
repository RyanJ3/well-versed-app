// src/app/bible-tracker/components/confirmation-modal.component.ts
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" class="modal-backdrop">
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
          <button class="btn btn-danger" (click)="onConfirm()">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      width: 90%;
      max-width: 500px;
      overflow: hidden;
    }

    .modal-header {
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      background-color: #f8f9fa;
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
    }

    .modal-body {
      padding: 1.5rem;
      color: #4a5568;
      font-size: 1rem;
    }

    .modal-footer {
      padding: 1rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-size: 0.875rem;
    }

    .btn-secondary {
      background-color: #e2e8f0;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background-color: #cbd5e0;
    }

    .btn-danger {
      background-color: #e53e3e;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c53030;
    }
  `]
})
export class ConfirmationModalComponent {
  @Input() isVisible: boolean = false;
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to proceed?';
  @Input() confirmText: string = 'Confirm';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
