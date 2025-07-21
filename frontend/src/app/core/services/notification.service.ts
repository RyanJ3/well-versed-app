import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface NotificationMessage {
  type: 'info' | 'success' | 'warning' | 'danger';
  text: string;
  duration?: number; // Optional duration in milliseconds
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private subject = new Subject<NotificationMessage>();
  messages$: Observable<NotificationMessage> = this.subject.asObservable();

  notify(message: NotificationMessage) {
    this.subject.next(message);
  }

  info(text: string, duration?: number) {
    this.notify({ type: 'info', text, duration });
  }

  success(text: string, duration?: number) {
    this.notify({ type: 'success', text, duration });
  }

  warning(text: string, duration?: number) {
    this.notify({ type: 'warning', text, duration });
  }

  danger(text: string, duration?: number) {
    this.notify({ type: 'danger', text, duration });
  }

  error(text: string, duration?: number) {
    this.danger(text, duration); // Alias for danger
  }
}