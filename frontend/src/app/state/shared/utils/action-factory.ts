import { createAction, props } from '@ngrx/store';

// Create a factory for async actions (API calls)
export function createAsyncActions<TRequest extends object, TSuccess extends object, TFailure = Error>(
  source: string,
  event: string
) {
  return {
    request: createAction(
      `[${source}] ${event} Request`,
      props<TRequest>()
    ),
    success: createAction(
      `[${source}] ${event} Success`,
      props<TSuccess>()
    ),
    failure: createAction(
      `[${source}] ${event} Failure`,
      props<{ error: TFailure }>()
    )
  };
}
