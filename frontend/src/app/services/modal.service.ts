// frontend/src/app/services/modal.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ModalConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  showCancel?: boolean;
}

export interface ModalResult {
  confirmed: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new Subject<{ config: ModalConfig; resolver: (result: ModalResult) => void }>();
  modal$ = this.modalSubject.asObservable();

  confirm(config: ModalConfig): Promise<ModalResult> {
    return new Promise((resolve) => {
      const defaultConfig: ModalConfig = {
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'info',
        showCancel: true,
        ...config
      };

      this.modalSubject.next({
        config: defaultConfig,
        resolver: resolve
      });
    });
  }

  alert(title: string, message: string, type: 'info' | 'warning' | 'danger' | 'success' = 'info'): Promise<void> {
    return this.confirm({
      title,
      message,
      type,
      showCancel: false,
      confirmText: 'OK'
    }).then(() => {});
  }

  danger(title: string, message: string, confirmText: string = 'Delete'): Promise<boolean> {
    return this.confirm({
      title,
      message,
      type: 'danger',
      confirmText,
      showCancel: true
    }).then(result => result.confirmed);
  }

  success(title: string, message: string): Promise<void> {
    return this.alert(title, message, 'success');
  }
}