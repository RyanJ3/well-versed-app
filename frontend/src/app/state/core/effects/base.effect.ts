import { inject } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
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
}
