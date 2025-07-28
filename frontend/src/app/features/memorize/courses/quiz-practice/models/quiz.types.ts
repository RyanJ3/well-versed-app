export interface Question {
  id: string;
  text: string;
  options?: string[];
}

export interface Answer {
  questionId: string;
  value: string;
}

export interface QuizResults {
  score: number;
  correct: number;
  total: number;
}
