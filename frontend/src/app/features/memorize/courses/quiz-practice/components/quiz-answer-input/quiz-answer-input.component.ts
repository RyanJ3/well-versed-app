import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quiz-answer-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="answer-input">
      <textarea
        #answerField
        [(ngModel)]="answer"
        (keydown.enter)="onSubmit()"
        [placeholder]="placeholder"
        [disabled]="disabled"
        class="answer-textarea"
        rows="3">
      </textarea>

      <div class="input-actions">
        <button
          (click)="onSubmit()"
          [disabled]="!answer.trim() || disabled"
          class="submit-button">
          Submit Answer
        </button>

        <button
          *ngIf="showHintButton"
          (click)="requestHint.emit()"
          class="hint-button">
          Get Hint
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./quiz-answer-input.component.scss']
})
export class QuizAnswerInputComponent {
  @Input() placeholder = 'Type your answer here...';
  @Input() disabled = false;
  @Input() showHintButton = true;

  @Output() submitAnswer = new EventEmitter<string>();
  @Output() requestHint = new EventEmitter<void>();

  @ViewChild('answerField') answerField!: ElementRef<HTMLTextAreaElement>;

  answer = '';

  ngAfterViewInit() {
    this.focusInput();
  }

  onSubmit(): void {
    if (this.answer.trim() && !this.disabled) {
      this.submitAnswer.emit(this.answer);
      this.answer = '';
      this.focusInput();
    }
  }

  focusInput(): void {
    setTimeout(() => {
      this.answerField?.nativeElement.focus();
    }, 100);
  }
}
