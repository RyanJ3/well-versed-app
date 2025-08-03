// frontend/src/app/components/ui/modal/modal.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ModalService, ModalConfig, ModalResult } from '@services/utils/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="onOverlayClick($event)">
      <div class="modal-container" [class]="'modal-' + config.type">
        <div class="modal-header">
          <div class="modal-icon">
            <svg *ngIf="config.type === 'info'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg *ngIf="config.type === 'warning'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg *ngIf="config.type === 'danger'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg *ngIf="config.type === 'success'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="modal-title">{{ config.title }}</h2>
        </div>
        
        <div class="modal-body">
          <p class="modal-message">{{ config.message }}</p>
        </div>
        
        <div class="modal-footer">
          <button 
            *ngIf="config.showCancel" 
            class="btn btn-secondary" 
            (click)="onCancel()">
            {{ config.cancelText }}
          </button>
          <button 
            class="btn"
            [class.btn-primary]="config.type !== 'danger'"
            [class.btn-danger]="config.type === 'danger'"
            (click)="onConfirm()">
            {{ config.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {
  isVisible = false;
  config: ModalConfig = {
    title: '',
    message: '',
    type: 'info',
    showCancel: true,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  };

  private resolver?: (result: ModalResult) => void;
  private destroy$ = new Subject<void>();

  constructor(private modalService: ModalService) {}

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (!this.isVisible) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancel();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.onConfirm();
    }
  }

  ngOnInit() {
    this.modalService.modal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ config, resolver }) => {
        this.config = config;
        this.resolver = resolver;
        this.isVisible = true;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onCancel();
    }
  }

  onConfirm() {
    this.isVisible = false;
    if (this.resolver) {
      this.resolver({ confirmed: true });
    }
  }

  onCancel() {
    this.isVisible = false;
    if (this.resolver) {
      this.resolver({ confirmed: false });
    }
  }
}