import { Injectable } from '@angular/core';
import { Question } from '../models/quiz.types';

/**
 * Service responsible for validating quiz answers and completeness.
 */
@Injectable({ providedIn: 'root' })
export class QuizValidationService {
  /** Validate a single answer against the question. */
  validateAnswer(question: Question, answer: string): boolean {
    // TODO: implement real validation logic
    return !!answer && question.text.length > 0;
  }

  /** Check if the quiz has enough questions answered. */
  checkCompleteness(totalQuestions: number, answered: number): boolean {
    return answered >= totalQuestions;
  }
}
