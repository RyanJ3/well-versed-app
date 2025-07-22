import { createAction, props } from '@ngrx/store';

export const setError = createAction(
  '[Error] Set Error',
  props<{ key: string; error: string }>()
);

export const clearError = createAction(
  '[Error] Clear Error',
  props<{ key: string }>()
);

export const clearAllErrors = createAction('[Error] Clear All Errors');
