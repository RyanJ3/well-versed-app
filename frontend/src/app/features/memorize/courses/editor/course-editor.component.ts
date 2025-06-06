// frontend/src/app/features/courses/editor/course-editor.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../../core/services/course.service';
import { UserService } from '../../../../core/services/user.service';
import { ModalService } from '../../../../core/services/modal.service';
import {
  CreateCourseRequest,
  CreateLessonRequest,
  Lesson,
} from '../../../../core/models/course.model';

@Component({
  selector: 'app-course-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="course-editor">
      <div class="editor-header">
        <h1>{{ isEditMode ? 'Edit Course' : 'Create New Course' }}</h1>
        <div class="header-actions">
          <button class="btn-secondary" (click)="cancel()">Cancel</button>
          <button
            class="btn-primary"
            (click)="save()"
            [disabled]="!courseForm.valid || saving"
          >
            {{ saving ? 'Saving...' : 'Save Course' }}
          </button>
        </div>
      </div>

      <form [formGroup]="courseForm" class="editor-form">
        <!-- Course Details -->
        <div class="form-section">
          <h2>Course Details</h2>

          <div class="form-group">
            <label for="title">Title *</label>
            <input
              id="title"
              type="text"
              formControlName="title"
              placeholder="Enter course title"
              class="form-control"
            />
            <div
              class="error-message"
              *ngIf="
                courseForm.get('title')?.touched &&
                courseForm.get('title')?.errors?.['required']
              "
            >
              Title is required
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description *</label>
            <textarea
              id="description"
              formControlName="description"
              placeholder="Describe what learners will gain from this course"
              rows="4"
              class="form-control"
            ></textarea>
            <div
              class="error-message"
              *ngIf="
                courseForm.get('description')?.touched &&
                courseForm.get('description')?.errors?.['required']
              "
            >
              Description is required
            </div>
          </div>

          <div class="form-group">
            <label for="thumbnail">Thumbnail URL</label>
            <input
              id="thumbnail"
              type="url"
              formControlName="thumbnail_url"
              placeholder="https://example.com/image.jpg"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Tags</label>
            <div class="tags-input">
              <div class="selected-tags">
                <span
                  *ngFor="let tag of selectedTags"
                  class="tag"
                  (click)="removeTag(tag)"
                >
                  {{ formatTag(tag) }}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </span>
              </div>
              <select class="tag-select" (change)="addTag($event)" [value]="''">
                <option value="">Add a tag...</option>
                <option
                  *ngFor="let tag of availableTags"
                  [value]="tag"
                  [disabled]="selectedTags.includes(tag)"
                >
                  {{ formatTag(tag) }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="is_public" />
              Make this course public
            </label>
            <p class="help-text">
              Public courses can be discovered and enrolled in by other users
            </p>
          </div>
        </div>

        <!-- Lessons -->
        <div class="form-section">
          <div class="section-header">
            <h2>Lessons</h2>
            <button type="button" class="btn-add" (click)="addLesson()">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M12 5v14m-7-7h14"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Add Lesson
            </button>
          </div>

          <div class="lessons-list" formArrayName="lessons">
            <div
              *ngFor="let lesson of lessons.controls; let i = index"
              [formGroupName]="i"
              class="lesson-item"
            >
              <div class="lesson-header">
                <div class="drag-handle">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"
                    />
                  </svg>
                </div>
                <h3>Lesson {{ i + 1 }}</h3>
                <button
                  type="button"
                  class="btn-remove"
                  (click)="removeLesson(i)"
                >
                  Remove
                </button>
              </div>

              <div class="lesson-form">
                <div class="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    formControlName="title"
                    placeholder="Lesson title"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label>Description</label>
                  <textarea
                    formControlName="description"
                    placeholder="Brief description of the lesson"
                    rows="2"
                    class="form-control"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label>Content Type *</label>
                  <select
                    formControlName="content_type"
                    class="form-control"
                    (change)="onContentTypeChange(i)"
                  >
                    <option value="">Select content type</option>
                    <option value="video">YouTube Video</option>
                    <option value="article">Text Article</option>
                    <option value="external_link">External Link</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>

                <!-- Dynamic content fields based on type -->
                <ng-container [ngSwitch]="lesson.get('content_type')?.value">
                  <!-- Video fields -->
                  <div *ngSwitchCase="'video'" class="content-fields">
                    <div class="form-group">
                      <label>YouTube URL *</label>
                      <input
                        type="url"
                        formControlName="youtube_url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        class="form-control"
                      />
                    </div>
                  </div>

                  <!-- Article fields -->
                  <div *ngSwitchCase="'article'" class="content-fields">
                    <div class="form-group">
                      <label>Article Content *</label>
                      <textarea
                        formControlName="article_text"
                        placeholder="Write your article content here..."
                        rows="6"
                        class="form-control"
                      ></textarea>
                    </div>
                  </div>

                  <!-- External link fields -->
                  <div *ngSwitchCase="'external_link'" class="content-fields">
                    <div class="form-group">
                      <label>External URL *</label>
                      <input
                        type="url"
                        formControlName="external_url"
                        placeholder="https://example.com/resource"
                        class="form-control"
                      />
                    </div>
                    <div class="form-group">
                      <label>Link Title</label>
                      <input
                        type="text"
                        formControlName="external_title"
                        placeholder="Title for the external resource"
                        class="form-control"
                      />
                    </div>
                  </div>

                  <!-- Quiz fields -->
                  <div *ngSwitchCase="'quiz'" class="content-fields">
                    <div class="quiz-info">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                        />
                      </svg>
                      <p>
                        Quiz will pull verses from previous lessons in this
                        course
                      </p>
                    </div>

                    <div class="form-group">
                      <label>Number of Verses *</label>
                      <input
                        type="number"
                        formControlName="quiz_verse_count"
                        min="2"
                        max="7"
                        placeholder="2-7"
                        class="form-control small"
                      />
                      <p class="help-text">
                        How many verses to include in the quiz (2-7)
                      </p>
                    </div>

                    <div class="form-group">
                      <label>Pass Threshold (%)</label>
                      <input
                        type="number"
                        formControlName="quiz_pass_threshold"
                        min="50"
                        max="100"
                        placeholder="85"
                        class="form-control small"
                      />
                      <p class="help-text">
                        Minimum confidence score to pass (default: 85%)
                      </p>
                    </div>

                    <div class="form-group">
                      <label class="checkbox-label">
                        <input
                          type="checkbox"
                          formControlName="quiz_randomize"
                        />
                        Randomize verse selection
                      </label>
                      <p class="help-text">
                        Pull different verses for each attempt
                      </p>
                    </div>

                    <div class="quiz-source-warning" *ngIf="i === 0">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                        />
                      </svg>
                      <span
                        >Note: First lesson cannot be a quiz as there are no
                        previous lessons to pull from</span
                      >
                    </div>
                  </div>
                </ng-container>

                <div
                  class="form-group"
                  *ngIf="lesson.get('content_type')?.value !== 'quiz'"
                >
                  <label>Required Flashcards</label>
                  <input
                    type="number"
                    formControlName="flashcards_required"
                    min="1"
                    max="20"
                    class="form-control small"
                  />
                  <p class="help-text">
                    Number of flashcards students must select to complete this
                    lesson
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="lessons.length === 0">
            <svg
              width="48"
              height="48"
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
            <p>No lessons added yet</p>
            <button type="button" class="btn-primary" (click)="addLesson()">
              Add First Lesson
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./course-editor.component.scss'],
})
export class CourseEditorComponent implements OnInit {
  courseForm!: FormGroup;
  isEditMode = false;
  courseId?: number;
  saving = false;
  availableTags: string[] = [];
  selectedTags: string[] = [];
  userId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private userService: UserService,
    private modalService: ModalService,
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.availableTags = this.courseService.getSuggestedTags();

    this.userService.currentUser$.subscribe((user) => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      } else {
        this.router.navigate(['/login']);
      }
    });

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.courseId = +params['id'];
        this.isEditMode = true;
        this.loadCourse();
      }
    });
  }

  initializeForm() {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      thumbnail_url: [''],
      is_public: [true],
      lessons: this.fb.array([]),
    });
  }

  get lessons() {
    return this.courseForm.get('lessons') as FormArray;
  }

  loadCourse() {
    if (!this.courseId) return;

    this.courseService.getCourse(this.courseId).subscribe({
      next: (course) => {
        // Check if user is the creator
        if (course.creator_id !== this.userId) {
          this.router.navigate(['/courses', this.courseId]);
          return;
        }

        // Populate form
        this.courseForm.patchValue({
          title: course.title,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          is_public: course.is_public,
        });

        this.selectedTags = [...course.tags];

        // Load existing lessons
        course.lessons.forEach((lesson) => {
          this.addLesson(lesson);
        });
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.router.navigate(['/courses']);
      },
    });
  }

  createLessonFormGroup(lesson?: Lesson): FormGroup {
    const group = this.fb.group({
      title: [lesson?.title || '', Validators.required],
      description: [lesson?.description || ''],
      content_type: [lesson?.content_type || '', Validators.required],
      youtube_url: [lesson?.content_data?.youtube_url || ''],
      article_text: [lesson?.content_data?.article_text || ''],
      external_url: [lesson?.content_data?.external_url || ''],
      external_title: [lesson?.content_data?.external_title || ''],
      flashcards_required: [
        3,
        [Validators.required, Validators.min(1), Validators.max(20)],
      ],
      // Quiz fields
      quiz_verse_count: [lesson?.content_data?.quiz_config?.verse_count || 5],
      quiz_pass_threshold: [
        lesson?.content_data?.quiz_config?.pass_threshold || 85,
      ],
      quiz_randomize: [lesson?.content_data?.quiz_config?.randomize || true],
    });

    // Add dynamic validators based on content type
    this.setupContentValidators(group);

    return group;
  }

  setupContentValidators(group: FormGroup) {
    const contentType = group.get('content_type');
    const youtubeUrl = group.get('youtube_url');
    const articleText = group.get('article_text');
    const externalUrl = group.get('external_url');
    const quizVerseCount = group.get('quiz_verse_count');
    const quizThreshold = group.get('quiz_pass_threshold');

    contentType?.valueChanges.subscribe((type) => {
      // Clear all validators first
      youtubeUrl?.clearValidators();
      articleText?.clearValidators();
      externalUrl?.clearValidators();
      quizVerseCount?.clearValidators();
      quizThreshold?.clearValidators();

      // Add validators based on type
      switch (type) {
        case 'video':
          youtubeUrl?.setValidators([Validators.required]);
          break;
        case 'article':
          articleText?.setValidators([Validators.required]);
          break;
        case 'external_link':
          externalUrl?.setValidators([Validators.required]);
          break;
        case 'quiz':
          quizVerseCount?.setValidators([
            Validators.required,
            Validators.min(2),
            Validators.max(7),
          ]);
          quizThreshold?.setValidators([
            Validators.required,
            Validators.min(50),
            Validators.max(100),
          ]);
          break;
      }

      // Update validity
      youtubeUrl?.updateValueAndValidity();
      articleText?.updateValueAndValidity();
      externalUrl?.updateValueAndValidity();
      quizVerseCount?.updateValueAndValidity();
      quizThreshold?.updateValueAndValidity();
    });
  }

  addLesson(lesson?: Lesson) {
    this.lessons.push(this.createLessonFormGroup(lesson));
  }

  removeLesson(index: number) {
    this.lessons.removeAt(index);
  }

  onContentTypeChange(lessonIndex: number) {
    const lesson = this.lessons.at(lessonIndex);
    this.setupContentValidators(lesson as FormGroup);

    // Check if this is the first lesson and it's a quiz
    if (lessonIndex === 0 && lesson.get('content_type')?.value === 'quiz') {
      this.modalService.alert(
        'Invalid Quiz Position',
        'The first lesson cannot be a quiz as there are no previous lessons to pull verses from.',
        'warning',
      );
      lesson.patchValue({ content_type: '' });
    }
  }

  addTag(event: Event) {
    const select = event.target as HTMLSelectElement;
    const tag = select.value;

    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    }

    select.value = '';
  }

  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter((t) => t !== tag);
  }

  formatTag(tag: string): string {
    return tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async save() {
    if (!this.courseForm.valid) {
      Object.keys(this.courseForm.controls).forEach((key) => {
        this.courseForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving = true;

    try {
      const formValue = this.courseForm.value;

      if (this.isEditMode && this.courseId) {
        // Update existing course
        const updates = {
          title: formValue.title,
          description: formValue.description,
          thumbnail_url: formValue.thumbnail_url,
          is_public: formValue.is_public,
          tags: this.selectedTags,
        };

        await this.courseService
          .updateCourse(this.courseId, updates)
          .toPromise();

        this.modalService.success('Success', 'Course updated successfully!');
        this.router.navigate(['/courses', this.courseId]);
      } else {
        // Create new course
        const courseData: CreateCourseRequest = {
          title: formValue.title,
          description: formValue.description,
          thumbnail_url: formValue.thumbnail_url,
          is_public: formValue.is_public,
          tags: this.selectedTags,
        };

        const course = await this.courseService
          .createCourse(courseData, this.userId)
          .toPromise();

        // Create lessons
        for (let i = 0; i < formValue.lessons.length; i++) {
          const lessonData = formValue.lessons[i];
          const lessonRequest: CreateLessonRequest = {
            course_id: course!.id,
            title: lessonData.title,
            description: lessonData.description,
            content_type: lessonData.content_type,
            content_data: this.buildContentData(lessonData),
            position: i + 1,
          };

          await this.courseService.createLesson(lessonRequest).toPromise();
        }

        this.modalService.success('Success', 'Course created successfully!');
        this.router.navigate(['/courses', course!.id]);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      this.modalService.alert(
        'Error',
        'Failed to save course. Please try again.',
        'danger',
      );
    } finally {
      this.saving = false;
    }
  }

  buildContentData(lessonData: any): any {
    switch (lessonData.content_type) {
      case 'video':
        return { youtube_url: lessonData.youtube_url };
      case 'article':
        return { article_text: lessonData.article_text };
      case 'external_link':
        return {
          external_url: lessonData.external_url,
          external_title: lessonData.external_title,
        };
      case 'quiz':
        return {
          quiz_config: {
            source_lessons: [], // Will be populated by backend based on position
            verse_count: lessonData.quiz_verse_count,
            pass_threshold: lessonData.quiz_pass_threshold,
            randomize: lessonData.quiz_randomize,
          },
        };
      default:
        return {};
    }
  }

  cancel() {
    if (this.courseForm.dirty) {
      this.modalService
        .confirm({
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to leave?',
          type: 'warning',
          confirmText: 'Leave',
          showCancel: true,
        })
        .then((result) => {
          if (result.confirmed) {
            this.navigateBack();
          }
        });
    } else {
      this.navigateBack();
    }
  }

  navigateBack() {
    if (this.isEditMode && this.courseId) {
      this.router.navigate(['/courses', this.courseId]);
    } else {
      this.router.navigate(['/courses']);
    }
  }
}
