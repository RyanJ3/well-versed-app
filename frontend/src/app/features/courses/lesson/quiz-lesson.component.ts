// frontend/src/app/features/courses/lesson/quiz-lesson.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '@services/api/course.service';
import { UserService } from '@services/api/user.service';
import { BaseLessonComponent } from './base-lesson.component';

@Component({
  selector: 'app-quiz-lesson',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lesson-view" *ngIf="lesson">
      <!-- Progress Bar -->
      <div class="lesson-progress">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPercentage"></div>
        </div>
      </div>

      <!-- Header -->
      <div class="lesson-header">
        <button class="back-button" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back to Course
        </button>

        <h1 class="lesson-title">{{ lesson.title }}</h1>
        <p class="lesson-description" *ngIf="lesson.description">
          {{ lesson.description }}
        </p>
      </div>

      <!-- Quiz Content -->
      <div class="lesson-content-section" *ngIf="!lessonCompleted">
        <div class="quiz-content">
          <div class="quiz-card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <path d="M12 17h.01"></path>
            </svg>
            <h3>Quiz: {{ lesson.title }}</h3>
            <div class="quiz-info" *ngIf="lesson.content_data?.quiz_config">
              <div class="quiz-detail">
                <span class="detail-label">Verses:</span>
                <span class="detail-value">{{ lesson.content_data?.quiz_config?.verse_count }} questions</span>
              </div>
              <div class="quiz-detail">
                <span class="detail-label">Pass threshold:</span>
                <span class="detail-value">{{ lesson.content_data?.quiz_config?.pass_threshold }}%</span>
              </div>
              <div class="quiz-detail" *ngIf="userProgress?.quiz_attempts">
                <span class="detail-label">Attempts:</span>
                <span class="detail-value">{{ userProgress?.quiz_attempts }}</span>
              </div>
              <div class="quiz-detail" *ngIf="userProgress?.best_score !== undefined">
                <span class="detail-label">Best score:</span>
                <span class="detail-value">{{ userProgress?.best_score }}%</span>
              </div>
            </div>
            <button class="quiz-start-button" (click)="startQuiz()">
              {{ userProgress?.quiz_attempts ? 'Retake Quiz' : 'Start Quiz' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Quiz Completion Section -->
      <div class="completion-section" *ngIf="lessonCompleted">
        <div class="completion-message">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <h2>Quiz Completed!</h2>
          <p *ngIf="userProgress?.best_score !== undefined">
            Your score: {{ userProgress?.best_score }}%
          </p>
          <p *ngIf="userProgress && userProgress.best_score !== undefined && userProgress.best_score >= (lesson?.content_data?.quiz_config?.pass_threshold ?? 85)">
            Great job! You passed the quiz.
          </p>
          <p *ngIf="userProgress && userProgress.best_score !== undefined && userProgress.best_score < (lesson?.content_data?.quiz_config?.pass_threshold ?? 85)">
            You can retake the quiz to improve your score.
          </p>
          <div class="completion-actions">
            <button class="btn-primary" (click)="goToNextLesson()">Next Lesson</button>
            <button 
              class="btn-secondary" 
              (click)="startQuiz()" 
              *ngIf="userProgress && userProgress.best_score !== undefined && userProgress.best_score < (lesson?.content_data?.quiz_config?.pass_threshold ?? 85)"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./lesson-shared.styles.scss']
})
export class QuizLessonComponent extends BaseLessonComponent {
  constructor(
    route: ActivatedRoute,
    router: Router,
    courseService: CourseService,
    userService: UserService,
  ) {
    super(route, router, courseService, userService);
  }

  protected onLessonLoaded(): void {
    // Quiz-specific initialization if needed
  }

  startQuiz() {
    this.router.navigate(['/courses', this.courseId, 'lessons', this.lessonId, 'quiz']);
  }
}