// frontend/src/app/features/workflows/workflow-builder.component.ts

import { Component, OnInit } from '@angular/core';
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
import { WorkflowService } from '../../core/services/workflow.service';
import { UserService } from '../../core/services/user.service';
import { ModalService } from '../../core/services/modal.service';

import { LessonContent } from '../../core/models/workflow.model';
import {
  VersePickerComponent,
  VerseSelection,
} from '../../shared/components/verse-range-picker/verse-range-picker.component';

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
  audio_url?: string;
  // Quiz specific fields
  quiz_verse_count?: number;
  quiz_pass_threshold?: number;
  quiz_randomize?: boolean;
  quiz_cards?: { verseCodes: string[]; reference: string }[];
  flashcards_required: number;
  position: number;
}

@Component({
  selector: 'app-workflow-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    VersePickerComponent,
  ],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./workflow-builder.component.scss'],
})
export class WorkflowBuilderComponent implements OnInit {
  workflowForm!: FormGroup;
  lessonForm!: FormGroup;

  isEditMode = false;
  workflowId?: number;
  saving = false;
  savingLesson = false;

  lessons: Lesson[] = [];
  selectedLessonIndex: number | null = null;

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
    private workflowService: WorkflowService,
    private userService: UserService,
    private modalService: ModalService,
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.availableTags = this.workflowService.getSuggestedTags();

    this.userService.currentUser$.subscribe((user) => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      } else {
        this.router.navigate(['/login']);
      }
    });

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.workflowId = +params['id'];
        this.isEditMode = true;
        this.loadWorkflow();
      }
    });
  }

  initializeForms() {
    this.workflowForm = this.fb.group({
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
      audio_url: [''],
      quiz_verse_count: [5],
      quiz_pass_threshold: [85],
      quiz_randomize: [true],
      quiz_cards: this.fb.array([]),
      flashcards_required: [
        3,
        [Validators.required, Validators.min(1), Validators.max(20)],
      ],
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

  loadWorkflow() {
    if (!this.workflowId) return;

    this.workflowService.getWorkflow(this.workflowId).subscribe({
      next: (workflow) => {
        if (workflow.creator_id !== this.userId) {
          this.router.navigate(['/courses', this.workflowId]);
          return;
        }

        this.workflowForm.patchValue({
          title: workflow.title,
          description: workflow.description,
          thumbnail_url: workflow.thumbnail_url,
          is_public: workflow.is_public,
        });

        this.selectedTags = [...workflow.tags];
        this.lessons = workflow.lessons.map((lesson, index) => ({
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
          flashcards_required: 3, // Default value, as it's not in the API response
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
      audio_url: lesson.audio_url || '',
      quiz_verse_count: lesson.quiz_cards
        ? lesson.quiz_cards.reduce((t, c) => t + c.verseCodes.length, 0)
        : lesson.quiz_verse_count || 5,
      quiz_pass_threshold: lesson.quiz_pass_threshold || 85,
      quiz_randomize: lesson.quiz_randomize ?? true,
      flashcards_required: lesson.flashcards_required,
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
      flashcards_required: 3,
      position: this.lessons.length + 1,
    };

    this.lessons.push(newLesson);
    this.selectLesson(this.lessons.length - 1);
  }

  saveLessonToMemory() {
    if (this.selectedLessonIndex === null) return;

    const formValue = this.lessonForm.value;
    this.lessons[this.selectedLessonIndex] = {
      ...this.lessons[this.selectedLessonIndex],
      ...formValue,
      quiz_cards: this.quizCards.value,
      quiz_verse_count: this.getTotalQuizVerses(),
    };
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

    // Update selected index if needed
    if (this.selectedLessonIndex === fromIndex) {
      this.selectedLessonIndex = toIndex;
    } else if (this.selectedLessonIndex === toIndex) {
      this.selectedLessonIndex = fromIndex;
    }
  }

  updatePositions() {
    this.lessons.forEach((lesson, index) => {
      lesson.position = index + 1;
    });
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
        return 'No type selected';
    }
  }

  addTag(tag: string) {
    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    }
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
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.workflowForm.valid;
      case 2:
        return this.lessons.length > 0;
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

  async saveWorkflow() {
    if (!this.workflowForm.valid) {
      this.workflowForm.markAllAsTouched();
      return;
    }

    if (this.selectedLessonIndex !== null) {
      this.saveLessonToMemory();
    }

    if (this.lessons.length === 0) {
      this.modalService.alert(
        'No Lessons',
        'Please add at least one lesson to your workflow.',
        'warning',
      );
      return;
    }

    this.saving = true;

    try {
      const workflowData = {
        ...this.workflowForm.value,
        tags: this.selectedTags,
      };

      if (this.isEditMode && this.workflowId) {
        await this.workflowService
          .updateWorkflow(this.workflowId, workflowData)
          .toPromise();
        // Update lessons would go here
        this.modalService.success('Success', 'Workflow updated successfully!');
      } else {
        const workflow = await this.workflowService
          .createWorkflow(workflowData, this.userId)
          .toPromise();

        for (const lesson of this.lessons) {
          await this.workflowService
            .createLesson({
              workflow_id: workflow!.id,
              title: lesson.title,
              description: lesson.description,
              content_type: lesson.content_type as any,
              content_data: this.buildContentData(lesson),
              audio_url: lesson.audio_url,
              position: lesson.position,
            })
            .toPromise();
        }

        this.modalService.success('Success', 'Workflow created successfully!');
        this.router.navigate(['/courses', workflow!.id]);
      }
    } catch (error) {
      this.modalService.alert(
        'Error',
        'Failed to save workflow. Please try again.',
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

  cancel() {
    if (this.workflowForm.dirty || this.lessonForm.dirty) {
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
    if (this.isEditMode && this.workflowId) {
      this.router.navigate(['/courses', this.workflowId]);
    } else {
      this.router.navigate(['/courses']);
    }
  }
}
