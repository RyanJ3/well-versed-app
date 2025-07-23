import { createReducer, on } from '@ngrx/store';
import {
  PracticeSessionState,
  SessionState,
  SessionType,
  ReviewOrder,
  ResponseQuality,
} from '../models/practice-session.model';
import { PracticeSessionActions, PracticeKeyboardActions } from '../actions/practice-session.actions';

export const initialState: PracticeSessionState = {
  activeSession: null,
  sessionHistory: [],
  settings: {
    sessionType: SessionType.REVIEW,
    cardLimit: 20,
    timeLimit: null,
    newCardsPerSession: 5,
    reviewOrder: ReviewOrder.DUE_DATE,
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
    minimumInterval: 1,
  },
  performance: {
    currentStreak: 0,
    longestStreak: 0,
    totalTime: 0,
    cardsPerMinute: 0,
    dailyAverage: 0,
    weeklyProgress: 0,
    monthlyRetention: 0,
    overallAccuracy: 0,
  },
  ui: {
    currentCardFlipped: false,
    showingHint: false,
    answerRevealed: false,
    feedbackVisible: false,
    statsVisible: false,
    settingsOpen: false,
  },
};

export const practiceSessionReducer = createReducer(
  initialState,

  // Start Session
  on(PracticeSessionActions.startSessionSuccess, (state, { session }) => ({
    ...state,
    activeSession: session,
    ui: {
      ...initialState.ui,
    },
  })),

  // Pause/Resume
  on(PracticeSessionActions.pauseSession, (state) => ({
    ...state,
    activeSession: state.activeSession
      ? { ...state.activeSession, state: SessionState.PAUSED }
      : null,
  })),

  on(PracticeSessionActions.resumeSession, (state) => ({
    ...state,
    activeSession: state.activeSession
      ? { ...state.activeSession, state: SessionState.IN_PROGRESS }
      : null,
  })),

  // Card Navigation
  on(PracticeSessionActions.showNextCard, (state) => {
    if (!state.activeSession) return state;

    const nextIndex = Math.min(
      state.activeSession.currentIndex + 1,
      state.activeSession.cards.length - 1
    );

    return {
      ...state,
      activeSession: {
        ...state.activeSession,
        currentIndex: nextIndex,
      },
      ui: {
        ...state.ui,
        currentCardFlipped: false,
        showingHint: false,
        answerRevealed: false,
        feedbackVisible: false,
      },
    };
  }),

  on(PracticeSessionActions.showPreviousCard, (state) => {
    if (!state.activeSession) return state;

    const prevIndex = Math.max(state.activeSession.currentIndex - 1, 0);

    return {
      ...state,
      activeSession: {
        ...state.activeSession,
        currentIndex: prevIndex,
      },
      ui: {
        ...state.ui,
        currentCardFlipped: false,
        showingHint: false,
        answerRevealed: false,
      },
    };
  }),

  // Card Interaction
  on(PracticeSessionActions.flipCard, PracticeKeyboardActions.pressSpace, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      currentCardFlipped: !state.ui.currentCardFlipped,
      answerRevealed: true,
    },
  })),

  on(PracticeSessionActions.showHint, PracticeKeyboardActions.pressH, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      showingHint: true,
    },
  })),

  // Submit Response
  on(PracticeSessionActions.submitResponseSuccess, (state, { response }) => {
    if (!state.activeSession) return state;

    const updatedResponses = [...state.activeSession.responses, response];
    const currentStreak = response.correct ? state.performance.currentStreak + 1 : 0;

    return {
      ...state,
      activeSession: {
        ...state.activeSession,
        responses: updatedResponses,
        cards: state.activeSession.cards.map((card) =>
          card.id === response.cardId
            ? { ...card, seen: true, lastResponseQuality: response.quality }
            : card
        ),
      },
      performance: {
        ...state.performance,
        currentStreak,
        longestStreak: Math.max(currentStreak, state.performance.longestStreak),
      },
      ui: {
        ...state.ui,
        feedbackVisible: state.settings.immediateAnswerFeedback,
      },
    };
  }),

  // Settings
  on(PracticeSessionActions.updateSettings, (state, { settings }) => ({
    ...state,
    settings: {
      ...state.settings,
      ...settings,
    },
  })),

  // UI State
  on(PracticeSessionActions.toggleStats, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      statsVisible: !state.ui.statsVisible,
    },
  })),

  on(PracticeSessionActions.toggleSettings, (state) => ({
    ...state,
    ui: {
      ...state.ui,
      settingsOpen: !state.ui.settingsOpen,
    },
  })),

  // Complete Session
  on(PracticeSessionActions.completeSessionSuccess, (state, { summary }) => ({
    ...state,
    activeSession: null,
    sessionHistory: [summary.session, ...state.sessionHistory].slice(0, 50),
    performance: {
      ...state.performance,
      overallAccuracy: calculateNewAccuracy(
        state.performance.overallAccuracy,
        summary.session.accuracy
      ),
    },
  })),

  // Keyboard Shortcuts
  on(PracticeKeyboardActions.pressNumber, (state, { key }) => {
    if (!state.activeSession || !state.ui.currentCardFlipped) return state;

    const qualityMap: { [key: number]: ResponseQuality } = {
      1: ResponseQuality.AGAIN,
      2: ResponseQuality.HARD,
      3: ResponseQuality.GOOD,
      4: ResponseQuality.EASY,
    };

    const quality = qualityMap[key];
    if (quality === undefined) return state;

    return state;
  })
);

// Helper function
function calculateNewAccuracy(currentAccuracy: number, sessionAccuracy: number): number {
  return currentAccuracy * 0.9 + sessionAccuracy * 0.1;
}
