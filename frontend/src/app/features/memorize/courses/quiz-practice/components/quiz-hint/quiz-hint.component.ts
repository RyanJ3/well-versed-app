import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz-hint',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-hint" *ngIf="hint">
      <p>{{ hint }}</p>
    </div>
  `,
  styleUrls: ['./quiz-hint.component.scss']
})
export class QuizHintComponent {
  @Input() hint = '';
}
