import { ActionCreator, on } from '@ngrx/store';
import { EntityLoadingState } from '../../app.state';

// Helper for creating loading state reducers
export function createLoadingReducer<State>(
  loadingKey: keyof State,
  requestAction: ActionCreator,
  successAction: ActionCreator,
  failureAction: ActionCreator<any, any>
) {
  return [
    on(requestAction, (state): State => ({
      ...state,
      [loadingKey]: {
        ...(state[loadingKey] as any),
        isLoading: true,
        error: null,
      },
    })),
    on(successAction, (state): State => ({
      ...state,
      [loadingKey]: {
        ...(state[loadingKey] as any),
        isLoading: false,
        isLoaded: true,
        error: null,
        lastFetch: new Date(),
      },
    })),
    on(failureAction, (state, { error }): State => ({
      ...state,
      [loadingKey]: {
        ...(state[loadingKey] as any),
        isLoading: false,
        error,
      },
    })),
  ];
}

// Helper for creating entity adapter options
export function createEntityAdapterOptions<T>(idSelector: keyof T) {
  return {
    selectId: (entity: T) => entity[idSelector] as any,
    sortComparer: false,
  };
}
