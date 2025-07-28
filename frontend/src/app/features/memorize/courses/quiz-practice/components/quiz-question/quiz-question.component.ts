import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { Question } from '../../models/quiz.types';

@Component({
  selector: 'app-quiz-question',
  standalone: true,
  template: `
    <div class="quiz-question">
      <p class="question-text">{{ question?.text }}</p>
      <input
        type="text"
        class="answer-input"
        [value]="userAnswer"
        (input)="answerChanged.emit($any($event.target).value)"
      />
      <button type="button" (click)="submitted.emit()">Submit</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizQuestionComponent {
  @Input() question!: Question | null;
  @Input() userAnswer = '';
  @Output() answerChanged = new EventEmitter<string>();
  @Output() submitted = new EventEmitter<void>();
}
