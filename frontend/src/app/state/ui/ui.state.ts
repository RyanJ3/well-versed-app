import { NotificationMessage } from '../../core/services/utils/notification.service';

export interface UIState {
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;
  modals: {
    activeModal: string | null;
    modalData: any;
  };
  notifications: NotificationMessage[];
}
