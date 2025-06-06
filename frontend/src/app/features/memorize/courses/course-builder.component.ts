// frontend/src/app/features/courses/course-builder.component.ts

import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { UserService } from '../../../core/services/user.service';
import { ModalService } from '../../../core/services/modal.service';

import { LessonContent } from '../../../core/models/course.model';
import {
  VersePickerComponent,
  VerseSelection,
} from '../../../shared/components/verse-range-picker/verse-range-picker.component';

interface Lesson {
  id?: number;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'external_link' | 'quiz' | '';
  /**
   * Lessons retrieved from the API include a content_data object which holds
   * the actual lesson content. When building a new lesson we flatten these
   * values onto the lesson itself, but keeping this optional property allows
   * us to easily map existing lessons returned by the backend.
   */
  content_data?: LessonContent;
  youtube_url?: string;
  article_text?: string;
  external_url?: string;
  external_title?: string;
  // Quiz specific fields
  quiz_verse_count?: number;
  quiz_pass_threshold?: number;
  quiz_randomize?: boolean;
  quiz_cards?: { verseCodes: string[]; reference: string }[];
  position: number;
}

@Component({
  selector: 'app-course-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    VersePickerComponent,
  ],
  templateUrl: './course-builder.component.html',
  styleUrls: ['./course-builder.component.scss'],
})
export class CourseBuilderComponent implements OnInit {
  courseForm!: FormGroup;
  lessonForm!: FormGroup;

  isEditMode = false;
  courseId?: number;
  saving = false;
  savingLesson = false;

  lessons: Lesson[] = [];
  selectedLessonIndex: number | null = null;

  draggedLessonIndex: number | null = null;
  originalLessons: Lesson[] | null = null;
  draggedCardIndex: number | null = null;
  originalQuizCards: FormGroup[] | null = null;
  dropHandled = false;

  availableTags: string[] = [];
  selectedTags: string[] = [];

  userId!: number;

