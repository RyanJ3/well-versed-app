import { PracticeSessionStoreState } from './practice-session.state';
import { SessionState } from '../../../../state/practice-session/models/practice-session.model';

export const practiceSelectors = {
  currentCard: (state: PracticeSessionStoreState) => 
    state.cards[state.currentIndex] || null,

  progress: (state: PracticeSessionStoreState) => ({
    current: state.currentIndex + 1,
    total: state.cards.length,
    percent: state.cards.length > 0 
      ? Math.round(((state.currentIndex + 1) / state.cards.length) * 100)
      : 0,
    cardsRemaining: state.cards.length - (state.currentIndex + 1)
  }),

  sessionStats: (state: PracticeSessionStoreState) => {
    const correctResponses = state.responses.filter(r => r.correct).length;
    const totalResponses = state.responses.length;
    
    return {
      correct: correctResponses,
      incorrect: totalResponses - correctResponses,
      accuracy: totalResponses > 0 
        ? Math.round((correctResponses / totalResponses) * 100)
        : 0,
      averageTime: totalResponses > 0
        ? Math.round(
            state.responses.reduce((sum, r) => sum + r.responseTime, 0) / 
            totalResponses / 1000
          )
        : 0,
      hintsUsed: state.responses.reduce((sum, r) => sum + r.hintsUsed, 0)
    };
  },

  isSessionActive: (state: PracticeSessionStoreState) => 
    state.sessionState === SessionState.IN_PROGRESS,

  canFlipCard: (state: PracticeSessionStoreState) => 
    state.sessionState === SessionState.IN_PROGRESS && state.cards.length > 0,

  isCardFlipped: (state: PracticeSessionStoreState) => state.cardFlipped,

  isShowingHint: (state: PracticeSessionStoreState) => state.showingHint,

  currentSessionTime: (state: PracticeSessionStoreState) => 
    state.startTime ? Date.now() - state.startTime.getTime() : 0,

  sessionSummary: (state: PracticeSessionStoreState) => {
    const stats = practiceSelectors.sessionStats(state);
    const progress = practiceSelectors.progress(state);
    
    return {
      deckName: state.deckName,
      sessionType: state.settings.sessionType,
      duration: practiceSelectors.currentSessionTime(state),
      ...stats,
      ...progress
    };
  }
};
