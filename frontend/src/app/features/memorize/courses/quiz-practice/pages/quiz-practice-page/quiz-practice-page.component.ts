import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { QuizStateService } from '../../services/quiz-state.service';
import { CourseService } from '../../../../../../core/services/course.service';
import { QuizQuestionComponent } from '../../components/quiz-question/quiz-question.component';
import { QuizAnswerInputComponent } from '../../components/quiz-answer-input/quiz-answer-input.component';
import { QuizProgressComponent } from '../../components/quiz-progress/quiz-progress.component';
import { QuizTimerComponent } from '../../components/quiz-timer/quiz-timer.component';
import { QuizResultsComponent } from '../../components/quiz-results/quiz-results.component';

@Component({
  selector: 'app-quiz-practice-page',
  standalone: true,
  imports: [
    CommonModule,
    QuizQuestionComponent,
    QuizAnswerInputComponent,
    QuizProgressComponent,
    QuizTimerComponent,
    QuizResultsComponent
  ],
  providers: [QuizStateService],
  template: `
    <div class="quiz-practice-page">
      <ng-container *ngIf="session$ | async as session">
        <div class="quiz-header" *ngIf="session.state === 'in-progress'">
          <app-quiz-progress
            [currentQuestion]="session.currentQuestionIndex + 1"
            [totalQuestions]="session.questions.length"
            [score]="session.score">
          </app-quiz-progress>
          <app-quiz-timer
            *ngIf="session.settings.timeLimit"
            [timeRemaining]="timeRemaining$ | async">
          </app-quiz-timer>
        </div>

        <div class="quiz-content" [ngSwitch]="session.state">
          <div *ngSwitchCase="'in-progress'">
            <app-quiz-question
              [question]="currentQuestion$ | async"
              [questionNumber]="session.currentQuestionIndex + 1"
              [totalQuestions]="session.questions.length"
              (selectOption)="onAnswerSelected($event)">
            </app-quiz-question>
            <app-quiz-answer-input
              [disabled]="processing"
              [showHintButton]="session.settings.showHints"
              (submitAnswer)="onAnswerSubmitted($event)">
            </app-quiz-answer-input>
          </div>

          <app-quiz-results
            *ngSwitchCase="'completed'"
            [results]="results"
            (retryQuiz)="onRetryQuiz()"
            (exitQuiz)="onExitQuiz()">
          </app-quiz-results>
        </div>
      </ng-container>
    </div>
  `,
  styleUrls: ['./quiz-practice-page.component.scss']
})
export class QuizPracticePageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  session$ = this.quizState.currentSession;
  timeRemaining$ = this.quizState.timeRemaining;
  currentQuestion$ = new Subject<any>();
  results: any;

  processing = false;
  questionStartTime = Date.now();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizState: QuizStateService,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.initialize();
    this.quizState.currentSession.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.currentQuestion$.next(this.quizState.getCurrentQuestion());
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initialize(): Promise<void> {
    const courseId = Number(this.route.snapshot.params['courseId']);
    const lessonId = Number(this.route.snapshot.params['lessonId']);

    const questions = [
      {
        id: '1',
        type: 'type-answer',
        prompt: 'Sample question',
        correctAnswer: 'answer',
        hints: [],
        verseReference: 'John 3:16',
        difficulty: 'easy'
      }
    ];

    this.quizState.initializeQuiz(courseId, lessonId, questions, {
      timeLimit: 1,
      shuffleQuestions: true,
      showHints: true,
      immediateFeeback: true,
      passingScore: 80,
      maxAttempts: 3
    });
  }

  onAnswerSubmitted(answer: string): void {
    this.processing = true;
    const timeSpent = Date.now() - this.questionStartTime;
    this.quizState.submitAnswer(answer, timeSpent, 0);
    this.quizState.nextQuestion();
    this.questionStartTime = Date.now();
    this.processing = false;
  }

  onAnswerSelected(option: string): void {
    this.onAnswerSubmitted(option);
  }

  onRetryQuiz(): void {
    this.initialize();
  }

  onExitQuiz(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