  // Step navigation
  currentStep = 1;
  steps = [
    { number: 1, title: 'Basic Info', description: 'Title & description' },
    { number: 2, title: 'Add Lessons', description: 'Create content' },
    { number: 3, title: 'Review', description: 'Preview & settings' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private userService: UserService,
    private modalService: ModalService,
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.availableTags = this.courseService.getSuggestedTags();

    // Load draft from localStorage if available
    const draftRaw = localStorage.getItem('courseBuilderDraft');
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft.courseForm) {
          this.courseForm.patchValue(draft.courseForm);
        }
        if (Array.isArray(draft.selectedTags)) {
          this.selectedTags = draft.selectedTags;
        }
        if (Array.isArray(draft.lessons)) {
          this.lessons = draft.lessons;
        }
        if (typeof draft.currentStep === 'number') {
          this.currentStep = draft.currentStep;
        }
        if (
          typeof draft.selectedLessonIndex === 'number' &&
          draft.selectedLessonIndex < this.lessons.length
        ) {
          this.selectLesson(draft.selectedLessonIndex);
        }
      } catch (e) {
        console.error('Failed to load draft', e);
      }
    }

    this.courseForm.valueChanges.subscribe(() => this.autoSave());

    this.lessonForm.valueChanges.subscribe(() => {
      if (this.currentStep === 2 && this.selectedLessonIndex !== null) {
        this.saveLessonToMemory();
      } else {
        this.autoSave();
      }
    });

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

  initializeForms() {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      thumbnail_url: [''],
      is_public: [true],
    });

    this.lessonForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      content_type: ['', Validators.required],
      youtube_url: [''],
      article_text: [''],
      external_url: [''],
      external_title: [''],
      quiz_verse_count: [5],
      quiz_pass_threshold: [85],
      quiz_randomize: [true],
      quiz_cards: this.fb.array([]),
    });

    this.setupContentTypeValidation();
  }

  setupContentTypeValidation() {
    this.lessonForm.get('content_type')?.valueChanges.subscribe((type) => {
      const controls = {
        youtube_url: this.lessonForm.get('youtube_url'),
        article_text: this.lessonForm.get('article_text'),
        external_url: this.lessonForm.get('external_url'),
        quiz_verse_count: this.lessonForm.get('quiz_verse_count'),
        quiz_pass_threshold: this.lessonForm.get('quiz_pass_threshold'),
      };

      // Clear all validators
      Object.values(controls).forEach((control) => control?.clearValidators());

      // Set validators based on type
      switch (type) {
        case 'video':
          controls.youtube_url?.setValidators([Validators.required]);
          break;
        case 'article':
          controls.article_text?.setValidators([
            Validators.required,
            Validators.minLength(100),
          ]);
          break;
        case 'external_link':
          controls.external_url?.setValidators([Validators.required]);
          break;
        case 'quiz':
          controls.quiz_verse_count?.setValidators([
            Validators.required,
            Validators.min(2),
            Validators.max(7),
          ]);
          controls.quiz_pass_threshold?.setValidators([
            Validators.required,
            Validators.min(50),
            Validators.max(100),
          ]);
          if (this.quizCards.length === 0) {
            this.addQuizCard();
          }
          break;
      }

      Object.values(controls).forEach((control) =>
        control?.updateValueAndValidity(),
      );

      if (type !== 'quiz') {
        while (this.quizCards.length) {
          this.quizCards.removeAt(0);
        }
      }
    });
  }

  get quizCards(): FormArray {
    return this.lessonForm.get('quiz_cards') as FormArray;
  }

  createQuizCardGroup(): FormGroup {
    return this.fb.group({
      reference: ['Select verses...'],
      verseCodes: [[]],
      verseCount: [0],
    });
  }

  addQuizCard() {
    if (this.quizCards.length >= 3 || this.getTotalQuizVerses() >= 5) return;
    this.quizCards.push(this.createQuizCardGroup());
  }

  removeQuizCard(index: number) {
    this.quizCards.removeAt(index);
  }

  isLessonComplete(lesson: Lesson): boolean {
    if (!lesson.title || !lesson.content_type) return false;
    switch (lesson.content_type) {
      case 'video':
        return !!lesson.youtube_url;
      case 'article':
        return !!lesson.article_text && lesson.article_text.length >= 100;
      case 'external_link':
        return !!lesson.external_url;
      case 'quiz':
        return !!lesson.quiz_cards && lesson.quiz_cards.length > 0;
      default:
        return false;
    }
  }

  areAllLessonsComplete(): boolean {
    return this.lessons.every((l) => this.isLessonComplete(l));
  }

  getTotalQuizVerses(): number {
    return this.quizCards.controls.reduce(
      (sum, c) => sum + (c.get('verseCount')?.value || 0),
      0,
    );
  }

  getMaxVersesForCard(index: number): number {
    const current = this.quizCards.at(index);
    const remaining =
      5 - (this.getTotalQuizVerses() - (current.get('verseCount')?.value || 0));
    return remaining > 0 ? remaining : 1;
  }

  applyQuizSelection(index: number, sel: VerseSelection) {
    const current = this.quizCards.at(index);
    const totalExcl =
      this.getTotalQuizVerses() - (current.get('verseCount')?.value || 0);
    if (totalExcl + sel.verseCodes.length > 5) {
      this.modalService.alert(
        'Limit Reached',
        'You can only select up to 5 verses across all cards.',
        'warning',
      );
      return;
    }
    current.patchValue({
      reference: sel.reference,
      verseCodes: sel.verseCodes,
      verseCount: sel.verseCount,
    });
  }

  onCardDragStart(index: number) {
    this.draggedCardIndex = index;
    this.originalQuizCards = this.quizCards.controls.slice() as FormGroup[];
    this.dropHandled = false;
  }

  onCardDragOver(index: number, event: DragEvent) {
    event.preventDefault();
    if (this.draggedCardIndex === null || index === this.draggedCardIndex)
      return;
    const control = this.quizCards.at(this.draggedCardIndex);
    this.quizCards.removeAt(this.draggedCardIndex);
    this.quizCards.insert(index, control);
    this.draggedCardIndex = index;
  }

  onCardDrop(index: number) {
    if (this.draggedCardIndex === null) return;
    this.dropHandled = true;
    this.draggedCardIndex = null;
    this.originalQuizCards = null;
  }

  onCardDragEnd() {
    if (!this.dropHandled && this.originalQuizCards) {
      this.quizCards.clear();
      this.originalQuizCards.forEach((c) => this.quizCards.push(c));
    }
    this.draggedCardIndex = null;
    this.originalQuizCards = null;
  }

  loadCourse() {
    if (!this.courseId) return;

    this.courseService.getCourse(this.courseId).subscribe({
      next: (course) => {
        if (course.creator_id !== this.userId) {
          this.router.navigate(['/courses', this.courseId]);
          return;
        }

        this.courseForm.patchValue({
          title: course.title,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          is_public: course.is_public,
        });

        this.selectedTags = [...course.tags];
        this.lessons = course.lessons.map((lesson, index) => ({
          ...lesson,
          content_type: lesson.content_type,
          youtube_url: lesson.content_data?.youtube_url,
          article_text: lesson.content_data?.article_text,
          external_url: lesson.content_data?.external_url,
          external_title: lesson.content_data?.external_title,
          quiz_verse_count: lesson.content_data?.quiz_config?.verse_count,
          quiz_pass_threshold: lesson.content_data?.quiz_config?.pass_threshold,
          quiz_randomize: lesson.content_data?.quiz_config?.randomize,
          quiz_cards: [],
          position: index + 1,
        }));

        if (this.lessons.length > 0) {
          this.selectLesson(0);
        }
      },
    });
  }

  selectLesson(index: number) {
    if (this.selectedLessonIndex !== null && this.lessonForm.dirty) {
      this.saveLessonToMemory();
    }

    this.selectedLessonIndex = index;
    const lesson = this.lessons[index];

    this.lessonForm.patchValue({
      title: lesson.title,
      description: lesson.description || '',
      content_type: lesson.content_type,
      youtube_url: lesson.youtube_url || '',
      article_text: lesson.article_text || '',
      external_url: lesson.external_url || '',
      external_title: lesson.external_title || '',
      quiz_verse_count: lesson.quiz_cards
        ? lesson.quiz_cards.reduce((t, c) => t + c.verseCodes.length, 0)
        : lesson.quiz_verse_count || 5,
      quiz_pass_threshold: lesson.quiz_pass_threshold || 85,
      quiz_randomize: lesson.quiz_randomize ?? true,
    });

    const cards = lesson.quiz_cards || [];
    const arr = this.fb.array(cards.map(() => this.createQuizCardGroup()));
    arr.controls.forEach((ctrl, idx) => {
      const c = cards[idx];
      if (c) {
        ctrl.patchValue({
          reference: c.reference,
          verseCodes: c.verseCodes,
          verseCount: c.verseCodes.length,
        });
      }
    });
    this.lessonForm.setControl('quiz_cards', arr);

    this.lessonForm.markAsPristine();
  }

  addLesson() {
    const newLesson: Lesson = {
      title: `Lesson ${this.lessons.length + 1}`,
      content_type: '',
      quiz_verse_count: 5,
      quiz_pass_threshold: 85,
      quiz_randomize: true,
      quiz_cards: [],
      position: this.lessons.length + 1,
    };

    this.lessons.push(newLesson);
    this.selectLesson(this.lessons.length - 1);
    this.autoSave();
  }

  saveLessonToMemory() {
    if (this.selectedLessonIndex === null) return;

    if (
      this.lessonForm.get('content_type')?.value === 'quiz' &&
      this.quizCards.length === 0
    ) {
      return;
    }

    const formValue = this.lessonForm.value;
    this.lessons[this.selectedLessonIndex] = {
      ...this.lessons[this.selectedLessonIndex],
      ...formValue,
      quiz_cards: this.quizCards.value,
      quiz_verse_count: this.getTotalQuizVerses(),
    };

    this.updatePositions();
    this.autoSave();
  }

  deleteLesson(index: number) {
    this.modalService
      .danger(
        'Delete Lesson',
        'Are you sure you want to delete this lesson? This action cannot be undone.',
        'Delete',
      )
      .then((confirmed) => {
        if (confirmed) {
          this.lessons.splice(index, 1);
          this.updatePositions();

          if (this.selectedLessonIndex === index) {
            this.selectedLessonIndex = null;
            this.lessonForm.reset();
          } else if (
            this.selectedLessonIndex &&
            this.selectedLessonIndex > index
          ) {
            this.selectedLessonIndex--;
          }
          this.autoSave();
        }
      });
  }

  moveLesson(fromIndex: number, direction: 'up' | 'down') {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

    if (toIndex < 0 || toIndex >= this.lessons.length) return;

    const temp = this.lessons[fromIndex];
    this.lessons[fromIndex] = this.lessons[toIndex];
    this.lessons[toIndex] = temp;

    this.updatePositions();
    this.autoSave();

    // Update selected index if needed
    if (this.selectedLessonIndex === fromIndex) {
      this.selectedLessonIndex = toIndex;
    } else if (this.selectedLessonIndex === toIndex) {
      this.selectedLessonIndex = fromIndex;
    }
  }

  onLessonDragStart(index: number) {
    this.draggedLessonIndex = index;
    this.originalLessons = [...this.lessons];
    this.dropHandled = false;
  }

  onLessonDragOver(index: number, event: DragEvent) {
    event.preventDefault();
    if (this.draggedLessonIndex === null || index === this.draggedLessonIndex)
      return;
    const [moved] = this.lessons.splice(this.draggedLessonIndex, 1);
    this.lessons.splice(index, 0, moved);
    this.draggedLessonIndex = index;
    this.updatePositions();
  }

  onLessonDrop(index: number) {
    if (this.draggedLessonIndex === null) return;
    this.dropHandled = true;
    this.draggedLessonIndex = null;
    this.originalLessons = null;
  }

  onLessonDragEnd() {
    if (!this.dropHandled && this.originalLessons) {
      this.lessons = this.originalLessons;
      this.updatePositions();
    }
    this.draggedLessonIndex = null;
    this.originalLessons = null;
    this.autoSave();
  }

  updatePositions() {
    this.lessons.forEach((lesson, index) => {
      lesson.position = index + 1;
    });
    this.autoSave();
  }

  get estimatedDuration(): number {
    // Estimate ~30 minutes per lesson
    return Math.ceil(this.lessons.length * 0.5);
  }

  get pieSlices() {
    const counts = {
      video: 0,
      article: 0,
      external_link: 0,
      quiz: 0,
    } as Record<string, number>;
    for (const lesson of this.lessons) {
      counts[lesson.content_type] = (counts[lesson.content_type] || 0) + 1;
    }
    const total = this.lessons.length || 1;
    const colors: Record<string, string> = {
      video: '#3b82f6',
      article: '#8b5cf6',
      external_link: '#10b981',
      quiz: '#f59e0b',
    };
    const icons: Record<string, string> = {
      video: '📹',
      article: '📄',
      external_link: '🔗',
      quiz: '❓',
    };
    const slices: {
      path: string;
      color: string;
      icon: string;
      label: string;
      count: number;
    }[] = [];
    let start = 0;
    for (const type of Object.keys(counts)) {
      const count = counts[type];
      if (!count) continue;
      const pct = count / total;
      const end = start + pct;
      slices.push({
        path: this.describeArc(75, 75, 60, start * 360, end * 360),
        color: colors[type],
        icon: icons[type],
        label: this.getLessonTypeLabel(type),
        count,
      });
      start = end;
    }
    return slices;
  }

  polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  describeArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
  ) {
    const start = this.polarToCartesian(cx, cy, r, endAngle);
    const end = this.polarToCartesian(cx, cy, r, startAngle);
    const large = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${cx},${cy} L ${start.x},${start.y} A ${r},${r} 0 ${large} 0 ${end.x},${end.y} Z`;
  }

  getLessonIcon(type: string): string {
    switch (type) {
      case 'video':
        return '📹';
      case 'article':
        return '📄';
      case 'external_link':
        return '🔗';
      case 'quiz':
        return '❓';
      default:
        return '📝';
    }
  }

  getLessonTypeLabel(type: string): string {
    switch (type) {
      case 'video':
        return 'Video lesson';
      case 'article':
        return 'Article';
      case 'external_link':
        return 'External link';
      case 'quiz':
        return 'Quiz';
      default:
        return '';
    }
  }

  addTag(tag: string) {
    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
      this.autoSave();
    }
  }

  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter((t) => t !== tag);
    this.autoSave();
  }

  formatTag(tag: string): string {
    return tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Step navigation methods
  goToStep(step: number) {
    if (step === this.currentStep) return;

    // Validate current step before moving
    if (step > this.currentStep && !this.canProceed()) {
      return;
    }

    // Save lesson changes if on step 2
    if (this.currentStep === 2 && this.selectedLessonIndex !== null) {
      this.saveLessonToMemory();
    }

    this.currentStep = step;
    this.autoSave();
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.courseForm.valid;
      case 2:
        return this.lessons.length > 0 && this.areAllLessonsComplete();
      default:
        return true;
    }
  }

  nextStep() {
    if (this.currentStep < this.steps.length && this.canProceed()) {
      this.goToStep(this.currentStep + 1);
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  getStepStatus(stepNumber: number): 'completed' | 'active' | 'pending' {
    if (stepNumber < this.currentStep) return 'completed';
    if (stepNumber === this.currentStep) return 'active';
    return 'pending';
  }

  async saveCourse() {
    if (!this.courseForm.valid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    if (this.selectedLessonIndex !== null) {
      this.saveLessonToMemory();
    }

    if (this.lessons.length === 0) {
      this.modalService.alert(
        'No Lessons',
        'Please add at least one lesson to your course.',
        'warning',
      );
      return;
    }

    this.saving = true;

    try {
      const courseData = {
        ...this.courseForm.value,
        tags: this.selectedTags,
      };

      if (this.isEditMode && this.courseId) {
        await this.courseService
          .updateCourse(this.courseId, courseData)
          .toPromise();
        // Update lessons would go here
        this.modalService.success('Success', 'Course updated successfully!');
        localStorage.removeItem('courseBuilderDraft');
      } else {
        const course = await this.courseService
          .createCourse(courseData, this.userId)
          .toPromise();

        for (const lesson of this.lessons) {
          await this.courseService
            .createLesson({
              course_id: course!.id,
              title: lesson.title,
              description: lesson.description,
              content_type: lesson.content_type as any,
              content_data: this.buildContentData(lesson),
              position: lesson.position,
            })
            .toPromise();
        }

        this.modalService.success('Success', 'Course created successfully!');
        localStorage.removeItem('courseBuilderDraft');
        this.router.navigate(['/courses', course!.id]);
      }
    } catch (error) {
      this.modalService.alert(
        'Error',
        'Failed to save course. Please try again.',
        'danger',
      );
    } finally {
      this.saving = false;
    }
  }

  buildContentData(lesson: Lesson): any {
    switch (lesson.content_type) {
      case 'video':
        return { youtube_url: lesson.youtube_url };
      case 'article':
        return { article_text: lesson.article_text };
      case 'external_link':
        return {
          external_url: lesson.external_url,
          external_title: lesson.external_title,
        };
      case 'quiz':
        return {
          quiz_config: {
            source_lessons: [],
            verse_count: lesson.quiz_cards
              ? lesson.quiz_cards.reduce((t, c) => t + c.verseCodes.length, 0)
              : lesson.quiz_verse_count,
            pass_threshold: lesson.quiz_pass_threshold,
            randomize: lesson.quiz_randomize,
            flashcards: lesson.quiz_cards || [],
          },
        };
      default:
        return {};
    }
  }

  @HostListener('document:click', ['$event'])
  onAnyButtonClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('button') && this.currentStep === 2 && this.selectedLessonIndex !== null) {
      this.saveLessonToMemory();
    }
  }

  @HostListener('document:keydown')
  onAnyKey() {
    if (this.currentStep === 2 && this.selectedLessonIndex !== null) {
      this.saveLessonToMemory();
    }
  }

  autoSave() {
    const state = {
      courseForm: this.courseForm.value,
      lessons: this.lessons,
      selectedTags: this.selectedTags,
      currentStep: this.currentStep,
      selectedLessonIndex: this.selectedLessonIndex,
    };
    localStorage.setItem('courseBuilderDraft', JSON.stringify(state));
  }

  cancel() {
    if (this.courseForm.dirty || this.lessonForm.dirty) {
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
