export interface QuizQuestion {
  id: string;
  type: 'fill-blank' | 'multiple-choice' | 'type-answer' | 'order-words';
  prompt: string;
  correctAnswer: string;
  options?: string[];
  hints: string[];
  verseReference: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizAttempt {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed: number;
  timestamp: Date;
}

export interface QuizSession {
  id: string;
  courseId: number;
  lessonId: number;
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  startTime: Date;
  endTime?: Date;
  settings: QuizSettings;
  currentQuestionIndex: number;
  score: number;
  state: 'not-started' | 'in-progress' | 'completed' | 'paused';
}

export interface QuizSettings {
  timeLimit?: number;
  shuffleQuestions: boolean;
  showHints: boolean;
  immediateFeeback: boolean;
  passingScore: number;
  maxAttempts: number;
}

export interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
  timeTaken: number;
  passed: boolean;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  question: QuizQuestion;
  attempt: QuizAttempt;
  feedback?: string;
}
