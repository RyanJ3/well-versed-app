// frontend/src/app/features/workflows/detail/workflow-detail.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  WorkflowDetailResponse,
  WorkflowService,
} from '../../../../core/services/workflow.service';
import { UserService } from '../../../../core/services/user.service';
import { ModalService } from '../../../../core/services/modal.service';
import { User } from '../../../../core/models/user';
import { Lesson } from '../../../../core/models/workflow.model';

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="workflow-detail" *ngIf="workflow">
      <!-- Header -->
      <div class="workflow-header">
        <button class="back-button" (click)="goBack()">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Back
        </button>

        <div class="header-content">
          <h1 class="workflow-title">{{ workflow.title }}</h1>
          <p class="workflow-description">{{ workflow.description }}</p>

          <div class="workflow-meta">
            <div class="meta-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Created by {{ workflow.creator_name }}
            </div>
            <div class="meta-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ workflow.lesson_count }} lessons
            </div>
            <div class="meta-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ workflow.enrolled_count }} students
            </div>
            <div class="meta-item rating-stars" *ngIf="averageRating >= 0">
              <svg
                *ngFor="let s of [1,2,3,4,5]"
                [class.filled]="s <= getStarCount(averageRating)"
                (click)="rateWorkflow(s)"
                [class.clickable]="currentUser"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
          </div>

          <div class="workflow-tags">
            <span class="tag" *ngFor="let tag of workflow.tags">{{
              formatTag(tag)
            }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="header-actions">
          <button
            *ngIf="!workflow.is_enrolled && currentUser"
            class="btn-primary"
            (click)="enrollInWorkflow()"
          >
            Enroll in Course
          </button>

          <button
            *ngIf="workflow.is_enrolled && currentUser"
            class="btn-secondary"
            (click)="unenrollFromWorkflow()"
          >
            Unenroll
          </button>

          <button
            *ngIf="isCreator()"
            class="btn-secondary"
            (click)="editWorkflow()"
          >
            Edit Course
          </button>
        </div>
      </div>

      <!-- Progress Bar (for enrolled users) -->
      <div
        class="progress-section"
        *ngIf="workflow.is_enrolled && workflow.user_progress"
      >
        <div class="progress-info">
          <span class="progress-label">Your Progress</span>
          <span class="progress-text">
            {{ workflow.user_progress.lessons_completed }} /
            {{ workflow.lesson_count }} lessons completed
          </span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            [style.width.%]="getProgressPercentage()"
          ></div>
        </div>
      </div>

      <!-- Lessons List -->
      <div class="lessons-section">
        <h2 class="section-title">Lessons</h2>

        <div class="lessons-list">
          <div
            *ngFor="let lesson of workflow.lessons; let i = index"
            class="lesson-card"
            [class.locked]="!isLessonUnlocked(lesson, i)"
            [class.completed]="isLessonCompleted(lesson)"
            [class.current]="isCurrentLesson(lesson)"
            (click)="selectLesson(lesson, i)"
          >
            <div class="lesson-number">{{ i + 1 }}</div>

            <div class="lesson-content">
              <h3 class="lesson-title">{{ lesson.title }}</h3>
              <p class="lesson-description" *ngIf="lesson.description">
                {{ lesson.description }}
              </p>

              <div class="lesson-meta">
                <span class="lesson-type">
                  <svg
                    *ngIf="lesson.content_type === 'video'"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <svg
                    *ngIf="lesson.content_type === 'article'"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <svg
                    *ngIf="lesson.content_type === 'external_link'"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  {{ getLessonTypeLabel(lesson.content_type) }}
                </span>

                <span
                  class="lesson-duration"
                  *ngIf="lesson.content_data.video_duration"
                >
                  {{ formatDuration(lesson.content_data.video_duration) }}
                </span>
              </div>
            </div>

            <div class="lesson-status">
              <svg
                *ngIf="isLessonCompleted(lesson)"
                class="status-icon completed"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                *ngIf="!isLessonUnlocked(lesson, i)"
                class="status-icon locked"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                *ngIf="isCurrentLesson(lesson)"
                class="status-icon current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .workflow-detail {
        padding: 2rem;
        max-width: 1000px;
        margin: 0 auto;
      }

      /* Header Styles */
      .workflow-header {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      }

      .back-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #f3f4f6;
        border: none;
        border-radius: 0.5rem;
        color: #4b5563;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 1.5rem;
      }

      .back-button:hover {
        background: #e5e7eb;
        transform: translateX(-2px);
      }

      .workflow-title {
        font-size: 2rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }

      .workflow-description {
        color: #6b7280;
        font-size: 1.125rem;
        line-height: 1.75;
        margin-bottom: 1.5rem;
      }

      .workflow-meta {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1rem;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6b7280;
        font-size: 0.875rem;
      }

      .rating-stars svg {
        width: 16px;
        height: 16px;
        color: #e5e7eb;
        cursor: pointer;
      }

      .rating-stars svg.filled {
        color: #fbbf24;
      }

      .workflow-tags {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .tag {
        padding: 0.375rem 0.75rem;
        background: #e0e7ff;
        color: #4338ca;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .header-actions {
        display: flex;
        gap: 1rem;
      }

      .btn-primary,
      .btn-secondary {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .btn-secondary {
        background: #f3f4f6;
        color: #4b5563;
      }

      .btn-secondary:hover {
        background: #e5e7eb;
      }

      /* Progress Section */
      .progress-section {
        background: white;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .progress-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
      }

      .progress-label {
        font-weight: 600;
        color: #1f2937;
      }

      .progress-text {
        color: #6b7280;
        font-size: 0.875rem;
      }

      .progress-bar {
        height: 8px;
        background: #e5e7eb;
        border-radius: 9999px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(to right, #3b82f6, #8b5cf6);
        transition: width 0.3s ease;
      }

      /* Lessons Section */
      .lessons-section {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .section-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 1.5rem;
      }

      .lessons-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .lesson-card {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 1.5rem;
        background: #f9fafb;
        border: 2px solid transparent;
        border-radius: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .lesson-card:hover:not(.locked) {
        background: white;
        border-color: #e5e7eb;
        transform: translateX(4px);
      }

      .lesson-card.current {
        background: #eff6ff;
        border-color: #3b82f6;
      }

      .lesson-card.completed {
        opacity: 0.7;
      }

      .lesson-card.locked {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .lesson-number {
        width: 48px;
        height: 48px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        color: #4b5563;
        flex-shrink: 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .lesson-content {
        flex: 1;
      }

      .lesson-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }

      .lesson-description {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }

      .lesson-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .lesson-type {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .lesson-status {
        flex-shrink: 0;
      }

      .status-icon {
        width: 32px;
        height: 32px;
      }

      .status-icon.completed {
        color: #10b981;
      }

      .status-icon.locked {
        color: #9ca3af;
      }

      .status-icon.current {
        color: #3b82f6;
      }
    `,
  ],
})
export class WorkflowDetailComponent implements OnInit {
  workflow: WorkflowDetailResponse | null = null;
  currentUser: User | null = null;
  workflowId!: number;
  averageRating: number = 0;
  userRating: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private userService: UserService,
    private modalService: ModalService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.workflowId = +params['id'];
      this.loadWorkflow();
      this.loadRating();
    });

    this.userService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (this.workflowId) {
        this.loadRating();
      }
    });
  }

  loadWorkflow() {
    const userId = this.currentUser
      ? typeof this.currentUser.id === 'string'
        ? parseInt(this.currentUser.id)
        : this.currentUser.id
      : undefined;

    this.workflowService.getWorkflow(this.workflowId, userId).subscribe({
      next: (workflow) => {
        this.workflow = workflow;
        this.averageRating = workflow.average_rating || 0;
      },
      error: (error) => {
        console.error('Error loading workflow:', error);
        this.router.navigate(['/courses']);
      },
    });
  }

  loadRating() {
    const userId = this.currentUser
      ? typeof this.currentUser.id === 'string'
        ? parseInt(this.currentUser.id)
        : this.currentUser.id
      : undefined;
    this.workflowService
      .getWorkflowRating(this.workflowId, userId)
      .subscribe((r) => {
        this.averageRating = r.average_rating;
        this.userRating = r.user_rating ?? null;
      });
  }

  rateWorkflow(star: number) {
    if (!this.currentUser) return;
    const userId = typeof this.currentUser.id === 'string' ? parseInt(this.currentUser.id) : this.currentUser.id;
    this.workflowService
      .submitWorkflowRating(this.workflowId, userId, star)
      .subscribe(() => this.loadRating());
  }

  isCreator(): boolean {
    if (!this.workflow || !this.currentUser) return false;
    const userId =
      typeof this.currentUser.id === 'string'
        ? parseInt(this.currentUser.id)
        : this.currentUser.id;
    return this.workflow.creator_id === userId;
  }

  enrollInWorkflow() {
    if (!this.currentUser || !this.workflow) return;

    const userId =
      typeof this.currentUser.id === 'string'
        ? parseInt(this.currentUser.id)
        : this.currentUser.id;

    this.workflowService.enrollInWorkflow(this.workflowId, userId).subscribe({
      next: () => {
        this.loadWorkflow();
      },
      error: (error) => {
        console.error('Error enrolling in workflow:', error);
      },
    });
  }

  unenrollFromWorkflow() {
    this.modalService
      .confirm({
        title: 'Unenroll from Course',
        message:
          'Are you sure you want to unenroll? Your progress will be saved.',
        type: 'warning',
        confirmText: 'Unenroll',
        showCancel: true,
      })
      .then((result) => {
        if (result.confirmed && this.currentUser && this.workflow) {
          const userId =
            typeof this.currentUser.id === 'string'
              ? parseInt(this.currentUser.id)
              : this.currentUser.id;

          this.workflowService
            .unenrollFromWorkflow(this.workflowId, userId)
            .subscribe({
              next: () => {
                this.loadWorkflow();
              },
              error: (error) => {
                console.error('Error unenrolling from workflow:', error);
              },
            });
        }
      });
  }

  editWorkflow() {
    this.router.navigate(['/courses', this.workflowId, 'edit']);
  }

  selectLesson(lesson: Lesson, index: number) {
    if (!this.isLessonUnlocked(lesson, index)) {
      this.modalService.alert(
        'Lesson Locked',
        'Complete the previous lessons to unlock this one.',
        'info',
      );
      return;
    }

    this.router.navigate(['/courses', this.workflowId, 'lessons', lesson.id]);
  }

  isLessonUnlocked(lesson: Lesson, index: number): boolean {
    if (!this.workflow?.is_enrolled) return false;
    if (index === 0) return true; // First lesson is always unlocked

    const progress = this.workflow.user_progress;
    if (!progress) return false;

    // Check if previous lesson is completed
    return progress.lessons_completed >= index;
  }

  isLessonCompleted(lesson: Lesson): boolean {
    if (!this.workflow?.user_progress) return false;
    const progress = this.workflow.user_progress;
    const lessonIndex = this.workflow.lessons.findIndex(
      (l: any) => l.id === lesson.id,
    );
    return progress.lessons_completed > lessonIndex;
  }

  isCurrentLesson(lesson: Lesson): boolean {
    if (!this.workflow?.user_progress) return false;
    return this.workflow.user_progress.current_lesson_id === lesson.id;
  }

  getProgressPercentage(): number {
    if (!this.workflow?.user_progress) return 0;
    const progress = this.workflow.user_progress;
    return (progress.lessons_completed / this.workflow.lesson_count) * 100;
  }

  getLessonTypeLabel(type: string): string {
    switch (type) {
      case 'video':
        return 'Video';
      case 'article':
        return 'Article';
      case 'external_link':
        return 'External Link';
      default:
        return type;
    }
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getStarCount(avg?: number): number {
    return Math.round(avg || 0);
  }

  formatTag(tag: string): string {
    return tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  goBack() {
    this.router.navigate(['/courses']);
  }
}
