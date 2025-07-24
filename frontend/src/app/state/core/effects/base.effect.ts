import { inject } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { tap, finalize, catchError } from 'rxjs/operators';
import { UIActions } from '../../ui/ui.actions';

export abstract class BaseEffects {
  protected store = inject(Store);

  protected handleError = (source: string) =>
    (error: Error, _caught: Observable<Action>) => {
      console.error(`Error in ${source}:`, error);
      return of(UIActions.setError({ key: source, error }));
    };

  protected withLoadingState = (key: string) =>
    (source: Observable<Action>) =>
      source.pipe(
        tap(() => this.store.dispatch(UIActions.setLoading({ key, loading: true }))),
        finalize(() => this.store.dispatch(UIActions.setLoading({ key, loading: false })))
      );

  protected handleHttpError<T extends Action>(
    actionCreator: (error: string) => T
  ) {
    return catchError<any, Observable<T>>((error: any) => {
      let errorMessage = 'An error occurred';

      if (error.status === 0) {
        errorMessage = 'Unable to connect to server';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please login again';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      return of(actionCreator(errorMessage));
    });
  }
}
