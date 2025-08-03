// frontend/src/app/features/courses/lesson/lesson-view.component.ts

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseService } from '@services/api/course.service';
import { UserService } from '@services/api/user.service';
import {
  Lesson,
  LessonFlashcard,
  UserLessonProgress,
} from '@models/course.model';
import { VersePickerComponent } from '../../../components/bible/verse-range-picker/verse-range-picker.component';

@Component({
  selector: 'app-lesson-view',
  standalone: true,
  imports: [CommonModule, FormsModule, VersePickerComponent],
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
          Back to Course
        </button>

        <h1 class="lesson-title">{{ lesson.title }}</h1>
        <p class="lesson-description" *ngIf="lesson.description">
          {{ lesson.description }}
        </p>
      </div>

      <!-- Content Section -->
      <div class="lesson-content-section" [ngSwitch]="lesson.content_type">
        <!-- Video Content -->
        <div *ngSwitchCase="'video'" class="video-content">
          <div class="video-wrapper">
            <iframe
              [src]="getYouTubeEmbedUrl(lesson.content_data.youtube_url!)"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </div>

        <!-- Article Content -->
        <div *ngSwitchCase="'article'" class="article-content">
          <div
            class="article-text"
            [innerHTML]="formatArticleText(lesson.content_data.article_text!)"
          ></div>
        </div>

        <!-- External Link Content -->
        <div *ngSwitchCase="'external_link'" class="external-content">
          <div class="external-card">
            <svg
              width="48"
              height="48"
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
            <h3>
              {{ lesson.content_data.external_title || 'External Resource' }}
            </h3>
            <p>Click the button below to view this resource in a new tab</p>
            <a
              [href]="lesson.content_data.external_url"
              target="_blank"
              rel="noopener noreferrer"
              class="external-link-button"
            >
              Open External Resource
            </a>
          </div>
        </div>
      </div>

      <!-- Flashcard Selection Section -->
      <div class="flashcard-section" *ngIf="!lessonCompleted">
        <h2 class="section-title">Select Flashcards to Memorize</h2>
        <p class="section-description">
          Choose verses or concepts from this lesson to add to your flashcard
          deck. You need to complete at least
          {{ requiredFlashcards }} flashcards to proceed to the next lesson.
        </p>

        <!-- Verse Picker for Bible verses -->
        <div class="verse-picker-section" *ngIf="showVersePicker">
          <h3>Add Bible Verses</h3>
          <app-verse-picker
            [theme]="'enhanced'"
            [pageType]="'flashcard'"
            (selectionApplied)="onVerseSelection($event)"
          ></app-verse-picker>
        </div>

        <!-- Pre-made Flashcards -->
        <div class="premade-flashcards" *ngIf="lessonFlashcards.length > 0">
          <h3>Lesson Flashcards</h3>
          <div class="flashcard-grid">
            <div
              *ngFor="let card of lessonFlashcards"
              class="flashcard-preview"
              [class.selected]="selectedFlashcards.includes(card.id)"
              (click)="toggleFlashcard(card)"
            >
              <div class="card-content">
                <div class="card-front">{{ card.front_content }}</div>
                <div class="card-back">{{ card.back_content }}</div>
              </div>
              <div class="card-checkbox">
                <svg
                  *ngIf="selectedFlashcards.includes(card.id)"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Count -->
        <div class="selection-status">
          <span class="selected-count">
            {{ selectedFlashcards.length + selectedVerses.length }} selected ({{
              requiredFlashcards
            }}
            required)
          </span>
          <button
            class="add-to-queue-button"
            [disabled]="
              selectedFlashcards.length + selectedVerses.length <
              requiredFlashcards
            "
            (click)="addFlashcardsToQueue()"
          >
            Add to Flashcard Queue
          </button>
        </div>
      </div>

      <!-- Completion Section -->
      <div class="completion-section" *ngIf="lessonCompleted">
        <div class="completion-message">
          <svg
            width="64"
            height="64"
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
          <h2>Lesson Completed!</h2>
          <p>
            Great job! You've completed this lesson and added flashcards to your
            queue.
          </p>
          <div class="completion-actions">
            <button class="btn-primary" (click)="goToNextLesson()">
              Next Lesson
            </button>
            <button class="btn-secondary" (click)="goToFlashcards()">
              Practice Flashcards
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .lesson-view {
        min-height: 100vh;
        background: #f9fafb;
      }

      /* Progress Bar */
      .lesson-progress {
        position: sticky;
        top: 0;
        z-index: 50;
        background: white;
        padding: 0.5rem 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .progress-bar {
        height: 4px;
        background: #e5e7eb;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(to right, #3b82f6, #8b5cf6);
        transition: width 0.3s ease;
      }

      /* Header */
      .lesson-header {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }

      .back-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        color: #4b5563;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 1.5rem;
      }

      .back-button:hover {
        background: #f3f4f6;
        transform: translateX(-2px);
      }

      .lesson-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }

      .lesson-description {
        font-size: 1.125rem;
        color: #6b7280;
        line-height: 1.75;
      }

      /* Content Section */
      .lesson-content-section {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 2rem 2rem;
      }

      /* Video Content */
      .video-wrapper {
        position: relative;
        padding-bottom: 56.25%; /* 16:9 aspect ratio */
        height: 0;
        overflow: hidden;
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .video-wrapper iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      /* Article Content */
      .article-content {
        background: white;
        padding: 2rem;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .article-text {
        font-size: 1.125rem;
        line-height: 1.75;
        color: #374151;
      }

      .article-text h1,
      .article-text h2,
      .article-text h3 {
        margin-top: 2rem;
        margin-bottom: 1rem;
        font-weight: 600;
      }

      .article-text p {
        margin-bottom: 1rem;
      }

      /* External Content */
      .external-card {
        background: white;
        padding: 3rem;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        text-align: center;
      }

      .external-card svg {
        color: #6b7280;
        margin: 0 auto 1rem;
      }

      .external-card h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }

      .external-card p {
        color: #6b7280;
        margin-bottom: 1.5rem;
      }

      .external-link-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: #3b82f6;
        color: white;
        text-decoration: none;
        border-radius: 0.5rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .external-link-button:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }

      /* Flashcard Section */
      .flashcard-section {
        max-width: 1000px;
        margin: 3rem auto;
        padding: 2rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .section-title {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }

      .section-description {
        color: #6b7280;
        margin-bottom: 2rem;
      }

      .verse-picker-section,
      .premade-flashcards {
        margin-bottom: 2rem;
      }

      .verse-picker-section h3,
      .premade-flashcards h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 1rem;
      }

      .flashcard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }

      .flashcard-preview {
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .flashcard-preview:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
      }

      .flashcard-preview.selected {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .card-content {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .card-front {
        font-weight: 600;
        color: #1f2937;
      }

      .card-back {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .card-checkbox {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 24px;
        height: 24px;
        border: 2px solid #e5e7eb;
        border-radius: 0.25rem;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .flashcard-preview.selected .card-checkbox {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
      }

      /* Selection Status */
      .selection-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
      }

      .selected-count {
        font-weight: 500;
        color: #4b5563;
      }

      .add-to-queue-button {
        padding: 0.75rem 1.5rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .add-to-queue-button:hover:not(:disabled) {
        background: #2563eb;
      }

      .add-to-queue-button:disabled {
        background: #e5e7eb;
        color: #9ca3af;
        cursor: not-allowed;
      }

      /* Completion Section */
      .completion-section {
        max-width: 600px;
        margin: 3rem auto;
        padding: 3rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        text-align: center;
      }

      .completion-message svg {
        color: #10b981;
        margin: 0 auto 1rem;
      }

      .completion-message h2 {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }

      .completion-message p {
        color: #6b7280;
        margin-bottom: 2rem;
      }

      .completion-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
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
    `,
  ],
})
export class LessonViewComponent implements OnInit {
  lesson: Lesson | null = null;
  lessonFlashcards: LessonFlashcard[] = [];
  userProgress: UserLessonProgress | null = null;

  courseId!: number;
  lessonId!: number;
  userId!: number;

  selectedFlashcards: number[] = [];
  selectedVerses: string[] = [];
  requiredFlashcards = 3; // Default minimum
  progressPercentage = 0;
  lessonCompleted = false;
  showVersePicker = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private userService: UserService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.courseId = +params['courseId'];
      this.lessonId = +params['lessonId'];
      this.loadLesson();
    });

    this.userService.currentUser$.subscribe((user) => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      }
    });
  }

  loadLesson() {
    this.courseService.getLesson(this.lessonId, this.userId).subscribe({
      next: (response) => {
        this.lesson = response;
        this.lessonFlashcards = response.flashcards || [];
        this.userProgress = response.user_progress || null;

        if (this.userProgress) {
          this.requiredFlashcards = this.userProgress.flashcards_required;
          this.lessonCompleted = !!this.userProgress.completed_at;
          this.updateProgress();
        }

        // Start lesson if not already started
        if (!this.userProgress && this.userId) {
          this.startLesson();
        }
      },
      error: (error) => {
        console.error('Error loading lesson:', error);
        this.goBack();
      },
    });
  }

  startLesson() {
    this.courseService.startLesson(this.lessonId, this.userId).subscribe({
      next: (progress) => {
        this.userProgress = progress;
        this.requiredFlashcards = progress.flashcards_required;
      },
    });
  }

  getYouTubeEmbedUrl(url: string): SafeResourceUrl {
    // Extract video ID from YouTube URL
    const videoId = this.extractYouTubeId(url);
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  extractYouTubeId(url: string): string {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    );
    return match ? match[1] : '';
  }

  formatArticleText(text: string): string {
    // Basic markdown-like formatting
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  toggleFlashcard(card: LessonFlashcard) {
    const index = this.selectedFlashcards.indexOf(card.id);
    if (index > -1) {
      this.selectedFlashcards.splice(index, 1);
    } else {
      this.selectedFlashcards.push(card.id);
    }
    this.updateProgress();
  }

  onVerseSelection(selection: any) {
    this.selectedVerses = selection.verseCodes;
    this.updateProgress();
  }

  updateProgress() {
    const totalSelected =
      this.selectedFlashcards.length + this.selectedVerses.length;
    const completed = this.userProgress?.flashcards_completed || 0;
    this.progressPercentage = Math.min(
      ((completed + totalSelected) / this.requiredFlashcards) * 100,
      100,
    );
  }

  addFlashcardsToQueue() {
    const request = {
      lesson_id: this.lessonId,
      flashcard_ids: this.selectedFlashcards,
      verse_codes: this.selectedVerses,
    };

    this.courseService.addFlashcardsToQueue(request, this.userId).subscribe({
      next: () => {
        // Mark lesson as completed
        this.courseService
          .completeLesson(this.lessonId, this.userId)
          .subscribe({
            next: () => {
              this.lessonCompleted = true;
            },
          });
      },
      error: (error) => {
        console.error('Error adding flashcards:', error);
      },
    });
  }

  goToNextLesson() {
    // Navigate to course detail - it will show the next unlocked lesson
    this.router.navigate(['/courses', this.courseId]);
  }

  goToFlashcards() {
    this.router.navigate(['/deck']);
  }

  goBack() {
    this.router.navigate(['/courses', this.courseId]);
  }
}
