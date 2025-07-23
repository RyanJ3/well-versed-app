import { ActionCreator, on } from '@ngrx/store';
import { EntityLoadingState } from '../../app.state';

// Helper for creating loading state reducers
export function createLoadingReducer<State extends Record<string, any>>(
  loadingKey: keyof State,
  requestAction: ActionCreator,
  successAction: ActionCreator,
  failureAction: ActionCreator<any, any>
) {
  return [
    on(requestAction, (state: State): State => ({
      ...state,
      [loadingKey]: {
        ...(state[loadingKey] as EntityLoadingState),
        isLoading: true,
        error: null,
      } as State[keyof State],
    })),
    on(successAction, (state: State): State => ({
      ...state,
      [loadingKey]: {
        ...(state[loadingKey] as EntityLoadingState),
        isLoading: false,
        isLoaded: true,
        error: null,
        lastFetch: new Date(),
      } as State[keyof State],
    })),
    on(failureAction, (state: State, { error }: { error: string }): State => ({
      ...state,
      [loadingKey]: {
        ...(state[loadingKey] as EntityLoadingState),
        isLoading: false,
        error,
      } as State[keyof State],
    })),
  ];
}

// Helper for creating entity adapter options
export function createEntityAdapterOptions<T extends Record<string, any>>(idSelector: keyof T) {
  return {
    selectId: (entity: T) => entity[idSelector] as string | number,
    sortComparer: false as const,
  };
}
