import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UIState } from './ui.state';

export const selectUIState = createFeatureSelector<UIState>('ui');

export const selectLoading = (key: string) =>
  createSelector(selectUIState, (state) => state.loading[key]);

export const selectError = (key: string) =>
  createSelector(selectUIState, (state) => state.errors[key]);

export const selectActiveModal = createSelector(
  selectUIState,
  (state) => state.modals.activeModal
);

export const selectModalData = createSelector(
  selectUIState,
  (state) => state.modals.modalData
);

export const selectNotifications = createSelector(
  selectUIState,
  (state) => state.notifications
);
