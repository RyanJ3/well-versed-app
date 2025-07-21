import { Injectable } from '@angular/core';
import { QuizQuestion } from '../models/quiz.types';

@Injectable()
export class QuestionGeneratorService {
  generateQuestions(lesson: any): QuizQuestion[] {
    // Placeholder: In real implementation generate questions from lesson data
    return [];
  }
}
