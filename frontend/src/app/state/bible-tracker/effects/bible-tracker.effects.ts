import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, mergeMap, withLatestFrom, debounceTime, tap } from 'rxjs/operators';

import { BibleService } from '../../../core/services/bible.service';
import { BibleTrackerActions } from '../actions/bible-tracker.actions';
import { BookProgress, BibleStatisticsState } from '../models/bible-tracker.model';
import { selectBibleTrackerState } from '../selectors/bible-tracker.selectors';
import { BaseEffect } from '../../core/effects/base.effect';

@Injectable()
export class BibleTrackerEffects extends BaseEffect {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.init),
      mergeMap(() => [
        BibleTrackerActions.loadReadingProgress(),
        BibleTrackerActions.loadStatistics(),
      ])
    )
  );

  loadReadingProgress$ = createEffect((): Observable<Action> =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.loadReadingProgress),
      mergeMap(() =>
        this.bibleService.getUserReadingProgress().pipe(
          map((books: { [bookId: string]: BookProgress }) =>
            BibleTrackerActions.loadReadingProgressSuccess({ books })
          ),
          this.handleHttpError((error) =>
            BibleTrackerActions.loadReadingProgressFailure({ error })
          )
        )
      )
    )
  );

  markVersesAsRead$ = createEffect((): Observable<Action> =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.markVersesAsRead),
      mergeMap(({ bookId, chapter, verses }) =>
        this.bibleService.markVersesAsRead(bookId, chapter, verses).pipe(
          map(() =>
            BibleTrackerActions.markVersesAsReadSuccess({
              update: { bookId, chapter, verses },
              timestamp: new Date(),
            })
          ),
          this.handleHttpError((error) =>
            BibleTrackerActions.markVersesAsReadFailure({ error })
          )
        )
      )
    )
  );

  markChapterAsComplete$ = createEffect((): Observable<Action> =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.markChapterAsComplete),
      mergeMap(({ bookId, chapter }) =>
        this.bibleService.markChapterAsComplete(bookId, chapter).pipe(
          map(() =>
            BibleTrackerActions.markChapterAsCompleteSuccess({
              update: { bookId, chapter },
              timestamp: new Date(),
            })
          ),
          this.handleHttpError((error) =>
            BibleTrackerActions.markChapterAsCompleteFailure({ error })
          )
        )
      )
    )
  );

  // Update statistics after any progress change
  updateStatisticsAfterChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        BibleTrackerActions.markVersesAsReadSuccess,
        BibleTrackerActions.markChapterAsCompleteSuccess,
        BibleTrackerActions.markBookAsCompleteSuccess,
        BibleTrackerActions.bulkUpdateProgressSuccess
      ),
      debounceTime(500), // Debounce multiple rapid updates
      map(() => BibleTrackerActions.updateStatistics())
    )
  );

  updateStatistics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.updateStatistics),
      withLatestFrom(this.store.select(selectBibleTrackerState)),
      map(([_, state]) => {
        // Calculate statistics from current state
        const statistics = this.calculateStatistics(state.readingProgress.books);
        return BibleTrackerActions.loadStatisticsSuccess({ statistics });
      })
    )
  );

  // Auto-sync every 5 minutes when there are changes
  autoSync$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        BibleTrackerActions.markVersesAsReadSuccess,
        BibleTrackerActions.markChapterAsCompleteSuccess
      ),
      debounceTime(5 * 60 * 1000), // 5 minutes
      map(() => BibleTrackerActions.syncProgress())
    )
  );

  syncProgress$ = createEffect((): Observable<Action> =>
    this.actions$.pipe(
      ofType(BibleTrackerActions.syncProgress),
      withLatestFrom(this.store.select(selectBibleTrackerState)),
      mergeMap(([_, state]) =>
        this.bibleService.syncProgress(state.readingProgress.books).pipe(
          map(() =>
            BibleTrackerActions.syncProgressSuccess({ timestamp: new Date() })
          ),
          this.handleHttpError((error) =>
            BibleTrackerActions.syncProgressFailure({ error })
          )
        )
      )
    )
  );

  // Show notification on sync success
  syncSuccessNotification$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BibleTrackerActions.syncProgressSuccess),
        tap(() => {
          // You would inject a notification service here
          console.log('Progress synced successfully');
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private bibleService: BibleService
  ) {
    super();
  }

  private calculateStatistics(books: { [bookId: string]: BookProgress }): BibleStatisticsState {
    // Implementation of statistics calculation
    let totalVersesRead = 0;
    let chaptersCompleted = 0;
    let booksCompleted = 0;

    Object.values(books).forEach((book: any) => {
      let bookComplete = true;
      
      Object.values(book.chapters).forEach((chapter: any) => {
        totalVersesRead += chapter.versesRead.length;
        
        if (chapter.percentComplete === 100) {
          chaptersCompleted++;
        } else {
          bookComplete = false;
        }
      });
      
      if (bookComplete && Object.keys(book.chapters).length === book.totalChapters) {
        booksCompleted++;
      }
    });

    const overallPercentage = (totalVersesRead / 31102) * 100;

    return {
      overview: {
        totalBooks: 66,
        booksCompleted,
        totalChapters: 1189,
        chaptersCompleted,
        totalVerses: 31102,
        versesRead: totalVersesRead,
        overallPercentage,
        lastUpdated: new Date(),
      },
      streaks: {
        // Streak calculation would go here
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: new Date(),
        streakHistory: [],
      },
      loading: false,
      error: null,
    };
  }
}
