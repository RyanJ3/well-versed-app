import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface NotificationMessage {
  type: 'info' | 'success' | 'warning' | 'danger';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private subject = new Subject<NotificationMessage>();
  messages$: Observable<NotificationMessage> = this.subject.asObservable();

  notify(message: NotificationMessage) {
    this.subject.next(message);
  }

  warning(text: string) {
    this.notify({ type: 'warning', text });
  }
}
