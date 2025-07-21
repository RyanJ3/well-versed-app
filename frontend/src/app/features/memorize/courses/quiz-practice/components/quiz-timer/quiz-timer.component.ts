import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-timer">
      <span>{{ minutes }}:{{ seconds | number:'2.0' }}</span>
    </div>
  `,
  styleUrls: ['./quiz-timer.component.scss']
})
export class QuizTimerComponent {
  @Input() timeRemaining = 0;

  get minutes(): number {
    return Math.floor(this.timeRemaining / 60);
  }

  get seconds(): number {
    return this.timeRemaining % 60;
  }
}
