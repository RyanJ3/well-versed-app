import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError, ReplaySubject } from 'rxjs';
import { Store, StoreModule } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';
import { TestScheduler } from 'rxjs/testing';
import { take } from 'rxjs/operators';

import { PracticeSessionEffects } from './practice-session.effects';
import { PracticeSessionActions, PracticeKeyboardActions } from '../actions/practice-session.actions';
import { practiceSessionReducer } from '../reducers/practice-session.reducer';
import {
  ActiveSession,
  SessionType,
  SessionState,
  ResponseQuality,
  CardResponse,
  SessionSummary
} from '../models/practice-session.model';
import { PracticeService } from '@app/app/core/services/practice.service';
import { AudioService } from '@app/app/core/services/audio.service';
import { NotificationService } from '@app/app/core/services/notification.service';

describe('PracticeSessionEffects', () => {
  let actions$: ReplaySubject<any>;
  let effects: PracticeSessionEffects;
  let practiceService: jasmine.SpyObj<PracticeService>;
  let audioService: jasmine.SpyObj<AudioService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let store: Store;
  let testScheduler: TestScheduler;

  const mockSession: ActiveSession = {
    id: 'test-session-123',
    deckId: 1,
    deckName: 'Test Deck',
    type: SessionType.REVIEW,
    cards: [
      {
        id: 1,
        deckId: 1,
        front: 'Question 1',
        back: 'Answer 1',
        hint: 'Hint 1',
        audioUrl: '/audio/card1.mp3',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        order: 0,
        seen: false
      }
    ],
    currentIndex: 0,
    responses: [],
    startTime: new Date('2024-01-15T10:00:00'),
    settings: {
      sessionType: SessionType.REVIEW,
      cardLimit: 20,
      timeLimit: 30,
      newCardsPerSession: 5,
      reviewOrder: 'due_date' as any,
      prioritizeDue: true,
      includeNewCards: true,
      showHints: true,
      autoPlayAudio: true,
      flipAnimation: true,
      fontSize: 'medium',
      immediateAnswerFeedback: true,
      requireTypedAnswer: false,
      caseSensitive: false,
      showProgress: true,
      easyBonus: 1.3,
      intervalModifier: 1.0,
      lapseMultiplier: 0.5,
      minimumInterval: 1
    },
    state: SessionState.IN_PROGRESS
  };

  beforeEach(() => {
    const practiceServiceSpy = jasmine.createSpyObj('PracticeService', [
      'startSession',
      'submitResponse',
      'completeSession',
      'getSessionHistory'
    ]);

    const audioServiceSpy = jasmine.createSpyObj('AudioService', [
      'play',
      'playSound'
    ]);

    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'warning',
      'info'
    ]);

    actions$ = new ReplaySubject(1);

    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({ practiceSession: practiceSessionReducer })
      ],
      providers: [
        PracticeSessionEffects,
        provideMockActions(() => actions$),
        { provide: PracticeService, useValue: practiceServiceSpy },
        { provide: AudioService, useValue: audioServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    });

    effects = TestBed.inject(PracticeSessionEffects);
    practiceService = TestBed.inject(PracticeService) as jasmine.SpyObj<PracticeService>;
    audioService = TestBed.inject(AudioService) as jasmine.SpyObj<AudioService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    store = TestBed.inject(Store);

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  describe('startSession$', () => {
    it('should return startSessionSuccess and show notification on success', (done) => {
      const request = {
        deckId: 1,
        settings: { cardLimit: 20 }
      };

      practiceService.startSession.and.returnValue(of(mockSession));

      actions$.next(PracticeSessionActions.startSession({ request }));

      effects.startSession$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.startSessionSuccess({ session: mockSession }));
        expect(practiceService.startSession).toHaveBeenCalledWith(request);
        expect(notificationService.info).toHaveBeenCalledWith('Session started! Good luck!');
        done();
      });
    });

    it('should return startSessionFailure on API error', (done) => {
      const error = new HttpErrorResponse({
        error: { message: 'Deck not found' },
        status: 404
      });

      practiceService.startSession.and.returnValue(throwError(() => error));

      actions$.next(PracticeSessionActions.startSession({ request: { deckId: 999, settings: {} } }));

      effects.startSession$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.startSessionFailure({
          error: 'Resource not found'
        }));
        done();
      });
    });
  });

  describe('autoPlayAudio$', () => {
    it('should play audio when card is flipped and auto-play is enabled', (done) => {
      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: mockSession }));

      actions$.next(PracticeSessionActions.flipCard());

      effects.autoPlayAudio$.pipe(take(1)).subscribe(() => {
        expect(audioService.play).toHaveBeenCalledWith('/audio/card1.mp3');
        done();
      });
    });

    it('should not play audio when auto-play is disabled', (done) => {
      const sessionWithoutAutoPlay = {
        ...mockSession,
        settings: {
          ...mockSession.settings,
          autoPlayAudio: false
        }
      };

      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: sessionWithoutAutoPlay }));

      actions$.next(PracticeSessionActions.flipCard());

      setTimeout(() => {
        expect(audioService.play).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should not play audio when card has no audio URL', (done) => {
      const sessionWithoutAudio = {
        ...mockSession,
        cards: [{
          ...mockSession.cards[0],
          audioUrl: undefined
        }]
      };

      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: sessionWithoutAudio }));

      actions$.next(PracticeSessionActions.flipCard());

      setTimeout(() => {
        expect(audioService.play).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('submitResponse$', () => {
    it('should submit response and show success notification for correct answer', (done) => {
      const mockResponse: CardResponse = {
        cardId: 1,
        quality: ResponseQuality.GOOD,
        responseTime: 3000,
        hintsUsed: 0,
        audioPlayed: false,
        timestamp: new Date(),
        correct: true,
        newInterval: 4,
        newEaseFactor: 2.5
      };

      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: mockSession }));
      practiceService.submitResponse.and.returnValue(of(mockResponse));

      actions$.next(PracticeSessionActions.submitResponse({
        cardId: 1,
        quality: ResponseQuality.GOOD,
        responseTime: 3000,
        hintsUsed: 0
      }));

      effects.submitResponse$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.submitResponseSuccess({ response: mockResponse }));
        expect(notificationService.success).toHaveBeenCalledWith('Correct! 🎉', 1000);
        done();
      });
    });

    it('should show error notification for incorrect answer', (done) => {
      const mockResponse: CardResponse = {
        cardId: 1,
        quality: ResponseQuality.AGAIN,
        responseTime: 3000,
        hintsUsed: 1,
        audioPlayed: false,
        timestamp: new Date(),
        correct: false,
        newInterval: 1,
        newEaseFactor: 1.3
      };

      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: mockSession }));
      practiceService.submitResponse.and.returnValue(of(mockResponse));

      actions$.next(PracticeSessionActions.submitResponse({
        cardId: 1,
        quality: ResponseQuality.AGAIN,
        responseTime: 3000,
        hintsUsed: 1
      }));

      effects.submitResponse$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.submitResponseSuccess({ response: mockResponse }));
        expect(notificationService.error).toHaveBeenCalledWith('Try again next time', 1000);
        done();
      });
    });

    it('should handle no active session', (done) => {
      actions$.next(PracticeSessionActions.submitResponse({
        cardId: 1,
        quality: ResponseQuality.GOOD,
        responseTime: 3000,
        hintsUsed: 0
      }));

      effects.submitResponse$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.submitResponseFailure({
          error: 'No active session'
        }));
        expect(practiceService.submitResponse).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('autoAdvance$', () => {
    it('should complete session when no cards remain', (done) => {
      const sessionLastCard = {
        ...mockSession,
        cards: [{
          ...mockSession.cards[0],
          seen: true
        }]
      };

      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: sessionLastCard }));

      const mockResponse: CardResponse = {
        cardId: 1,
        quality: ResponseQuality.GOOD,
        responseTime: 3000,
        hintsUsed: 0,
        audioPlayed: false,
        timestamp: new Date(),
        correct: true,
        newInterval: 4,
        newEaseFactor: 2.5
      };

      actions$.next(PracticeSessionActions.submitResponseSuccess({ response: mockResponse }));

      setTimeout(() => {
        effects.autoAdvance$.pipe(take(1)).subscribe(result => {
          expect(result.type).toBe('[Practice Session] Complete Session');
          done();
        });
      }, 1600);
    });

    it('should not auto-advance when immediate feedback is disabled', (done) => {
      const sessionNoFeedback = {
        ...mockSession,
        settings: {
          ...mockSession.settings,
          immediateAnswerFeedback: false
        }
      };

      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: sessionNoFeedback }));

      const mockResponse: CardResponse = {
        cardId: 1,
        quality: ResponseQuality.GOOD,
        responseTime: 3000,
        hintsUsed: 0,
        audioPlayed: false,
        timestamp: new Date(),
        correct: true,
        newInterval: 4,
        newEaseFactor: 2.5
      };

      actions$.next(PracticeSessionActions.submitResponseSuccess({ response: mockResponse }));

      let emitted = false;
      effects.autoAdvance$.subscribe(() => {
        emitted = true;
      });

      setTimeout(() => {
        expect(emitted).toBe(false);
        done();
      }, 2000);
    });
  });

  describe('completeSession$', () => {
    it('should complete session and show notifications', (done) => {
      const mockSummary: SessionSummary = {
        session: {
          id: 'test-session-123',
          deckId: 1,
          type: SessionType.REVIEW,
          startTime: new Date('2024-01-15T10:00:00'),
          endTime: new Date('2024-01-15T10:15:00'),
          duration: 900,
          cardsStudied: 20,
          correctCount: 18,
          accuracy: 90,
          averageResponseTime: 3.5,
          masteryChange: 5,
          streakMaintained: true
        },
        cardUpdates: [],
        achievements: [
          {
            id: 'first-perfect',
            title: 'Perfect Session',
            description: 'Complete a session with 100% accuracy',
            icon: 'trophy',
            unlockedAt: new Date()
          }
        ],
        nextReviewSummary: {
          today: 5,
          tomorrow: 10,
          thisWeek: 25,
          thisMonth: 50
        }
      };

      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: mockSession }));
      practiceService.completeSession.and.returnValue(of(mockSummary));

      actions$.next(PracticeSessionActions.completeSession());

      effects.completeSession$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.completeSessionSuccess({ summary: mockSummary }));
        expect(notificationService.success).toHaveBeenCalledWith(
          'Session complete! 18/20 correct (90%)'
        );
        expect(audioService.playSound).toHaveBeenCalledWith('session-complete');
        expect(notificationService.info).toHaveBeenCalledWith(
          '🏆 Achievement Unlocked: Perfect Session',
          5000
        );
        done();
      });
    });

    it('should handle no active session', (done) => {
      actions$.next(PracticeSessionActions.completeSession());

      effects.completeSession$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.completeSessionFailure({
          error: 'No active session'
        }));
        done();
      });
    });
  });

  describe('sessionTimer$', () => {
    it('should complete session when time limit is reached', (done) => {
      const sessionWithShortLimit = {
        ...mockSession,
        settings: {
          ...mockSession.settings,
          timeLimit: 0.01
        }
      };

      actions$.next(PracticeSessionActions.startSessionSuccess({ session: sessionWithShortLimit }));

      effects.sessionTimer$.pipe(take(1)).subscribe(result => {
        expect(result.type).toBe('[Practice Session] Complete Session');
        expect(notificationService.warning).toHaveBeenCalledWith('Time limit reached!');
        done();
      });
    });

    it('should not set timer when no time limit', (done) => {
      const sessionNoLimit = {
        ...mockSession,
        settings: {
          ...mockSession.settings,
          timeLimit: null
        }
      };

      actions$.next(PracticeSessionActions.startSessionSuccess({ session: sessionNoLimit }));

      let emitted = false;
      effects.sessionTimer$.subscribe(() => {
        emitted = true;
      });

      setTimeout(() => {
        expect(emitted).toBe(false);
        done();
      }, 100);
    });

    it('should cancel timer when session is completed', (done) => {
      const sessionWithLimit = {
        ...mockSession,
        settings: {
          ...mockSession.settings,
          timeLimit: 1
        }
      };

      actions$.next(PracticeSessionActions.startSessionSuccess({ session: sessionWithLimit }));

      setTimeout(() => {
        actions$.next(PracticeSessionActions.completeSession());
      }, 100);

      let timerEmitted = false;
      effects.sessionTimer$.subscribe(() => {
        timerEmitted = true;
      });

      setTimeout(() => {
        expect(timerEmitted).toBe(false);
        done();
      }, 200);
    });
  });

  describe('updateMetrics$', () => {
    it('should periodically update performance metrics', (done) => {
      actions$.next(PracticeSessionActions.startSessionSuccess({ session: mockSession }));

      let updateCount = 0;
      effects.updateMetrics$.pipe(take(2)).subscribe(result => {
        expect(result.type).toBe('[Practice Session] Update Performance Metrics');
        updateCount++;

        if (updateCount === 2) {
          done();
        }
      });
    });

    it('should stop updating when session is completed', (done) => {
      actions$.next(PracticeSessionActions.startSessionSuccess({ session: mockSession }));

      let updateCount = 0;
      effects.updateMetrics$.subscribe(() => {
        updateCount++;
      });

      setTimeout(() => {
        actions$.next(PracticeSessionActions.completeSession());
      }, 6000);

      setTimeout(() => {
        expect(updateCount).toBe(1);
        done();
      }, 12000);
    });
  });

  describe('keyboardShortcuts$', () => {
    it('should flip card when Enter pressed and card not flipped', (done) => {
      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: mockSession }));

      actions$.next(PracticeKeyboardActions.pressEnter());

      effects.keyboardShortcuts$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.flipCard());
        done();
      });
    });

    it('should submit response when Enter pressed and card is flipped', (done) => {
      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: mockSession }));
      store.dispatch(PracticeSessionActions.flipCard());

      actions$.next(PracticeKeyboardActions.pressEnter());

      effects.keyboardShortcuts$.subscribe(result => {
        expect(result.type).toBe('[Practice Session] Submit Response');
        const action = result as any;
        expect(action.cardId).toBe(1);
        expect(action.quality).toBe(ResponseQuality.GOOD);
        expect(action.hintsUsed).toBe(0);
        done();
      });
    });

    it('should count hints used when submitting response', (done) => {
      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: mockSession }));
      store.dispatch(PracticeSessionActions.flipCard());
      store.dispatch(PracticeSessionActions.showHint());

      actions$.next(PracticeKeyboardActions.pressEnter());

      effects.keyboardShortcuts$.subscribe(result => {
        const action = result as any;
        expect(action.hintsUsed).toBe(1);
        done();
      });
    });

    it('should go to next card when Enter pressed and card already seen', (done) => {
      const sessionWithSeenCard = {
        ...mockSession,
        cards: [{
          ...mockSession.cards[0],
          seen: true
        }]
      };

      store.dispatch(PracticeSessionActions.startSessionSuccess({ session: sessionWithSeenCard }));
      store.dispatch(PracticeSessionActions.flipCard());

      actions$.next(PracticeKeyboardActions.pressEnter());

      effects.keyboardShortcuts$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.showNextCard());
        done();
      });
    });

    it('should not emit when no session or card', (done) => {
      actions$.next(PracticeKeyboardActions.pressEnter());

      let emitted = false;
      effects.keyboardShortcuts$.subscribe(() => {
        emitted = true;
      });

      setTimeout(() => {
        expect(emitted).toBe(false);
        done();
      }, 100);
    });
  });

  describe('loadHistory$', () => {
    it('should load session history successfully', (done) => {
      const mockHistory = [
        {
          id: 'session-1',
          deckId: 1,
          type: SessionType.REVIEW,
          startTime: new Date('2024-01-14'),
          endTime: new Date('2024-01-14'),
          duration: 600,
          cardsStudied: 10,
          correctCount: 8,
          accuracy: 80,
          averageResponseTime: 3,
          masteryChange: 2,
          streakMaintained: true
        }
      ];

      practiceService.getSessionHistory.and.returnValue(of(mockHistory));

      actions$.next(PracticeSessionActions.loadSessionHistory());

      effects.loadHistory$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.loadSessionHistorySuccess({ sessions: mockHistory }));
        expect(practiceService.getSessionHistory).toHaveBeenCalled();
        done();
      });
    });

    it('should handle error loading history', (done) => {
      const error = new HttpErrorResponse({
        error: { message: 'Failed to load history' },
        status: 500
      });

      practiceService.getSessionHistory.and.returnValue(throwError(() => error));

      actions$.next(PracticeSessionActions.loadSessionHistory());

      effects.loadHistory$.subscribe(result => {
        expect(result).toEqual(PracticeSessionActions.loadSessionHistoryFailure({
          error: 'Server error. Please try again later'
        }));
        done();
      });
    });
  });
});
