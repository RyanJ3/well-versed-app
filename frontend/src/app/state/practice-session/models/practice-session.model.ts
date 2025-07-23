export interface PracticeSessionState {
  activeSession: ActiveSession | null;
  sessionHistory: CompletedSession[];
  settings: PracticeSettings;
  performance: PerformanceMetrics;
  ui: PracticeUIState;
}

// Active Session
export interface ActiveSession {
  id: string;
  deckId: number;
  deckName: string;
  type: SessionType;
  cards: StudyCard[];
  currentIndex: number;
  responses: CardResponse[];
  startTime: Date;
  settings: PracticeSettings;
  state: SessionState;
}

export interface StudyCard {
  id: number;
  deckId: number;
  front: string;
  back: string;
  hint?: string;
  verseReference?: string;
  audioUrl?: string;

  // SR Algorithm Data
  easeFactor: number;
  interval: number;
  repetitions: number;

  // Session-specific
  order: number;
  seen: boolean;
  lastResponseQuality?: number;
  nextReview?: Date;
}

export interface CardResponse {
  cardId: number;
  quality: ResponseQuality;
  responseTime: number; // milliseconds
  hintsUsed: number;
  audioPlayed: boolean;
  timestamp: Date;

  // Calculated fields
  correct: boolean;
  newInterval: number;
  newEaseFactor: number;
}

export enum SessionType {
  REVIEW = 'review',
  LEARN = 'learn',
  CRAM = 'cram',
  QUIZ = 'quiz',
}

export enum SessionState {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum ResponseQuality {
  AGAIN = 0, // Complete blackout
  HARD = 1, // Difficult recall
  GOOD = 2, // Normal recall
  EASY = 3, // Perfect recall
  SKIP = -1, // Skipped card
}

// Completed Session
export interface CompletedSession {
  id: string;
  deckId: number;
  type: SessionType;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  cardsStudied: number;
  correctCount: number;
  accuracy: number;
  averageResponseTime: number;
  masteryChange: number;
  streakMaintained: boolean;
}

// Settings
export interface PracticeSettings {
  // Session Configuration
  sessionType: SessionType;
  cardLimit: number;
  timeLimit: number | null; // minutes

  // Card Selection
  newCardsPerSession: number;
  reviewOrder: ReviewOrder;
  prioritizeDue: boolean;
  includeNewCards: boolean;

  // Display Options
  showHints: boolean;
  autoPlayAudio: boolean;
  flipAnimation: boolean;
  fontSize: 'small' | 'medium' | 'large';

  // Behavior
  immediateAnswerFeedback: boolean;
  requireTypedAnswer: boolean;
  caseSensitive: boolean;
  showProgress: boolean;

  // Spaced Repetition
  easyBonus: number; // 1.3 default
  intervalModifier: number; // 1.0 default
  lapseMultiplier: number; // 0.5 default
  minimumInterval: number; // 1 day
}

export enum ReviewOrder {
  DUE_DATE = 'due_date',
  RANDOM = 'random',
  DIFFICULTY = 'difficulty',
  CREATED = 'created',
}

// Performance Metrics
export interface PerformanceMetrics {
  // Current Session
  currentStreak: number;
  longestStreak: number;
  totalTime: number;
  cardsPerMinute: number;

  // Historical
  dailyAverage: number;
  weeklyProgress: number;
  monthlyRetention: number;
  overallAccuracy: number;
}

// UI State
export interface PracticeUIState {
  currentCardFlipped: boolean;
  showingHint: boolean;
  answerRevealed: boolean;
  feedbackVisible: boolean;
  statsVisible: boolean;
  settingsOpen: boolean;
}

// API Models
export interface StartSessionRequest {
  deckId: number;
  settings: Partial<PracticeSettings>;
}

export interface SubmitResponseRequest {
  sessionId: string;
  cardId: number;
  quality: ResponseQuality;
  responseTime: number;
  hintsUsed: number;
}

export interface SessionSummary {
  session: CompletedSession;
  cardUpdates: CardUpdate[];
  achievements: Achievement[];
  nextReviewSummary: NextReviewSummary;
}

export interface CardUpdate {
  cardId: number;
  oldInterval: number;
  newInterval: number;
  oldEaseFactor: number;
  newEaseFactor: number;
  nextReview: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export interface NextReviewSummary {
  today: number;
  tomorrow: number;
  thisWeek: number;
  thisMonth: number;
}
