import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { QuizResults } from '../../models/quiz.types';

@Component({
  selector: 'app-quiz-results',
  standalone: true,
  template: `
    <div class="quiz-results">
      <p>Your score: {{ results?.score }}%</p>
      <button type="button" (click)="retryClicked.emit()">Retry</button>
      <button type="button" (click)="nextLessonClicked.emit()">Next Lesson</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizResultsComponent {
  @Input() results!: QuizResults | null;
  @Output() retryClicked = new EventEmitter<void>();
  @Output() nextLessonClicked = new EventEmitter<void>();
}
