import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, timer, EMPTY } from 'rxjs';
import {
  map,
  mergeMap,
  catchError,
  withLatestFrom,
  tap,
  filter,
  debounceTime,
  switchMap,
  concatMap,
  retry
} from 'rxjs/operators';

import { BibleMemorizationActions } from '../actions/bible-memorization.actions';
import { BibleService } from '../../../core/services/bible.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { 
  selectUserId, 
  selectIncludeApocrypha,
  selectIsDataStale,
  selectBibleDataWithProgress,
  selectDetailedProgressSegments
} from '../selectors/bible-memorization.selectors';
import { BaseEffects } from '../../core/effects/base.effect';

@Injectable()
export class BibleMemorizationEffects extends BaseEffects {
  private actions$ = inject(Actions);
  protected override store = inject(Store);
  private bibleService = inject(BibleService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  // Initialize the feature
  initialize$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleMemorizationActions.initialize),
      withLatestFrom(this.userService.currentUser$),
      mergeMap(([_, user]) => {
        if (!user) {
          return of(BibleMemorizationActions.initializeFailure({ 
            error: 'No user found' 
          }));
        }
        
        // Update preferences from user
        const actions = [
          BibleMemorizationActions.updateApocryphaPreference({ 
            includeApocrypha: user.includeApocrypha || false 
          }),
          BibleMemorizationActions.loadMemorizationProgress({ 
            userId: user.id as number 
          })
        ];
        
        return actions;
      })
    )
  );

  // Load memorization progress
  loadMemorizationProgress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleMemorizationActions.loadMemorizationProgress),
      withLatestFrom(
        this.store.select(selectIncludeApocrypha),
        this.store.select(selectIsDataStale)
      ),
      filter(([action, _, isStale]) => action.forceRefresh || isStale),
      switchMap(([action, includeApocrypha]) =>
        this.bibleService.getUserVerses(action.userId, includeApocrypha).pipe(
          map(verses => BibleMemorizationActions.loadMemorizationProgressSuccess({ verses })),
          catchError(error => of(BibleMemorizationActions.loadMemorizationProgressFailure({ 
            error: error.message || 'Failed to load memorization progress' 
          })))
        )
      )
    )
  );

  // Toggle verse memorization
  toggleVerseMemorization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleMemorizationActions.toggleVerseMemorization),
      concatMap(request => {
        // Determine if we're adding or removing the verse
        // This is handled optimistically in the reducer, so we just need to sync with server
        const practiceCount = 1; // For now, always 1 when memorizing
        
        return this.bibleService.saveVerse(
          request.userId,
          request.bookId,
          request.chapterNumber,
          request.verseNumber,
          practiceCount
        ).pipe(
          map(() => BibleMemorizationActions.toggleVerseMemorizationSuccess({ request })),
          catchError(error => of(BibleMemorizationActions.toggleVerseMemorizationFailure({ 
            request,
            error: error.message || 'Failed to save verse' 
          })))
        );
      })
    )
  );

  // Memorize all chapter verses
  memorizeAllChapterVerses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleMemorizationActions.memorizeAllChapterVerses),
      withLatestFrom(this.store.select(selectBibleDataWithProgress)),
      concatMap(([operation, bibleData]) => {
        const book = bibleData.getBookById(operation.bookId);
        const bookName = book?.name || 'Book';
        
        return this.bibleService.saveChapter(
          operation.userId,
          operation.bookId,
          operation.chapterNumber!
        ).pipe(
          map(() => BibleMemorizationActions.memorizeAllChapterVersesSuccess({ 
            operation,
            bookName,
            chapterNumber: operation.chapterNumber
          })),
          catchError(error => of(BibleMemorizationActions.memorizeAllChapterVersesFailure({ 
            error: error.message || 'Failed to memorize chapter' 
          })))
        );
      })
    )
  );

  // Clear all chapter verses
  clearAllChapterVerses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleMemorizationActions.clearAllChapterVerses),
      withLatestFrom(this.store.select(selectBibleDataWithProgress)),
      concatMap(([operation, bibleData]) => {
        const book = bibleData.getBookById(operation.bookId);
        const bookName = book?.name || 'Book';
        
        return this.bibleService.clearChapter(
          operation.userId,
          operation.bookId,
          operation.chapterNumber!
        ).pipe(
          map(() => BibleMemorizationActions.clearAllChapterVersesSuccess({ 
            operation,
            bookName,
            chapterNumber: operation.chapterNumber
          })),
          catchError(error => of(BibleMemorizationActions.clearAllChapterVersesFailure({ 
            error: error.message || 'Failed to clear chapter' 
          })))
        );
      })
    )
  );

  // Memorize all book verses
  memorizeAllBookVerses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleMemorizationActions.memorizeAllBookVerses),
      withLatestFrom(this.store.select(selectBibleDataWithProgress)),
      concatMap(([operation, bibleData]) => {
        const book = bibleData.getBookById(operation.bookId);
        const bookName = book?.name || 'Book';
        
        return this.bibleService.saveBook(
          operation.userId,
          operation.bookId
        ).pipe(
          map(() => BibleMemorizationActions.memorizeAllBookVersesSuccess({ 
            operation,
            bookName
          })),
          catchError(error => of(BibleMemorizationActions.memorizeAllBookVersesFailure({ 
            error: error.message || 'Failed to memorize book' 
          })))
        );
      })
    )
  );

  // Clear all book verses
  clearAllBookVerses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleMemorizationActions.clearAllBookVerses),
      withLatestFrom(this.store.select(selectBibleDataWithProgress)),
      concatMap(([operation, bibleData]) => {
        const book = bibleData.getBookById(operation.bookId);
        const bookName = book?.name || 'Book';
        
        return this.bibleService.clearBook(
          operation.userId,
          operation.bookId
        ).pipe(
          map(() => BibleMemorizationActions.clearAllBookVersesSuccess({ 
            operation,
            bookName
          })),
          catchError(error => of(BibleMemorizationActions.clearAllBookVersesFailure({ 
            error: error.message || 'Failed to clear book' 
          })))
        );
      })
    )
  );

  // Update preferences
  updateApocryphaPreference$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleMemorizationActions.updateApocryphaPreference),
      withLatestFrom(this.store.select(selectUserId)),
      tap(([action, userId]) => {
        // Update user preference in service
        this.userService.updateUser({ 
          includeApocrypha: action.includeApocrypha 
        }).subscribe();
      }),
      // Reload data with new preference
      map(([_, userId]) => BibleMemorizationActions.loadMemorizationProgress({ 
        userId, 
        forceRefresh: true 
      }))
    )
  );

  // Calculate statistics after data changes
  calculateStatistics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        BibleMemorizationActions.loadMemorizationProgressSuccess,
        BibleMemorizationActions.toggleVerseMemorizationSuccess,
        BibleMemorizationActions.memorizeAllChapterVersesSuccess,
        BibleMemorizationActions.clearAllChapterVersesSuccess,
        BibleMemorizationActions.memorizeAllBookVersesSuccess,
        BibleMemorizationActions.clearAllBookVersesSuccess,
        BibleMemorizationActions.toggleProgressViewMode
      ),
      debounceTime(300), // Debounce rapid changes
      withLatestFrom(
        this.store.select(selectBibleDataWithProgress),
        this.store.select(selectDetailedProgressSegments)
      ),
      map(([_, bibleData, progressSegments]) => {
        return BibleMemorizationActions.calculateStatisticsSuccess({
          totalVersesMemorized: bibleData.memorizedVerses,
          percentageComplete: bibleData.percentComplete,
          progressSegments
        });
      })
    )
  );

  // Reload data after successful bulk operations
  reloadAfterBulkOperation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        BibleMemorizationActions.memorizeAllChapterVersesSuccess,
        BibleMemorizationActions.clearAllChapterVersesSuccess,
        BibleMemorizationActions.memorizeAllBookVersesSuccess,
        BibleMemorizationActions.clearAllBookVersesSuccess
      ),
      withLatestFrom(this.store.select(selectUserId)),
      map(([_, userId]) => BibleMemorizationActions.loadMemorizationProgress({ 
        userId, 
        forceRefresh: true 
      }))
    )
  );

  // Success notifications
  showSuccessNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        BibleMemorizationActions.memorizeAllChapterVersesSuccess,
        BibleMemorizationActions.clearAllChapterVersesSuccess,
        BibleMemorizationActions.memorizeAllBookVersesSuccess,
        BibleMemorizationActions.clearAllBookVersesSuccess
      ),
      tap(action => {
        let message = '';
        
        switch (action.type) {
          case BibleMemorizationActions.memorizeAllChapterVersesSuccess.type:
            message = `All verses in ${action.bookName} ${action.chapterNumber} have been marked as memorized.`;
            break;
          case BibleMemorizationActions.clearAllChapterVersesSuccess.type:
            message = `All verses in ${action.bookName} ${action.chapterNumber} have been cleared.`;
            break;
          case BibleMemorizationActions.memorizeAllBookVersesSuccess.type:
            message = `${action.bookName} has been marked as memorized.`;
            break;
          case BibleMemorizationActions.clearAllBookVersesSuccess.type:
            message = `${action.bookName} has been cleared.`;
            break;
        }
        
        this.notificationService.success(message, 3000);
      })
    ),
    { dispatch: false }
  );

  // Error notifications
  showErrorNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        BibleMemorizationActions.loadMemorizationProgressFailure,
        BibleMemorizationActions.toggleVerseMemorizationFailure,
        BibleMemorizationActions.memorizeAllChapterVersesFailure,
        BibleMemorizationActions.clearAllChapterVersesFailure,
        BibleMemorizationActions.memorizeAllBookVersesFailure,
        BibleMemorizationActions.clearAllBookVersesFailure
      ),
      tap(action => {
        this.notificationService.error(action.error, 5000);
      })
    ),
    { dispatch: false }
  );

  // Retry failed operations
  retryFailedOperations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BibleMemorizationActions.retryFailedOperation),
      filter(action => action.attemptNumber < 3), // Max 3 retries
      mergeMap(action => 
        timer(1000 * Math.pow(2, action.attemptNumber)).pipe( // Exponential backoff
          map(() => action.operation)
        )
      )
    )
  );

  constructor() {
    super();
  }
}
