import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, NotificationMessage } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="notification"
      *ngIf="message"
      [class.show]="visible"
      [class.success]="type === 'success'"
      [class.warning]="type === 'warning'"
      [class.danger]="type === 'danger'"
      [class.info]="type === 'info'"
    >
      {{ message }}
    </div>
  `,
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  message = '';
  type: 'info' | 'success' | 'warning' | 'danger' = 'info';
  visible = false;
  private sub?: Subscription;
  private timeout?: any;

  constructor(private notifications: NotificationService) {}

  ngOnInit() {
    this.sub = this.notifications.messages$.subscribe((msg: NotificationMessage) => {
      this.message = msg.text;
      this.type = msg.type;
      this.visible = true;
      
      // Clear any existing timeout
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      // Set new timeout
      this.timeout = setTimeout(() => {
        this.visible = false;
      }, 3000);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
}