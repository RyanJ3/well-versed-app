// frontend/src/app/features/courses/lesson/video-lesson.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseService } from '@services/api/course.service';
import { UserService } from '@services/api/user.service';
import { BaseLessonComponent } from './base-lesson.component';
import { VersePickerComponent } from '../../../components/bible/verse-range-picker/verse-range-picker.component';

@Component({
  selector: 'app-video-lesson',
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

      <!-- Video Content -->
      <div class="lesson-content-section">
        <div class="video-content">
          <div class="video-wrapper">
            <iframe
              [src]="getYouTubeEmbedUrl(lesson.content_data?.youtube_url!)"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>

      <!-- Flashcard Selection Section -->
      <div class="flashcard-section" *ngIf="!lessonCompleted">
        <h2 class="section-title">Select Flashcards to Memorize</h2>
        <p class="section-description">
          Choose verses or concepts from this lesson to add to your flashcard deck. 
          You need to complete at least {{ requiredFlashcards }} flashcards to proceed to the next lesson.
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
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Selection Status -->
        <div class="selection-status">
          <span class="selected-count">
            {{ selectedFlashcards.length + selectedVerses.length }} selected ({{ requiredFlashcards }} required)
          </span>
          <button
            class="add-to-queue-button"
            [disabled]="selectedFlashcards.length + selectedVerses.length < requiredFlashcards"
            (click)="addFlashcardsToQueue()"
          >
            Add to Flashcard Queue
          </button>
        </div>
      </div>

      <!-- Completion Section -->
      <div class="completion-section" *ngIf="lessonCompleted">
        <div class="completion-message">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h2>Lesson Completed!</h2>
          <p>Great job! You've completed this lesson and added flashcards to your queue.</p>
          <div class="completion-actions">
            <button class="btn-primary" (click)="goToNextLesson()">Next Lesson</button>
            <button class="btn-secondary" (click)="goToFlashcards()">Practice Flashcards</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./lesson-shared.styles.scss']
})
export class VideoLessonComponent extends BaseLessonComponent {
  constructor(
    route: ActivatedRoute,
    router: Router,
    courseService: CourseService,
    userService: UserService,
    private sanitizer: DomSanitizer,
  ) {
    super(route, router, courseService, userService);
  }

  protected onLessonLoaded(): void {
    // Video-specific initialization if needed
  }

  getYouTubeEmbedUrl(url: string): SafeResourceUrl {
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
}