import { createAction, createFeature, createReducer, on, props, createSelector } from '@ngrx/store';
import { Answer, Question, QuizResults } from '../models/quiz.types';

export interface QuizState {
  currentQuestion: Question | null;
  currentAnswer: string;
  currentIndex: number;
  totalQuestions: number;
  correctAnswers: number;
  isComplete: boolean;
  results: QuizResults | null;
}

const initialState: QuizState = {
  currentQuestion: null,
  currentAnswer: '',
  currentIndex: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  isComplete: false,
  results: null,
};

export const updateCurrentAnswer = createAction('quiz/updateCurrentAnswer', props<{ answer: string }>());
export const submitAnswer = createAction('quiz/submitAnswer', props<{ answer: Answer }>());
export const completeQuiz = createAction('quiz/completeQuiz');
export const retryQuiz = createAction('quiz/retry');
export const navigateNextLesson = createAction('quiz/nextLesson');

const quizFeature = createFeature({
  name: 'quiz',
  reducer: createReducer(
    initialState,
    on(updateCurrentAnswer, (state, { answer }) => ({ ...state, currentAnswer: answer })),
    on(completeQuiz, (state) => ({ ...state, isComplete: true }))
  ),
});

export const selectQuizState = quizFeature.selectState;
export const selectCurrentQuestion = createSelector(selectQuizState, (s) => s.currentQuestion);
export const selectQuizProgress = createSelector(selectQuizState, (s) => ({
  currentIndex: s.currentIndex,
  totalQuestions: s.totalQuestions,
  correctAnswers: s.correctAnswers,
  currentAnswer: s.currentAnswer,
  isComplete: s.isComplete,
}));
export const selectQuizResults = createSelector(selectQuizState, (s) => s.results);

export const quizReducer = quizFeature.reducer;
