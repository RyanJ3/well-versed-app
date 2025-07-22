import { createAction, props } from '@ngrx/store';

export const setLoading = createAction(
  '[Loading] Set Loading',
  props<{ key: string; isLoading: boolean }>()
);

export const clearLoading = createAction(
  '[Loading] Clear Loading',
  props<{ key: string }>()
);

export const clearAllLoading = createAction('[Loading] Clear All Loading');
