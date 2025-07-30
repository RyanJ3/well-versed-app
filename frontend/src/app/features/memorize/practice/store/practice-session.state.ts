import { 
  StudyCard, 
  PracticeSettings, 
  SessionState,
  CardResponse,
  SessionType,
  ReviewOrder
} from '../../../../state/practice-session/models/practice-session.model';

export interface PracticeSessionStoreState {
  // Session data
  sessionId: string | null;
  deckId: number | null;
  deckName: string;
  cards: StudyCard[];
  currentIndex: number;
  responses: CardResponse[];
  startTime: Date | null;
  sessionState: SessionState;
  
  // Settings
  settings: PracticeSettings;
  
  // UI State
  cardFlipped: boolean;
  showingHint: boolean;
  
  // Performance
  currentStreak: number;
  longestStreak: number;
  
  // Loading states
  loading: boolean;
  error: string | null;
}

export const initialState: PracticeSessionStoreState = {
  sessionId: null,
  deckId: null,
  deckName: '',
  cards: [],
  currentIndex: 0,
  responses: [],
  startTime: null,
  sessionState: SessionState.NOT_STARTED,
  
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
    minimumInterval: 1
  },
  
  cardFlipped: false,
  showingHint: false,
  currentStreak: 0,
  longestStreak: 0,
  loading: false,
  error: null
};
