import { ActionCreator, createReducer, on } from '@ngrx/store';

// Create a factory for handling loading states
export function createLoadingReducer(
  requestAction: ActionCreator,
  successAction: ActionCreator,
  failureAction: ActionCreator
) {
  return createReducer(
    false,
    on(requestAction, () => true),
    on(successAction, failureAction, () => false)
  );
}

// Create a factory for handling errors
export function createErrorReducer(
  requestAction: ActionCreator,
  successAction: ActionCreator,
  failureAction: ActionCreator
) {
  return createReducer<Error | null>(
    null,
    on(requestAction, () => null),
    on(successAction, () => null),
    on(failureAction, (_, { error }) => error)
  );
}
