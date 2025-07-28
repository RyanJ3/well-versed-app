import { Injectable } from '@angular/core';
import { Answer, QuizResults } from '../models/quiz.types';

/**
 * Service responsible for calculating quiz scores and providing
 * utilities related to quiz completion.
 */
@Injectable({ providedIn: 'root' })
export class QuizScoringService {
  /** Calculate a percentage score based on provided answers. */
  calculateScore(answers: Answer[]): number {
    // TODO: implement real scoring algorithm
    const correct = answers.filter(a => !!a.value).length;
    return answers.length ? Math.round((correct / answers.length) * 100) : 0;
  }

  /** Determine if the quiz was passed based on score. */
  determinePassStatus(score: number, threshold = 80): boolean {
    return score >= threshold;
  }

  /** Generate a basic feedback string for the provided results. */
  generateFeedback(results: QuizResults): string {
    return `You answered ${results.correct} of ${results.total} correctly.`;
  }
}
