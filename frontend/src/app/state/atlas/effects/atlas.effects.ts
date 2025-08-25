import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { AtlasService } from '@services/api/atlas.service';
import * as AtlasActions from '../actions/atlas.actions';

@Injectable()
export class AtlasEffects {
  loadJourneys$;
  loadJourney$;
  selectJourney$;

  constructor(
    private actions$: Actions,
    private atlasService: AtlasService
  ) {
    this.loadJourneys$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AtlasActions.loadJourneys),
        mergeMap(() =>
          this.atlasService.getJourneys().pipe(
            map(journeys => AtlasActions.loadJourneysSuccess({ journeys })),
            catchError(error => of(AtlasActions.loadJourneysFailure({
              error: error.message || 'Failed to load journeys'
            })))
          )
        )
      )
    );

    this.loadJourney$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AtlasActions.loadJourney),
        mergeMap((action) =>
          this.atlasService.getJourney(action.journeyId).pipe(
            map(response => AtlasActions.loadJourneySuccess({
              journey: response.journey,
              cities: response.cities
            })),
            catchError(error => of(AtlasActions.loadJourneyFailure({
              error: error.message || 'Failed to load journey'
            })))
          )
        )
      )
    );

    this.selectJourney$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AtlasActions.selectJourney),
        map((action) => AtlasActions.loadJourney({ journeyId: action.journeyId }))
      )
    );
  }
}