import { practiceSessionReducer, initialState } from './practice-session.reducer';
import { PracticeSessionActions, PracticeKeyboardActions } from '../actions/practice-session.actions';
import {
  PracticeSessionState,
  SessionType,
  SessionState,
  ResponseQuality,
  ActiveSession,
  CardResponse
} from '../models/practice-session.model';

describe('PracticeSessionReducer', () => {
  describe('unknown action', () => {
    it('should return the initial state', () => {
      const action = { type: 'Unknown' } as any;
      const state = practiceSessionReducer(initialState, action);

      expect(state).toBe(initialState);
    });
  });

  describe('Session lifecycle', () => {
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
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          order: 0,
          seen: false
        },
        {
          id: 2,
          deckId: 1,
          front: 'Question 2',
          back: 'Answer 2',
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          order: 1,
          seen: false
        }
      ],
      currentIndex: 0,
      responses: [],
      startTime: new Date('2024-01-15T10:00:00'),
      settings: initialState.settings,
      state: SessionState.IN_PROGRESS
    };

    it('should start a session successfully', () => {
      const action = PracticeSessionActions.startSessionSuccess({ session: mockSession });
      const state = practiceSessionReducer(initialState, action);

      expect(state.activeSession).toEqual(mockSession);
      expect(state.ui).toEqual(initialState.ui);
    });

    it('should pause a session', () => {
      const stateWithSession = {
        ...initialState,
        activeSession: mockSession
      } as PracticeSessionState;

      const action = PracticeSessionActions.pauseSession();
      const state = practiceSessionReducer(stateWithSession, action);

      expect(state.activeSession?.state).toBe(SessionState.PAUSED);
    });

    it('should resume a paused session', () => {
      const stateWithPausedSession = {
        ...initialState,
        activeSession: {
          ...mockSession,
          state: SessionState.PAUSED
        }
      } as PracticeSessionState;

      const action = PracticeSessionActions.resumeSession();
      const state = practiceSessionReducer(stateWithPausedSession, action);

      expect(state.activeSession?.state).toBe(SessionState.IN_PROGRESS);
    });

    it('should not crash when pausing without active session', () => {
      const action = PracticeSessionActions.pauseSession();
      const state = practiceSessionReducer(initialState, action);

      expect(state.activeSession).toBeNull();
    });

    it('should complete session and update history', () => {
      const stateWithSession = {
        ...initialState,
        activeSession: mockSession
      } as PracticeSessionState;

      const summary = {
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
        achievements: [],
        nextReviewSummary: {
          today: 5,
          tomorrow: 10,
          thisWeek: 25,
          thisMonth: 50
        }
      };

      const action = PracticeSessionActions.completeSessionSuccess({ summary });
      const state = practiceSessionReducer(stateWithSession, action);

      expect(state.activeSession).toBeNull();
      expect(state.sessionHistory).toContain(summary.session);
      expect(state.sessionHistory.length).toBe(1);
    });

    it('should limit session history to 50 entries', () => {
      const existingSessions = Array.from({ length: 50 }, (_, i) => ({
        id: `session-${i}`,
        deckId: 1,
        type: SessionType.REVIEW,
        startTime: new Date(),
        endTime: new Date(),
        duration: 600,
        cardsStudied: 10,
        correctCount: 8,
        accuracy: 80,
        averageResponseTime: 3,
        masteryChange: 2,
        streakMaintained: true
      }));

      const stateWithFullHistory = {
        ...initialState,
        sessionHistory: existingSessions
      } as PracticeSessionState;

      const newSummary = {
        session: {
          id: 'new-session',
          deckId: 1,
          type: SessionType.REVIEW,
          startTime: new Date(),
          endTime: new Date(),
          duration: 300,
          cardsStudied: 5,
          correctCount: 5,
          accuracy: 100,
          averageResponseTime: 2,
          masteryChange: 3,
          streakMaintained: true
        },
        cardUpdates: [],
        achievements: [],
        nextReviewSummary: {
          today: 0,
          tomorrow: 0,
          thisWeek: 0,
          thisMonth: 0
        }
      };

      const action = PracticeSessionActions.completeSessionSuccess({ summary: newSummary });
      const state = practiceSessionReducer(stateWithFullHistory, action);

      expect(state.sessionHistory.length).toBe(50);
      expect(state.sessionHistory[0]).toEqual(newSummary.session);
      expect(state.sessionHistory[49]).toEqual(existingSessions[48]);
    });
  });

  describe('Card navigation', () => {
    const mockSession: ActiveSession = {
      id: 'test-session',
      deckId: 1,
      deckName: 'Test Deck',
      type: SessionType.REVIEW,
      cards: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        deckId: 1,
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        order: i,
        seen: false
      })),
      currentIndex: 2,
      responses: [],
      startTime: new Date(),
      settings: initialState.settings,
      state: SessionState.IN_PROGRESS
    };

    it('should navigate to next card and reset UI state', () => {
      const stateWithSession = {
        ...initialState,
        activeSession: mockSession,
        ui: {
          ...initialState.ui,
          currentCardFlipped: true,
          showingHint: true,
          answerRevealed: true,
          feedbackVisible: true
        }
      } as PracticeSessionState;

      const action = PracticeSessionActions.showNextCard();
      const state = practiceSessionReducer(stateWithSession, action);

      expect(state.activeSession?.currentIndex).toBe(3);
      expect(state.ui.currentCardFlipped).toBe(false);
      expect(state.ui.showingHint).toBe(false);
      expect(state.ui.answerRevealed).toBe(false);
      expect(state.ui.feedbackVisible).toBe(false);
    });

    it('should not navigate past last card', () => {
      const stateAtLastCard = {
        ...initialState,
        activeSession: {
          ...mockSession,
          currentIndex: 4
        }
      } as PracticeSessionState;

      const action = PracticeSessionActions.showNextCard();
      const state = practiceSessionReducer(stateAtLastCard, action);

      expect(state.activeSession?.currentIndex).toBe(4);
    });

    it('should navigate to previous card', () => {
      const stateWithSession = {
        ...initialState,
        activeSession: mockSession
      } as PracticeSessionState;

      const action = PracticeSessionActions.showPreviousCard();
      const state = practiceSessionReducer(stateWithSession, action);

      expect(state.activeSession?.currentIndex).toBe(1);
    });

    it('should not navigate before first card', () => {
      const stateAtFirstCard = {
        ...initialState,
        activeSession: {
          ...mockSession,
          currentIndex: 0
        }
      } as PracticeSessionState;

      const action = PracticeSessionActions.showPreviousCard();
      const state = practiceSessionReducer(stateAtFirstCard, action);

      expect(state.activeSession?.currentIndex).toBe(0);
    });
  });

  describe('Card interactions', () => {
    it('should flip card and reveal answer', () => {
      const action = PracticeSessionActions.flipCard();
      const state = practiceSessionReducer(initialState, action);

      expect(state.ui.currentCardFlipped).toBe(true);
      expect(state.ui.answerRevealed).toBe(true);
    });

    it('should toggle card flip state', () => {
      const flippedState: PracticeSessionState = {
        ...initialState,
        ui: {
          ...initialState.ui,
          currentCardFlipped: true,
          answerRevealed: true
        }
      };

      const action = PracticeSessionActions.flipCard();
      const state = practiceSessionReducer(flippedState, action);

      expect(state.ui.currentCardFlipped).toBe(false);
      expect(state.ui.answerRevealed).toBe(true);
    });

    it('should show hint', () => {
      const action = PracticeSessionActions.showHint();
      const state = practiceSessionReducer(initialState, action);

      expect(state.ui.showingHint).toBe(true);
    });

    it('should handle space key to flip card', () => {
      const action = PracticeKeyboardActions.pressSpace();
      const state = practiceSessionReducer(initialState, action);

      expect(state.ui.currentCardFlipped).toBe(true);
      expect(state.ui.answerRevealed).toBe(true);
    });

    it('should handle H key to show hint', () => {
      const action = PracticeKeyboardActions.pressH();
      const state = practiceSessionReducer(initialState, action);

      expect(state.ui.showingHint).toBe(true);
    });
  });

  describe('Response submission', () => {
    const mockSession: ActiveSession = {
      id: 'test-session',
      deckId: 1,
      deckName: 'Test Deck',
      type: SessionType.REVIEW,
      cards: [
        {
          id: 1,
          deckId: 1,
          front: 'Question 1',
          back: 'Answer 1',
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          order: 0,
          seen: false
        }
      ],
      currentIndex: 0,
      responses: [],
      startTime: new Date(),
      settings: initialState.settings,
      state: SessionState.IN_PROGRESS
    };

    it('should record response and update card state', () => {
      const stateWithSession = {
        ...initialState,
        activeSession: mockSession
      } as PracticeSessionState;

      const response: CardResponse = {
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

      const action = PracticeSessionActions.submitResponseSuccess({ response });
      const state = practiceSessionReducer(stateWithSession, action);

      expect(state.activeSession?.responses).toContain(response);
      expect(state.activeSession?.cards[0].seen).toBe(true);
      expect(state.activeSession?.cards[0].lastResponseQuality).toBe(ResponseQuality.GOOD);
    });

    it('should update streak on correct response', () => {
      const stateWithStreak = {
        ...initialState,
        activeSession: mockSession,
        performance: {
          ...initialState.performance,
          currentStreak: 5,
          longestStreak: 10
        }
      } as PracticeSessionState;

      const response: CardResponse = {
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

      const action = PracticeSessionActions.submitResponseSuccess({ response });
      const state = practiceSessionReducer(stateWithStreak, action);

      expect(state.performance.currentStreak).toBe(6);
      expect(state.performance.longestStreak).toBe(10);
    });

    it('should reset streak on incorrect response', () => {
      const stateWithStreak = {
        ...initialState,
        activeSession: mockSession,
        performance: {
          ...initialState.performance,
          currentStreak: 5,
          longestStreak: 10
        }
      } as PracticeSessionState;

      const response: CardResponse = {
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

      const action = PracticeSessionActions.submitResponseSuccess({ response });
      const state = practiceSessionReducer(stateWithStreak, action);

      expect(state.performance.currentStreak).toBe(0);
      expect(state.performance.longestStreak).toBe(10);
    });

    it('should update longest streak when current exceeds it', () => {
      const stateWithStreak = {
        ...initialState,
        activeSession: mockSession,
        performance: {
          ...initialState.performance,
          currentStreak: 10,
          longestStreak: 10
        }
      } as PracticeSessionState;

      const response: CardResponse = {
        cardId: 1,
        quality: ResponseQuality.EASY,
        responseTime: 2000,
        hintsUsed: 0,
        audioPlayed: false,
        timestamp: new Date(),
        correct: true,
        newInterval: 7,
        newEaseFactor: 2.8
      };

      const action = PracticeSessionActions.submitResponseSuccess({ response });
      const state = practiceSessionReducer(stateWithStreak, action);

      expect(state.performance.currentStreak).toBe(11);
      expect(state.performance.longestStreak).toBe(11);
    });

    it('should show feedback if immediate feedback is enabled', () => {
      const stateWithSession = {
        ...initialState,
        activeSession: mockSession,
        settings: {
          ...initialState.settings,
          immediateAnswerFeedback: true
        }
      } as PracticeSessionState;

      const response: CardResponse = {
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

      const action = PracticeSessionActions.submitResponseSuccess({ response });
      const state = practiceSessionReducer(stateWithSession, action);

      expect(state.ui.feedbackVisible).toBe(true);
    });

    it('should not show feedback if immediate feedback is disabled', () => {
      const stateWithSession = {
        ...initialState,
        activeSession: mockSession,
        settings: {
          ...initialState.settings,
          immediateAnswerFeedback: false
        }
      } as PracticeSessionState;

      const response: CardResponse = {
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

      const action = PracticeSessionActions.submitResponseSuccess({ response });
      const state = practiceSessionReducer(stateWithSession, action);

      expect(state.ui.feedbackVisible).toBe(false);
    });
  });

  describe('Settings management', () => {
    it('should update settings partially', () => {
      const settingsUpdate = {
        cardLimit: 30,
        showHints: false,
        fontSize: 'large' as const
      };

      const action = PracticeSessionActions.updateSettings({ settings: settingsUpdate });
      const state = practiceSessionReducer(initialState, action);

      expect(state.settings.cardLimit).toBe(30);
      expect(state.settings.showHints).toBe(false);
      expect(state.settings.fontSize).toBe('large');
      expect(state.settings.autoPlayAudio).toBe(initialState.settings.autoPlayAudio);
      expect(state.settings.easyBonus).toBe(initialState.settings.easyBonus);
    });
  });

  describe('UI state management', () => {
    it('should toggle stats visibility', () => {
      const action = PracticeSessionActions.toggleStats();
      const state = practiceSessionReducer(initialState, action);

      expect(state.ui.statsVisible).toBe(true);

      const state2 = practiceSessionReducer(state, action);
      expect(state2.ui.statsVisible).toBe(false);
    });

    it('should toggle settings visibility', () => {
      const action = PracticeSessionActions.toggleSettings();
      const state = practiceSessionReducer(initialState, action);

      expect(state.ui.settingsOpen).toBe(true);

      const state2 = practiceSessionReducer(state, action);
      expect(state2.ui.settingsOpen).toBe(false);
    });
  });

  describe('Keyboard shortcuts', () => {
    const mockSession: ActiveSession = {
      id: 'test-session',
      deckId: 1,
      deckName: 'Test Deck',
      type: SessionType.REVIEW,
      cards: [
        {
          id: 1,
          deckId: 1,
          front: 'Question 1',
          back: 'Answer 1',
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          order: 0,
          seen: false
        }
      ],
      currentIndex: 0,
      responses: [],
      startTime: new Date(),
      settings: initialState.settings,
      state: SessionState.IN_PROGRESS
    };

    it('should handle number key only when card is flipped', () => {
      const stateWithSession = {
        ...initialState,
        activeSession: mockSession,
        ui: {
          ...initialState.ui,
          currentCardFlipped: false
        }
      } as PracticeSessionState;

      const action = PracticeKeyboardActions.pressNumber({ key: 3 });
      const state = practiceSessionReducer(stateWithSession, action);

      expect(state).toEqual(stateWithSession);
    });

    it('should map number keys to quality ratings when card is flipped', () => {
      const stateWithFlippedCard = {
        ...initialState,
        activeSession: mockSession,
        ui: {
          ...initialState.ui,
          currentCardFlipped: true
        }
      } as PracticeSessionState;

      [1, 2, 3, 4].forEach(key => {
        const action = PracticeKeyboardActions.pressNumber({ key });
        const state = practiceSessionReducer(stateWithFlippedCard, action);
        expect(state).toEqual(stateWithFlippedCard);
      });
    });

    it('should ignore invalid number keys', () => {
      const stateWithFlippedCard = {
        ...initialState,
        activeSession: mockSession,
        ui: {
          ...initialState.ui,
          currentCardFlipped: true
        }
      } as PracticeSessionState;

      const action = PracticeKeyboardActions.pressNumber({ key: 5 });
      const state = practiceSessionReducer(stateWithFlippedCard, action);

      expect(state).toEqual(stateWithFlippedCard);
    });
  });

  describe('Performance calculations', () => {
    it('should calculate new accuracy with weighted average', () => {
      const stateWithAccuracy = {
        ...initialState,
        performance: {
          ...initialState.performance,
          overallAccuracy: 85.0
        }
      } as PracticeSessionState;

      const summary = {
        session: {
          id: 'test-session',
          deckId: 1,
          type: SessionType.REVIEW,
          startTime: new Date(),
          endTime: new Date(),
          duration: 600,
          cardsStudied: 20,
          correctCount: 19,
          accuracy: 95.0,
          averageResponseTime: 3,
          masteryChange: 3,
          streakMaintained: true
        },
        cardUpdates: [],
        achievements: [],
        nextReviewSummary: {
          today: 0,
          tomorrow: 0,
          thisWeek: 0,
          thisMonth: 0
        }
      };

      const action = PracticeSessionActions.completeSessionSuccess({ summary });
      const state = practiceSessionReducer(stateWithAccuracy, action);

      expect(state.performance.overallAccuracy).toBe(86);
    });
  });
});
