import {
  selectPracticeSessionState,
  selectActiveSession,
  selectIsSessionActive,
  selectCurrentCard,
  selectSessionProgress,
  selectSessionStats,
  selectSettings,
  selectPerformance,
  selectCurrentStreak,
  selectCardsPerMinute,
  selectSessionHistory,
  selectRecentSessions,
  selectTodaySessions,
  selectIsCardFlipped,
  selectSessionSummary
} from './practice-session.selectors';
import {
  PracticeSessionState,
  ActiveSession,
  SessionType,
  SessionState,
  ResponseQuality
} from '../models/practice-session.model';

describe('PracticeSessionSelectors', () => {
  const mockActiveSession: ActiveSession = {
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
        seen: true
      },
      {
        id: 3,
        deckId: 1,
        front: 'Question 3',
        back: 'Answer 3',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        order: 2,
        seen: false
      }
    ],
    currentIndex: 1,
    responses: [
      {
        cardId: 2,
        quality: ResponseQuality.GOOD,
        responseTime: 3000,
        hintsUsed: 0,
        audioPlayed: false,
        timestamp: new Date('2024-01-15T10:01:00'),
        correct: true,
        newInterval: 4,
        newEaseFactor: 2.5
      }
    ],
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
      autoPlayAudio: false,
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

  const mockState: PracticeSessionState = {
    activeSession: mockActiveSession,
    sessionHistory: [
      {
        id: 'completed-1',
        deckId: 1,
        type: SessionType.REVIEW,
        startTime: new Date('2024-01-15T08:00:00'),
        endTime: new Date('2024-01-15T08:30:00'),
        duration: 1800,
        cardsStudied: 25,
        correctCount: 23,
        accuracy: 92,
        averageResponseTime: 3.2,
        masteryChange: 5,
        streakMaintained: true
      },
      {
        id: 'completed-2',
        deckId: 2,
        type: SessionType.LEARN,
        startTime: new Date('2024-01-14T15:00:00'),
        endTime: new Date('2024-01-14T15:20:00'),
        duration: 1200,
        cardsStudied: 15,
        correctCount: 12,
        accuracy: 80,
        averageResponseTime: 4.5,
        masteryChange: 3,
        streakMaintained: false
      }
    ],
    settings: {
      sessionType: SessionType.REVIEW,
      cardLimit: 20,
      timeLimit: null,
      newCardsPerSession: 5,
      reviewOrder: 'due_date' as any,
      prioritizeDue: true,
      includeNewCards: true,
      showHints: true,
      autoPlayAudio: false,
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
    performance: {
      currentStreak: 8,
      longestStreak: 15,
      totalTime: 3600,
      cardsPerMinute: 2.5,
      dailyAverage: 20,
      weeklyProgress: 140,
      monthlyRetention: 88,
      overallAccuracy: 85
    },
    ui: {
      currentCardFlipped: true,
      showingHint: false,
      answerRevealed: true,
      feedbackVisible: false,
      statsVisible: true,
      settingsOpen: false
    }
  };

  const rootState = { practiceSession: mockState } as any;

  describe('Basic selectors', () => {
    it('should select practice session state', () => {
      const result = selectPracticeSessionState(rootState);
      expect(result).toBe(mockState);
    });

    it('should select active session', () => {
      const result = selectActiveSession(rootState);
      expect(result).toBe(mockActiveSession);
    });

    it('should determine if session is active', () => {
      const result = selectIsSessionActive(rootState);
      expect(result).toBe(true);

      const inactiveState = { practiceSession: { ...mockState, activeSession: null } } as any;
      const inactiveResult = selectIsSessionActive(inactiveState);
      expect(inactiveResult).toBe(false);
    });

    it('should select current card', () => {
      const result = selectCurrentCard(rootState);
      expect(result?.id).toBe(2);
      expect(result?.seen).toBe(true);
    });

    it('should return null when no active session', () => {
      const noSessionState = { practiceSession: { ...mockState, activeSession: null } } as any;
      const result = selectCurrentCard(noSessionState);
      expect(result).toBeNull();
    });

    it('should select settings', () => {
      const result = selectSettings(rootState);
      expect(result).toBe(mockState.settings);
      expect(result.cardLimit).toBe(20);
    });

    it('should select performance metrics', () => {
      const result = selectPerformance(rootState);
      expect(result).toBe(mockState.performance);
    });

    it('should select current streak', () => {
      const result = selectCurrentStreak(rootState);
      expect(result).toBe(8);
    });

    it('should select UI state flags', () => {
      expect(selectIsCardFlipped(rootState)).toBe(true);
    });
  });

  describe('Session progress calculations', () => {
    it('should calculate session progress correctly', () => {
      const progress = selectSessionProgress(rootState);

      expect(progress.totalCards).toBe(3);
      expect(progress.seenCards).toBe(1);
      expect(progress.remainingCards).toBe(2);
      expect(progress.percentComplete).toBeCloseTo(33.33, 1);
    });

    it('should handle empty session', () => {
      const noSessionState = { practiceSession: { ...mockState, activeSession: null } } as any;
      const progress = selectSessionProgress(noSessionState);

      expect(progress.totalCards).toBe(0);
      expect(progress.seenCards).toBe(0);
      expect(progress.remainingCards).toBe(0);
      expect(progress.percentComplete).toBe(0);
    });

    it('should handle session with all cards seen', () => {
      const allSeenSession = {
        ...mockActiveSession,
        cards: mockActiveSession.cards.map(card => ({ ...card, seen: true }))
      };
      const stateAllSeen = {
        practiceSession: {
          ...mockState,
          activeSession: allSeenSession
        }
      } as any;

      const progress = selectSessionProgress(stateAllSeen);
      expect(progress.percentComplete).toBe(100);
      expect(progress.remainingCards).toBe(0);
    });
  });

  describe('Session statistics', () => {
    it('should calculate session stats from responses', () => {
      const sessionWithMoreResponses = {
        ...mockActiveSession,
        responses: [
          {
            cardId: 1,
            quality: ResponseQuality.GOOD,
            responseTime: 3000,
            hintsUsed: 0,
            audioPlayed: false,
            timestamp: new Date(),
            correct: true,
            newInterval: 4,
            newEaseFactor: 2.5
          },
          {
            cardId: 2,
            quality: ResponseQuality.AGAIN,
            responseTime: 5000,
            hintsUsed: 1,
            audioPlayed: false,
            timestamp: new Date(),
            correct: false,
            newInterval: 1,
            newEaseFactor: 1.3
          },
          {
            cardId: 3,
            quality: ResponseQuality.EASY,
            responseTime: 2000,
            hintsUsed: 0,
            audioPlayed: true,
            timestamp: new Date(),
            correct: true,
            newInterval: 7,
            newEaseFactor: 2.8
          }
        ]
      };

      const stateWithResponses = {
        practiceSession: {
          ...mockState,
          activeSession: sessionWithMoreResponses
        }
      } as any;

      const stats = selectSessionStats(stateWithResponses);

      expect(stats.correctCount).toBe(2);
      expect(stats.incorrectCount).toBe(1);
      expect(stats.accuracy).toBeCloseTo(66.67, 1);
      expect(stats.averageResponseTime).toBe(3);
      expect(stats.hintsUsed).toBe(1);
    });

    it('should handle session with no responses', () => {
      const stats = selectSessionStats(rootState);

      expect(stats.correctCount).toBe(1);
      expect(stats.incorrectCount).toBe(0);
      expect(stats.accuracy).toBe(100);
    });

    it('should handle no active session', () => {
      const noSessionState = { practiceSession: { ...mockState, activeSession: null } } as any;
      const stats = selectSessionStats(noSessionState);

      expect(stats.correctCount).toBe(0);
      expect(stats.incorrectCount).toBe(0);
      expect(stats.accuracy).toBe(0);
      expect(stats.averageResponseTime).toBe(0);
      expect(stats.hintsUsed).toBe(0);
    });
  });

  describe('Cards per minute calculation', () => {
    it('should calculate cards per minute', () => {
      spyOn(Date, 'now').and.returnValue(new Date('2024-01-15T10:05:00').getTime());

      const stateWithResponses = {
        practiceSession: {
          ...mockState,
          activeSession: {
            ...mockActiveSession,
            responses: [
              { ...mockActiveSession.responses[0], correct: true },
              { ...mockActiveSession.responses[0], correct: false }
            ]
          }
        }
      } as any;

      const cpm = selectCardsPerMinute(stateWithResponses);
      expect(cpm).toBe(0.4);

      (Date.now as any).and.callThrough();
    });

    it('should return 0 when no cards studied', () => {
      const cpm = selectCardsPerMinute(rootState);
      expect(cpm).toBeGreaterThan(0);
    });

    it('should return 0 when no active session', () => {
      const noSessionState = { practiceSession: { ...mockState, activeSession: null } } as any;
      const cpm = selectCardsPerMinute(noSessionState);
      expect(cpm).toBe(0);
    });
  });

  describe('Session history selectors', () => {
    it('should select all session history', () => {
      const history = selectSessionHistory(rootState);
      expect(history.length).toBe(2);
      expect(history[0].id).toBe('completed-1');
    });

    it('should select recent sessions (last 10)', () => {
      const manySessions = Array.from({ length: 15 }, (_, i) => ({
        id: `session-${i}`,
        deckId: 1,
        type: SessionType.REVIEW,
        startTime: new Date(`2024-01-${15 - i}T10:00:00`),
        endTime: new Date(`2024-01-${15 - i}T10:30:00`),
        duration: 1800,
        cardsStudied: 20,
        correctCount: 18,
        accuracy: 90,
        averageResponseTime: 3,
        masteryChange: 2,
        streakMaintained: true
      }));

      const stateWithManySessions = {
        practiceSession: {
          ...mockState,
          sessionHistory: manySessions
        }
      } as any;

      const recent = selectRecentSessions(stateWithManySessions);
      expect(recent.length).toBe(10);
      expect(recent[0].id).toBe('session-0');
    });

    it('should select today\'s sessions', () => {
      const today = new Date();
      const todaySession = {
        ...mockState.sessionHistory[0],
        startTime: today
      };

      const stateWithTodaySession = {
        practiceSession: {
          ...mockState,
          sessionHistory: [todaySession, ...mockState.sessionHistory]
        }
      } as any;

      const todaySessions = selectTodaySessions(stateWithTodaySession);
      expect(todaySessions.length).toBe(1);
      expect(todaySessions[0].startTime).toEqual(today);
    });
  });

  describe('Session summary', () => {
    it('should create comprehensive session summary', () => {
      spyOn(Date, 'now').and.returnValue(new Date('2024-01-15T10:10:00').getTime());

      const summary = selectSessionSummary(rootState);

      expect(summary).not.toBeNull();
      expect(summary?.deckName).toBe('Test Deck');
      expect(summary?.sessionType).toBe(SessionType.REVIEW);
      expect(summary?.duration).toBe(600);
      expect(summary?.correctCount).toBe(1);
      expect(summary?.totalCards).toBe(3);
      expect(summary?.seenCards).toBe(1);
      expect(summary?.percentComplete).toBeCloseTo(33.33, 1);

      (Date.now as any).and.callThrough();
    });

    it('should return null when no active session', () => {
      const noSessionState = { practiceSession: { ...mockState, activeSession: null } } as any;
      const summary = selectSessionSummary(noSessionState);
      expect(summary).toBeNull();
    });
  });
});
