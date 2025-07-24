import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { QuizResults, QuizSession } from '../models/quiz.types';

@Injectable()
export class QuizScoringService {
  private resultsSubject = new BehaviorSubject<QuizResults | null>(null);
  results$ = this.resultsSubject.asObservable();

  calculateResults(session: QuizSession): void {
    const totalQuestions = session.questions.length;
    const correctAnswers = session.score;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    const results: QuizResults = {
      totalQuestions,
      correctAnswers,
      score: session.score,
      percentage,
      timeTaken: session.endTime && session.startTime ?
        Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000) : 0,
      passed: percentage >= session.settings.passingScore,
      questionResults: []
    };

    this.resultsSubject.next(results);
  }
}
