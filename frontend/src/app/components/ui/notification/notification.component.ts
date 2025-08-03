import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, NotificationMessage } from '@services/utils/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="notification"
      [class.info]="currentMessage.type === 'info'"
      [class.success]="currentMessage.type === 'success'"
      [class.warning]="currentMessage.type === 'warning'"
      [class.danger]="currentMessage.type === 'danger'"
      [class.show]="visible"
      *ngIf="currentMessage"
    >
      <svg *ngIf="currentMessage.type === 'success'" class="notification-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <svg *ngIf="currentMessage.type === 'warning'" class="notification-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <svg *ngIf="currentMessage.type === 'danger'" class="notification-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <svg *ngIf="currentMessage.type === 'info'" class="notification-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {{ currentMessage.text }}
    </div>
  `,
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  currentMessage: NotificationMessage | null = null;
  visible = false;
  private sub?: Subscription;
  private hideTimeout?: any;

  constructor(private notifications: NotificationService) {}

  ngOnInit() {
    this.sub = this.notifications.messages$.subscribe((msg: NotificationMessage) => {
      this.currentMessage = msg;
      this.visible = true;
      
      // Clear any existing timeout
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      
      // Hide after duration or default 3 seconds
      const duration = msg.duration || 3000;
      this.hideTimeout = setTimeout(() => {
        this.visible = false;
        // Clear message after animation
        setTimeout(() => {
          this.currentMessage = null;
        }, 300);
      }, duration);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }
}