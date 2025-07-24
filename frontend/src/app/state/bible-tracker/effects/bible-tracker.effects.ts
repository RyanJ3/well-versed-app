import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, mergeMap, withLatestFrom, debounceTime } from 'rxjs/operators';
import { BibleService } from '../../../core/services/bible.service';
import { BibleTrackerActions } from '../actions/bible-tracker.actions';
import { BibleTrackerState } from '../models/bible-tracker.model';
import { BibleBook } from '../../../core/models/bible';
import { selectBibleTrackerState } from '../selectors/bible-tracker.selectors';
import { BaseEffects } from '../../core/effects/base.effect';

@Injectable()
export class BibleTrackerEffects extends BaseEffects {
  private actions$ = inject(Actions);
  protected override store = inject(Store<BibleTrackerState>);
  private bibleService = inject(BibleService);

  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.init),
      mergeMap(() => [
        BibleTrackerActions.loadReadingProgress({}),
        BibleTrackerActions.loadStatistics({}),
      ])
    )
  );

  loadProgress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.loadReadingProgress),
      mergeMap(() =>
        this.bibleService.getUserReadingProgress().pipe(
          map((books) => BibleTrackerActions.loadReadingProgressSuccess({ books })),
          this.handleHttpError((error) => BibleTrackerActions.loadReadingProgressFailure({ error }))
        )
      )
    )
  );

  markVerses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.markVersesAsRead),
      mergeMap(({ bookId, chapter, verses }) =>
        this.bibleService.markVersesAsRead(bookId, chapter, verses).pipe(
          map(() =>
            BibleTrackerActions.markVersesAsReadSuccess({
              update: { bookId, chapter, verses },
              timestamp: new Date().toISOString(),
            })
          ),
          this.handleHttpError((error) => BibleTrackerActions.markVersesAsReadFailure({ error }))
        )
      )
    )
  );

  markChapter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.markChapterAsComplete),
      mergeMap(({ bookId, chapter }) =>
        this.bibleService.markChapterAsComplete(bookId, chapter).pipe(
          map(() =>
            BibleTrackerActions.markChapterAsCompleteSuccess({
              update: { bookId, chapter },
              timestamp: new Date().toISOString(),
            })
          ),
          this.handleHttpError((error) => BibleTrackerActions.markChapterAsCompleteFailure({ error }))
        )
      )
    )
  );


  loadStatistics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.loadStatistics),
      withLatestFrom(this.store.select(selectBibleTrackerState)),
      mergeMap(([_, state]) => {
        const books = Object.fromEntries(
          Object.entries(state.books.entities).filter(([, b]) => !!b)
        ) as { [bookId: string]: BibleBook };
        return this.bibleService.calculateStatistics(books).pipe(
          map((statistics) => BibleTrackerActions.loadStatisticsSuccess({ statistics })),
          this.handleHttpError((error) => BibleTrackerActions.loadStatisticsFailure({ error }))
        );
      })
    )
  );

  sync$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.syncProgress),
      withLatestFrom(this.store.select(selectBibleTrackerState)),
      mergeMap(([_, state]) => {
        const books = Object.fromEntries(
          Object.entries(state.books.entities).filter(([, b]) => !!b)
        ) as { [bookId: string]: BibleBook };
        return this.bibleService.syncProgress(books).pipe(
          map(() => BibleTrackerActions.syncProgressSuccess({ timestamp: new Date().toISOString() })),
          this.handleHttpError((error) => BibleTrackerActions.syncProgressFailure({ error }))
        );
      })
    )
  );

  updateStatisticsAfterChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        BibleTrackerActions.markVersesAsReadSuccess,
        BibleTrackerActions.markChapterAsCompleteSuccess,
        BibleTrackerActions.bulkUpdateProgressSuccess
      ),
      debounceTime(500),
      map(() => BibleTrackerActions.loadStatistics({}))
    )
  );

  constructor() { super(); }
}
