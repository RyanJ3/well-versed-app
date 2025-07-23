import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PracticeSessionState, StudyCard } from '../models/practice-session.model';

export const selectPracticeSessionState = createFeatureSelector<PracticeSessionState>('practiceSession');


export const selectActiveSession = createSelector(
  selectPracticeSessionState,
  (state) => state.activeSession
);

export const selectIsSessionActive = createSelector(
  selectActiveSession,
  (session) => session !== null
);

export const selectSessionCards = createSelector(
  selectActiveSession,
  (session) => session?.cards || []
);

export const selectCurrentCardIndex = createSelector(
  selectActiveSession,
  (session) => session?.currentIndex || 0
);

export const selectCurrentCard = createSelector(
  selectActiveSession,
  selectCurrentCardIndex,
  (session, index) => session?.cards[index] || null
);

export const selectSessionProgress = createSelector(
  selectActiveSession,
  (session) => {
    if (!session) {
      return {
        totalCards: 0,
        seenCards: 0,
        remainingCards: 0,
        percentComplete: 0,
      };
    } 

    const seenCards = session.cards.filter((card) => card.seen).length;
    const totalCards = session.cards.length;
    const remainingCards = totalCards - seenCards;
    const percentComplete = totalCards > 0 ? (seenCards / totalCards) * 100 : 0;

    return {
      totalCards,
      seenCards,
      remainingCards,
      percentComplete,
    };
  }
);

export const selectSessionStats = createSelector(
  selectActiveSession,
  (session) => {
    if (!session || session.responses.length === 0) {
      return {
        correctCount: 0,
        incorrectCount: 0,
        accuracy: 0,
        averageResponseTime: 0,
        hintsUsed: 0,
      };
    }

    const correctCount = session.responses.filter((r) => r.correct).length;
    const incorrectCount = session.responses.length - correctCount;
    const accuracy = (correctCount / session.responses.length) * 100;
    const totalResponseTime = session.responses.reduce((sum, r) => sum + r.responseTime, 0);
    const averageResponseTime = totalResponseTime / session.responses.length;
    const hintsUsed = session.responses.reduce((sum, r) => sum + r.hintsUsed, 0);

    return {
      correctCount,
      incorrectCount,
      accuracy,
      averageResponseTime: Math.round(averageResponseTime / 1000),
      hintsUsed,
    };
  }
);

export const selectSettings = createSelector(
  selectPracticeSessionState,
  (state) => state.settings
);

export const selectSessionType = createSelector(
  selectSettings,
  (settings) => settings.sessionType
);

export const selectPerformance = createSelector(
  selectPracticeSessionState,
  (state) => state.performance
);

export const selectCurrentStreak = createSelector(
  selectPerformance,
  (performance) => performance.currentStreak
);

export const selectCardsPerMinute = createSelector(
  selectActiveSession,
  selectSessionStats,
  (session, stats) => {
    if (!session || stats.correctCount + stats.incorrectCount === 0) {
      return 0;
    }

    const elapsedMinutes = (Date.now() - session.startTime.getTime()) / 60000;
    return (stats.correctCount + stats.incorrectCount) / elapsedMinutes;
  }
);

export const selectSessionHistory = createSelector(
  selectPracticeSessionState,
  (state) => state.sessionHistory
);

export const selectRecentSessions = createSelector(
  selectSessionHistory,
  (history) => history.slice(0, 10)
);

export const selectTodaySessions = createSelector(
  selectSessionHistory,
  (history) => {
    const today = new Date().toDateString();
    return history.filter((session) => new Date(session.startTime).toDateString() === today);
  }
);

export const selectUI = createSelector(
  selectPracticeSessionState,
  (state) => state.ui
);

export const selectIsCardFlipped = createSelector(
  selectUI,
  (ui) => ui.currentCardFlipped
);

export const selectIsShowingHint = createSelector(
  selectUI,
  (ui) => ui.showingHint
);

export const selectIsStatsVisible = createSelector(
  selectUI,
  (ui) => ui.statsVisible
);

export const selectNextReviewTime = createSelector(
  selectCurrentCard,
  selectActiveSession,
  (card, session) => {
    if (!card || !session) return null;

    const response = session.responses.find((r) => r.cardId === card.id);
    if (!response) return null;

    return new Date(Date.now() + response.newInterval * 24 * 60 * 60 * 1000);
  }
);

export const selectDueCardsInSession = createSelector(
  selectSessionCards,
  (cards) => {
    const now = new Date();
    return cards.filter((card) => card.nextReview && new Date(card.nextReview) <= now);
  }
);

export const selectSessionSummary = createSelector(
  selectActiveSession,
  selectSessionStats,
  selectSessionProgress,
  (session, stats, progress) => {
    if (!session) return null;

    return {
      deckName: session.deckName,
      sessionType: session.type,
      duration: Math.round((Date.now() - session.startTime.getTime()) / 1000),
      ...stats,
      ...progress,
    };
  }
);
