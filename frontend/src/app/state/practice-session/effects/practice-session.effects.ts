import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AppState } from '../app.state';
import { of, interval, timer } from 'rxjs';
import {
  map,
  mergeMap,
  catchError,
  withLatestFrom,
  tap,
  takeUntil,
  filter,
} from 'rxjs/operators';

import { PracticeService } from '@app/core/services/practice.service';
import { AudioService } from '@app/core/services/audio.service';
import { NotificationService } from '@app/core/services/notification.service';
import {
  PracticeSessionActions,
  PracticeKeyboardActions,
} from '../actions/practice-session.actions';
import {
  selectActiveSession,
  selectCurrentCard,
  selectSettings,
  selectSessionProgress,
} from '../selectors/practice-session.selectors';
import { BaseEffect } from '../../core/effects/base.effect';
import { ResponseQuality } from '../models/practice-session.model';

@Injectable()
export class PracticeSessionEffects extends BaseEffect {
  startSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PracticeSessionActions.startSession),
      mergeMap(({ request }) =>
        this.practiceService.startSession(request).pipe(
          map((session) =>
            PracticeSessionActions.startSessionSuccess({ session }),
          ),
          tap(() => {
            this.notificationService.info('Session started! Good luck!');
          }),
          this.handleHttpError((error) =>
            PracticeSessionActions.startSessionFailure({ error }),
          ),
        ),
      ),
    ),
  );

  // Auto-play audio when card is flipped (if enabled)
  autoPlayAudio$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PracticeSessionActions.flipCard),
        withLatestFrom(
          this.store.select(selectCurrentCard),
          this.store.select(selectSettings),
        ),
        filter(
          ([_, card, settings]) => settings.autoPlayAudio && !!card?.audioUrl,
        ),
        tap(([_, card]) => {
          if (card?.audioUrl) {
            this.audioService.play(card.audioUrl);
          }
        }),
      ),
    { dispatch: false },
  );

  submitResponse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PracticeSessionActions.submitResponse),
      withLatestFrom(this.store.select(selectActiveSession)),
      mergeMap(([action, session]) => {
        if (!session) {
          return of(
            PracticeSessionActions.submitResponseFailure({
              error: 'No active session',
            }),
          );
        }

        return this.practiceService
          .submitResponse({
            sessionId: session.id,
            cardId: action.cardId,
            quality: action.quality,
            responseTime: action.responseTime,
            hintsUsed: action.hintsUsed,
          })
          .pipe(
            map((response) =>
              PracticeSessionActions.submitResponseSuccess({ response }),
            ),
            tap(
              (
                successAction: ReturnType<
                  typeof PracticeSessionActions.submitResponseSuccess
                >,
              ) => {
                if (successAction.response.correct) {
                  this.notificationService.success('Correct! 🎉', {
                    duration: 1000,
                  });
                } else {
                  this.notificationService.error('Try again next time', {
                    duration: 1000,
                  });
                }
              },
            ),
            this.handleHttpError((error) =>
              PracticeSessionActions.submitResponseFailure({ error }),
            ),
          );
      }),
    ),
  );

  // Auto-advance to next card after response
  autoAdvance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PracticeSessionActions.submitResponseSuccess),
      withLatestFrom(
        this.store.select(selectSettings),
        this.store.select(selectSessionProgress),
      ),
      filter(([_, settings]) => settings.immediateAnswerFeedback),
      mergeMap(([_, __, progress]) => {
        return timer(1500).pipe(
          map(() => {
            if (progress.remainingCards > 0) {
              return PracticeSessionActions.showNextCard();
            } else {
              return PracticeSessionActions.completeSession();
            }
          }),
        );
      }),
    ),
  );

  completeSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PracticeSessionActions.completeSession),
      withLatestFrom(this.store.select(selectActiveSession)),
      mergeMap(([_, session]) => {
        if (!session) {
          return of(
            PracticeSessionActions.completeSessionFailure({
              error: 'No active session',
            }),
          );
        }

        return this.practiceService.completeSession(session.id).pipe(
          map((summary) =>
            PracticeSessionActions.completeSessionSuccess({ summary }),
          ),
          tap(
            (
              action: ReturnType<
                typeof PracticeSessionActions.completeSessionSuccess
              >,
            ) => {
              const { session } = action.summary;
              const message = `Session complete! ${session.correctCount}/${session.cardsStudied} correct (${Math.round(
                session.accuracy,
              )}%)`;
              this.notificationService.success(message);
              this.audioService.playSound('session-complete');
              action.summary.achievements.forEach((achievement: any) => {
                this.notificationService.info(
                  `🏆 Achievement Unlocked: ${achievement.title}`,
                  {
                    duration: 5000,
                  },
                );
              });
            },
          ),
          this.handleHttpError((error) =>
            PracticeSessionActions.completeSessionFailure({ error }),
          ),
        );
      }),
    ),
  );

  // Session timer
  sessionTimer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PracticeSessionActions.startSessionSuccess),
      mergeMap(({ session }) => {
        if (!session.settings.timeLimit) {
          return of();
        }

        const timeLimit = session.settings.timeLimit * 60 * 1000;

        return timer(timeLimit).pipe(
          takeUntil(
            this.actions$.pipe(
              ofType(
                PracticeSessionActions.completeSession,
                PracticeSessionActions.abandonSession,
              ),
            ),
          ),
          tap(() => {
            this.notificationService.warning('Time limit reached!');
          }),
          map(() => PracticeSessionActions.completeSession()),
        );
      }),
    ),
  );

  // Update performance metrics periodically
  updateMetrics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PracticeSessionActions.startSessionSuccess),
      mergeMap(() =>
        interval(5000).pipe(
          takeUntil(
            this.actions$.pipe(
              ofType(
                PracticeSessionActions.completeSession,
                PracticeSessionActions.abandonSession,
              ),
            ),
          ),
          map(() => PracticeSessionActions.updatePerformanceMetrics()),
        ),
      ),
    ),
  );

  // Keyboard shortcut handling
  keyboardShortcuts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PracticeKeyboardActions.pressEnter),
      withLatestFrom(
        this.store.select(selectActiveSession),
        this.store.select(selectCurrentCard),
        this.store.select((state) => state.practiceSession.ui),
      ),
      map(([_, session, card, ui]) => {
        if (!session || !card) return { type: 'NO_OP' };
        if (!ui.currentCardFlipped) {
          return PracticeSessionActions.flipCard();
        }
        if (!card.seen) {
          return PracticeSessionActions.submitResponse({
            cardId: card.id,
            quality: ResponseQuality.GOOD,
            responseTime: Date.now() - session.startTime.getTime(),
            hintsUsed: ui.showingHint ? 1 : 0,
          });
        }
        return PracticeSessionActions.showNextCard();
      }),
      filter((action) => action.type !== 'NO_OP'),
    ),
  );

  // Load session history on init
  loadHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PracticeSessionActions.loadSessionHistory),
      mergeMap(() =>
        this.practiceService.getSessionHistory().pipe(
          map((sessions) =>
            PracticeSessionActions.loadSessionHistorySuccess({ sessions }),
          ),
          this.handleHttpError((error) =>
            PracticeSessionActions.loadSessionHistoryFailure({ error }),
          ),
        ),
      ),
    ),
  );

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private practiceService: PracticeService,
    private audioService: AudioService,
    private notificationService: NotificationService,
  ) {
    super();
  }
}
