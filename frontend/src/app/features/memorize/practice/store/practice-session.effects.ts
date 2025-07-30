import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { Observable, timer, filter, tap, switchMap, withLatestFrom, takeUntil, map } from 'rxjs';
import { PracticeSessionStoreState } from './practice-session.state';
import { practiceSelectors } from './practice-session.selectors';
import { 
  StartSessionRequest,
  ResponseQuality,
  SessionState,
  StudyCard
} from '../../../../state/practice-session/models/practice-session.model';
import { PracticeService } from '../../../../core/services/practice.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AudioService } from '../../../../core/services/audio.service';

export function createPracticeEffects(
  store: ComponentStore<PracticeSessionStoreState>,
  practiceService: PracticeService,
  notificationService: NotificationService,
  audioService: AudioService
) {
  const setLoading = store.updater((state, loading: boolean) => ({
    ...state,
    loading,
    error: loading ? null : state.error
  }));

  const setError = store.updater((state, error: string) => ({
    ...state,
    error,
    loading: false
  }));

  const startSession = store.effect((request$: Observable<StartSessionRequest>) =>
    request$.pipe(
      tap(() => setLoading(true)),
      switchMap(request =>
        practiceService.startSession(request).pipe(
          tapResponse(
            (session: any) => {
              store.patchState({
                sessionId: session.id,
                deckId: session.deckId,
                deckName: session.deckName,
                cards: session.cards,
                currentIndex: 0,
                responses: [],
                startTime: session.startTime,
                sessionState: SessionState.IN_PROGRESS,
                settings: { ...(store as any).get().settings, ...session.settings },
                cardFlipped: false,
                showingHint: false,
                currentStreak: 0,
                loading: false,
                error: null
              });
              
              notificationService.info('Session started! Good luck! 🎯');
              startTimeLimitTimer(store, notificationService);
            },
            (error: unknown) => {
              setError('Failed to start session');
              notificationService.error('Failed to start session');
            }
          )
        )
      )
    )
  );

  const submitResponse = store.effect((response$: Observable<{
    quality: ResponseQuality;
    timeSpent?: number;
  }>) =>
    response$.pipe(
      withLatestFrom(
        store.select((state: PracticeSessionStoreState) => ({
          sessionId: state.sessionId,
          currentCard: practiceSelectors.currentCard(state),
          startTime: state.startTime,
          hintsUsed: state.showingHint ? 1 : 0,
          settings: state.settings
        }))
      ),
      filter(([_, data]) => !!data.sessionId && !!data.currentCard),
      switchMap(([response, data]) => {
        const responseTime = response.timeSpent || 
          (Date.now() - (data.startTime?.getTime() || Date.now()));

        return practiceService.submitResponse({
          sessionId: data.sessionId!,
          cardId: data.currentCard!.id,
          quality: response.quality,
          responseTime,
          hintsUsed: data.hintsUsed
        }).pipe(
          tapResponse(
            (cardResponse: any) => {
              // Update state with response
              store.patchState((state: PracticeSessionStoreState) => {
                const newResponses = [...state.responses, cardResponse];
                const isCorrect = cardResponse.correct;
                const newStreak = isCorrect ? state.currentStreak + 1 : 0;
                
                return {
                  responses: newResponses,
                  currentStreak: newStreak,
                  longestStreak: Math.max(newStreak, state.longestStreak),
                  cards: state.cards.map(card =>
                    card.id === cardResponse.cardId
                      ? { ...card, seen: true }
                      : card
                  )
                };
              });

              // Show feedback
              if (cardResponse.correct) {
                notificationService.success('Correct! 🎉', 1000);
              } else {
                notificationService.info('Keep practicing! 💪', 1000);
              }

              // Auto-advance if enabled
              if (data.settings.immediateAnswerFeedback) {
                timer(1500).subscribe(() => {
                  const state = (store as any).get();
                  if (state.currentIndex < state.cards.length - 1) {
                    store.updater((s: PracticeSessionStoreState) => ({
                      ...s,
                      currentIndex: s.currentIndex + 1,
                      cardFlipped: false,
                      showingHint: false
                    }))();
                  } else {
                    completeSession();
                  }
                });
              }
            },
            (error: unknown) => {
              notificationService.error('Failed to submit response');
            }
          )
        );
      })
    )
  );

  const completeSession = store.effect((trigger$: Observable<void>) =>
    trigger$.pipe(
      withLatestFrom(store.select((state: PracticeSessionStoreState) => state.sessionId)),
      filter(([_, sessionId]) => !!sessionId),
      switchMap(([_, sessionId]) =>
        practiceService.completeSession(sessionId!).pipe(
          tapResponse(
            (summary: any) => {
              const { accuracy, correctCount, cardsStudied } = summary.session;
              
              notificationService.success(
                `Session complete! ${correctCount}/${cardsStudied} correct (${Math.round(accuracy)}%)`,
                5000
              );
              
              // Play completion sound
              audioService.playSound('session-complete');
              
              // Show achievements
              summary.achievements.forEach((achievement: any) => {
                setTimeout(() => {
                  notificationService.info(
                    `🏆 ${achievement.title}: ${achievement.description}`,
                    5000
                  );
                }, 1000);
              });
              
              // Reset to initial state
              store.setState((state: PracticeSessionStoreState) => ({
                ...state,
                sessionId: null,
                deckId: null,
                deckName: '',
                cards: [],
                currentIndex: 0,
                responses: [],
                startTime: null,
                sessionState: SessionState.COMPLETED,
                cardFlipped: false,
                showingHint: false,
                currentStreak: 0,
                loading: false,
                error: null
              }));
            },
            (error: unknown) => {
              notificationService.error('Failed to complete session');
            }
          )
        )
      )
    )
  );

  const setupAutoPlayAudio = () => {
    store
      .select((state: PracticeSessionStoreState) => ({
        flipped: state.cardFlipped,
        autoPlay: state.settings.autoPlayAudio,
        card: practiceSelectors.currentCard(state),
      }))
      .pipe(
        filter(({ flipped, autoPlay, card }) => flipped && autoPlay && !!card?.audioUrl),
        tap(({ card }) => {
          audioService.play(card!.audioUrl!);
        })
      )
      .subscribe();
  };

  return {
    startSession,
    submitResponse,
    completeSession,
    setupAutoPlayAudio
  };
}

function startTimeLimitTimer(
  store: ComponentStore<PracticeSessionStoreState>,
  notificationService: NotificationService
): void {
  const timeLimit = (store as any).get().settings.timeLimit;
  if (!timeLimit) return;

  timer(timeLimit * 60 * 1000)
    .pipe(
      takeUntil(
        store.select((state: PracticeSessionStoreState) => state.sessionState).pipe(
          filter((state: SessionState) => state !== SessionState.IN_PROGRESS)
        )
      )
    )
    .subscribe(() => {
      notificationService.warning('Time limit reached! ⏰');
      store.effect(() => (store as any).get())(); // Trigger complete session
    });
}
