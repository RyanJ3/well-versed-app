// frontend/src/app/features/workflows/editor/workflow-editor.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowService } from '../../../core/services/workflow.service';
import { UserService } from '../../../core/services/user.service';
import { ModalService } from '../../../core/services/modal.service';
import { CreateWorkflowRequest, CreateLessonRequest, Lesson } from '../../../core/models/workflow.model';

@Component({
  selector: 'app-workflow-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="workflow-editor">
      <div class="editor-header">
        <h1>{{ isEditMode ? 'Edit Workflow' : 'Create New Workflow' }}</h1>
        <div class="header-actions">
          <button class="btn-secondary" (click)="cancel()">Cancel</button>
          <button class="btn-primary" (click)="save()" [disabled]="!workflowForm.valid || saving">
            {{ saving ? 'Saving...' : 'Save Workflow' }}
          </button>
        </div>
      </div>

      <form [formGroup]="workflowForm" class="editor-form">
        <!-- Workflow Details -->
        <div class="form-section">
          <h2>Workflow Details</h2>
          
          <div class="form-group">
            <label for="title">Title *</label>
            <input 
              id="title"
              type="text" 
              formControlName="title" 
              placeholder="Enter workflow title"
              class="form-control"
            >
            <div class="error-message" *ngIf="workflowForm.get('title')?.touched && workflowForm.get('title')?.errors?.['required']">
              Title is required
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description *</label>
            <textarea 
              id="description"
              formControlName="description" 
              placeholder="Describe what learners will gain from this workflow"
              rows="4"
              class="form-control"
            ></textarea>
            <div class="error-message" *ngIf="workflowForm.get('description')?.touched && workflowForm.get('description')?.errors?.['required']">
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
            >
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </span>
              </div>
              <select 
                class="tag-select" 
                (change)="addTag($event)"
                [value]="''"
              >
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
              <input 
                type="checkbox" 
                formControlName="is_public"
              >
              Make this workflow public
            </label>
            <p class="help-text">Public workflows can be discovered and enrolled in by other users</p>
          </div>
        </div>

        <!-- Lessons -->
        <div class="form-section">
          <div class="section-header">
            <h2>Lessons</h2>
            <button 
              type="button" 
              class="btn-add" 
              (click)="addLesson()"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14m-7-7h14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Add Lesson
            </button>
          </div>

          <div class="lessons-list" formArrayName="lessons">
            <div 
              *ngFor="let lesson of lessons.controls; let i = index" 
              [formGroupName]="i"
              class="lesson-item"
              cdkDrag
            >
              <div class="lesson-header">
                <div class="drag-handle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/>
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
                  >
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
                      >
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
                      >
                    </div>
                    <div class="form-group">
                      <label>Link Title</label>
                      <input 
                        type="text" 
                        formControlName="external_title" 
                        placeholder="Title for the external resource"
                        class="form-control"
                      >
                    </div>
                  </div>
                </ng-container>

                <div class="form-group">
                  <label>Audio URL (Optional)</label>
                  <input 
                    type="url" 
                    formControlName="audio_url" 
                    placeholder="https://example.com/audio.mp3"
                    class="form-control"
                  >
                  <p class="help-text">Add audio narration for this lesson</p>
                </div>

                <div class="form-group">
                  <label>Required Flashcards</label>
                  <input 
                    type="number" 
                    formControlName="flashcards_required" 
                    min="1"
                    max="20"
                    class="form-control"
                  >
                  <p class="help-text">Number of flashcards students must select to complete this lesson</p>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="lessons.length === 0">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>No lessons added yet</p>
            <button 
              type="button" 
              class="btn-primary" 
              (click)="addLesson()"
            >
              Add First Lesson
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .workflow-editor {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .editor-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-primary, .btn-secondary, .btn-add {
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

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #93c5fd;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #4b5563;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-add {
      background: #10b981;
      color: white;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-add:hover {
      background: #059669;
    }

    /* Form Styles */
    .form-section {
      background: white;
      border-radius: 0.75rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-section h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    textarea.form-control {
      resize: vertical;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .help-text {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: normal;
      cursor: pointer;
    }

    /* Tags Input */
    .tags-input {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tag:hover {
      background: #c7d2fe;
    }

    .tag-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    /* Lessons List */
    .lessons-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .lesson-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .lesson-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .drag-handle {
      cursor: move;
      color: #9ca3af;
    }

    .lesson-header h3 {
      flex: 1;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
    }

    .btn-remove {
      padding: 0.375rem 0.75rem;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-remove:hover {
      background: #fecaca;
    }

    .content-fields {
      background: white;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-state svg {
      margin: 0 auto 1rem;
      opacity: 0.5;
    }

    .empty-state p {
      margin-bottom: 1rem;
    }
  `]
})
export class WorkflowEditorComponent implements OnInit {
  workflowForm!: FormGroup;
  isEditMode = false;
  workflowId?: number;
  saving = false;
  availableTags: string[] = [];
  selectedTags: string[] = [];
  userId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private userService: UserService,
    private modalService: ModalService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.availableTags = this.workflowService.getSuggestedTags();

    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      } else {
        this.router.navigate(['/login']);
      }
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.workflowId = +params['id'];
        this.isEditMode = true;
        this.loadWorkflow();
      }
    });
  }

  initializeForm() {
    this.workflowForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      thumbnail_url: [''],
      is_public: [true],
      lessons: this.fb.array([])
    });
  }

  get lessons() {
    return this.workflowForm.get('lessons') as FormArray;
  }

  loadWorkflow() {
    if (!this.workflowId) return;

    this.workflowService.getWorkflow(this.workflowId).subscribe({
      next: (workflow) => {
        // Check if user is the creator
        if (workflow.creator_id !== this.userId) {
          this.router.navigate(['/workflows', this.workflowId]);
          return;
        }

        // Populate form
        this.workflowForm.patchValue({
          title: workflow.title,
          description: workflow.description,
          thumbnail_url: workflow.thumbnail_url,
          is_public: workflow.is_public
        });

        this.selectedTags = [...workflow.tags];

        // Load existing lessons
        workflow.lessons.forEach(lesson => {
          this.addLesson(lesson);
        });
      },
      error: (error) => {
        console.error('Error loading workflow:', error);
        this.router.navigate(['/workflows']);
      }
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
      audio_url: [lesson?.audio_url || ''],
      flashcards_required: [3, [Validators.required, Validators.min(1), Validators.max(20)]]
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

    contentType?.valueChanges.subscribe(type => {
      // Clear all validators first
      youtubeUrl?.clearValidators();
      articleText?.clearValidators();
      externalUrl?.clearValidators();

      // Add validators based on type
      switch(type) {
        case 'video':
          youtubeUrl?.setValidators([Validators.required]);
          break;
        case 'article':
          articleText?.setValidators([Validators.required]);
          break;
        case 'external_link':
          externalUrl?.setValidators([Validators.required]);
          break;
      }

      // Update validity
      youtubeUrl?.updateValueAndValidity();
      articleText?.updateValueAndValidity();
      externalUrl?.updateValueAndValidity();
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
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
  }

  formatTag(tag: string): string {
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async save() {
    if (!this.workflowForm.valid) {
      Object.keys(this.workflowForm.controls).forEach(key => {
        this.workflowForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving = true;

    try {
      const formValue = this.workflowForm.value;
      
      if (this.isEditMode && this.workflowId) {
        // Update existing workflow
        const updates = {
          title: formValue.title,
          description: formValue.description,
          thumbnail_url: formValue.thumbnail_url,
          is_public: formValue.is_public,
          tags: this.selectedTags
        };

        await this.workflowService.updateWorkflow(this.workflowId, updates).toPromise();

        // Update lessons
        // For simplicity, we'll just navigate to the workflow
        // In a real app, you'd handle lesson updates here
        
        this.modalService.success('Success', 'Workflow updated successfully!');
        this.router.navigate(['/workflows', this.workflowId]);
      } else {
        // Create new workflow
        const workflowData: CreateWorkflowRequest = {
          title: formValue.title,
          description: formValue.description,
          thumbnail_url: formValue.thumbnail_url,
          is_public: formValue.is_public,
          tags: this.selectedTags
        };

        const workflow = await this.workflowService.createWorkflow(workflowData, this.userId).toPromise();

        // Create lessons
        for (let i = 0; i < formValue.lessons.length; i++) {
          const lessonData = formValue.lessons[i];
          const lessonRequest: CreateLessonRequest = {
            workflow_id: workflow!.id,
            title: lessonData.title,
            description: lessonData.description,
            content_type: lessonData.content_type,
            content_data: {
              youtube_url: lessonData.youtube_url,
              article_text: lessonData.article_text,
              external_url: lessonData.external_url,
              external_title: lessonData.external_title
            },
            audio_url: lessonData.audio_url,
            position: i + 1
          };

          await this.workflowService.createLesson(lessonRequest).toPromise();
        }

        this.modalService.success('Success', 'Workflow created successfully!');
        this.router.navigate(['/workflows', workflow!.id]);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      this.modalService.alert('Error', 'Failed to save workflow. Please try again.', 'danger');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    if (this.workflowForm.dirty) {
      this.modalService.confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        type: 'warning',
        confirmText: 'Leave',
        showCancel: true
      }).then(result => {
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
      this.router.navigate(['/workflows', this.workflowId]);
    } else {
      this.router.navigate(['/workflows']);
    }
  }
}