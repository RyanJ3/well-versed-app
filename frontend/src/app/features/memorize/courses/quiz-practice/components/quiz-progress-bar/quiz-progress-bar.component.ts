import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-quiz-progress-bar',
  standalone: true,
  template: `
    <div class="quiz-progress-bar">
      <div class="progress" [style.width.%]="progress"></div>
      <span>{{ currentIndex }} / {{ totalQuestions }}</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizProgressBarComponent {
  @Input() currentIndex = 0;
  @Input() totalQuestions = 0;
  @Input() correctAnswers = 0;

  get progress(): number {
    return this.totalQuestions
      ? (this.currentIndex / this.totalQuestions) * 100
      : 0;
  }
}
