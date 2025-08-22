// frontend/src/app/features/courses/lesson/lesson-view.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '@services/api/course.service';
import { UserService } from '@services/api/user.service';
import { VideoLessonComponent } from './video-lesson.component';
import { ArticleLessonComponent } from './article-lesson.component';
import { ExternalLessonComponent } from './external-lesson.component';
import { QuizLessonComponent } from './quiz-lesson.component';

@Component({
  selector: 'app-lesson-view',
  standalone: true,
  imports: [
    CommonModule, 
    VideoLessonComponent, 
    ArticleLessonComponent, 
    ExternalLessonComponent, 
    QuizLessonComponent
  ],
  template: `
    <div [ngSwitch]="lessonContentType" *ngIf="lessonContentType">
      <app-video-lesson *ngSwitchCase="'video'"></app-video-lesson>
      <app-article-lesson *ngSwitchCase="'article'"></app-article-lesson>
      <app-external-lesson *ngSwitchCase="'external_link'"></app-external-lesson>
      <app-quiz-lesson *ngSwitchCase="'quiz'"></app-quiz-lesson>
    </div>
  `,
  styles: []
})
export class LessonViewComponent implements OnInit {
  lessonContentType: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const lessonId = +params['lessonId'];
      this.loadLessonType(lessonId);
    });
  }

  private loadLessonType(lessonId: number) {
    let userId: number;
    
    this.userService.currentUser$.subscribe((user) => {
      if (user) {
        userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
        
        this.courseService.getLesson(lessonId, userId).subscribe({
          next: (lesson) => {
            this.lessonContentType = lesson.content_type;
          },
          error: (error) => {
            console.error('Error loading lesson type:', error);
          },
        });
      }
    });
  }
}
