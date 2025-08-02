import { createAction, props } from '@ngrx/store';
import { NotificationMessage } from '../../core/services/utils/notification.service';

export const UIActions = {
  setLoading: createAction(
    '[UI] Set Loading',
    props<{ key: string; loading: boolean }>()
  ),
  setError: createAction(
    '[UI] Set Error',
    props<{ key: string; error: Error | null }>()
  ),
  openModal: createAction(
    '[UI] Open Modal',
    props<{ modalId: string; data?: any }>()
  ),
  closeModal: createAction('[UI] Close Modal'),
  addNotification: createAction(
    '[UI] Add Notification',
    props<{ notification: NotificationMessage }>()
  ),
  removeNotification: createAction(
    '[UI] Remove Notification',
    props<{ id: string }>()
  )
};
