import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizResults } from '../../models/quiz.types';

@Component({
  selector: 'app-quiz-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-results" *ngIf="results">
      <h2>Your Score: {{ results.score }}</h2>
      <p>{{ results.correctAnswers }} / {{ results.totalQuestions }} correct</p>
      <p>Time: {{ results.timeTaken }}s</p>
      <button class="retry-btn" (click)="retryQuiz.emit()">Retry</button>
      <button class="exit-btn" (click)="exitQuiz.emit()">Exit</button>
    </div>
  `,
  styleUrls: ['./quiz-results.component.scss']
})
export class QuizResultsComponent {
  @Input() results!: QuizResults;
  @Output() retryQuiz = new EventEmitter<void>();
  @Output() exitQuiz = new EventEmitter<void>();
}
