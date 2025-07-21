import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-progress">
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="progress"></div>
      </div>
      <span class="progress-text">{{ currentQuestion }} / {{ totalQuestions }}</span>
      <span class="score-text">Score: {{ score }}</span>
    </div>
  `,
  styleUrls: ['./quiz-progress.component.scss']
})
export class QuizProgressComponent {
  @Input() currentQuestion = 0;
  @Input() totalQuestions = 0;
  @Input() score = 0;

  get progress(): number {
    return this.totalQuestions ? (this.currentQuestion / this.totalQuestions) * 100 : 0;
  }
}
