// frontend/src/app/features/courses/lesson/base-lesson.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '@services/api/course.service';
import { UserService } from '@services/api/user.service';
import {
  Lesson,
  LessonFlashcard,
  UserLessonProgress,
} from '@models/course.model';

@Component({
  template: '',
})
export abstract class BaseLessonComponent implements OnInit {
  lesson: Lesson | null = null;
  lessonFlashcards: LessonFlashcard[] = [];
  userProgress: UserLessonProgress | null = null;

  courseId!: number;
  lessonId!: number;
  userId!: number;

  selectedFlashcards: number[] = [];
  selectedVerses: string[] = [];
  requiredFlashcards = 3;
  progressPercentage = 0;
  lessonCompleted = false;
  showVersePicker = true;

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected courseService: CourseService,
    protected userService: UserService,
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
          
          if (this.lesson.content_type === 'quiz') {
            const passThreshold = this.lesson.content_data?.quiz_config?.pass_threshold || 85;
            this.lessonCompleted = this.userProgress.best_score !== undefined && 
                                  this.userProgress.best_score >= passThreshold;
          }
          
          this.updateProgress();
        }

        if (!this.userProgress && this.userId) {
          this.startLesson();
        }

        this.onLessonLoaded();
      },
      error: (error) => {
        console.error('Error loading lesson:', error);
        this.goBack();
      },
    });
  }

  protected abstract onLessonLoaded(): void;

  startLesson() {
    this.courseService.startLesson(this.lessonId, this.userId).subscribe({
      next: (progress) => {
        this.userProgress = progress;
        this.requiredFlashcards = progress.flashcards_required;
      },
    });
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
    this.router.navigate(['/courses', this.courseId]);
  }

  goToFlashcards() {
    this.router.navigate(['/deck']);
  }

  goBack() {
    this.router.navigate(['/courses', this.courseId]);
  }
}