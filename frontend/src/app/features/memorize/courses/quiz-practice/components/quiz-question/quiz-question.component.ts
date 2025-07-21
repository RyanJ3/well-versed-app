import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizQuestion } from '../../models/quiz.types';

@Component({
  selector: 'app-quiz-question',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-question" *ngIf="question">
      <div class="question-header">
        <span class="question-number">Question {{ questionNumber }}</span>
        <span class="verse-reference">{{ question.verseReference }}</span>
      </div>

      <div class="question-prompt">
        {{ question.prompt }}
      </div>

      <div class="question-content" [ngSwitch]="question.type">
        <div *ngSwitchCase="'multiple-choice'" class="options">
          <button
            *ngFor="let option of question.options"
            class="option-button"
            (click)="selectOption.emit(option)"
            [class.selected]="selectedOption === option">
            {{ option }}
          </button>
        </div>

        <div *ngSwitchCase="'fill-blank'" class="fill-blank">
          <p [innerHTML]="getQuestionWithBlanks()"></p>
        </div>

        <div *ngSwitchDefault class="type-answer">
          <p>Type your answer below:</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./quiz-question.component.scss']
})
export class QuizQuestionComponent {
  @Input() question!: QuizQuestion;
  @Input() questionNumber!: number;
  @Input() totalQuestions!: number;
  @Input() selectedOption?: string;

  @Output() selectOption = new EventEmitter<string>();

  getQuestionWithBlanks(): string {
    return this.question.prompt.replace(/___+/g, '<span class="blank">_____</span>');
  }
}
