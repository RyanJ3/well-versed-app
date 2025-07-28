import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Answer, Question, QuizResults } from './models/quiz.types';
import {
  selectCurrentQuestion,
  selectQuizProgress,
  selectQuizResults,
  submitAnswer,
  completeQuiz,
  updateCurrentAnswer,
  retryQuiz,
  navigateNextLesson,
} from './state/quiz.selectors';

/**
 * Container component for the quiz practice feature. It exposes state
 * selectors to the template and delegates user interactions to the
 * NgRx store.
 */
@Component({
  selector: 'app-quiz-practice',
  templateUrl: './quiz-practice.container.html',
})
export class QuizPracticeContainer implements OnInit {
  currentQuestion$: Observable<Question | null> = this.store.select(selectCurrentQuestion);
  quizProgress$ = this.store.select(selectQuizProgress);
  quizResults$ = this.store.select(selectQuizResults);

  constructor(private store: Store) {}

  ngOnInit(): void {}

  onAnswerChanged(answer: string): void {
    this.store.dispatch(updateCurrentAnswer({ answer }));
  }

  onAnswerSubmitted(answer: Answer): void {
    this.store.dispatch(submitAnswer({ answer }));
  }

  onRetryQuiz(): void {
    this.store.dispatch(retryQuiz());
  }

  onNextLesson(): void {
    this.store.dispatch(navigateNextLesson());
  }

  onQuizCompleted(): void {
    this.store.dispatch(completeQuiz());
  }
}
