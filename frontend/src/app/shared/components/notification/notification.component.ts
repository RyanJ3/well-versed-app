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
      class="notification warning"
      *ngIf="message"
      [class.show]="visible"
    >
      {{ message }}
    </div>
  `,
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  message = '';
  visible = false;
  private sub?: Subscription;

  constructor(private notifications: NotificationService) {}

  ngOnInit() {
    this.sub = this.notifications.messages$.subscribe((msg: NotificationMessage) => {
      this.message = msg.text;
      this.visible = true;
      setTimeout(() => (this.visible = false), 3000);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
