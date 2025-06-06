import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { WorkflowService } from '../../core/services/workflow.service';
import { UserService } from '../../core/services/user.service';
import { Workflow } from '../../core/models/workflow.model';
import { User } from '../../core/models/user';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="landing-container">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <div>
            <h1 class="title">Workflow Library</h1>
            <p class="subtitle">Build your faith through structured learning paths</p>
          </div>

          <div class="actions">
            <button class="trending-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 17l6-6 4 4 8-8" />
              </svg>
              Trending
            </button>
            <button class="create-btn" (click)="navigateToCreate()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create New
            </button>
          </div>
        </div>

        <div class="search-filter">
          <div class="search-wrapper">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder="Search workflows, topics, or creators..."
              [(ngModel)]="searchQuery"
              (keyup.enter)="searchWorkflows()"
            >
          </div>

          <div class="view-toggle">
            <button (click)="toggleView('list')" [class.active]="viewMode === 'list'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <button (click)="toggleView('grid')" [class.active]="viewMode === 'grid'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h7v7H4V6zm9 0h7v7h-7V6zM4 15h7v7H4v-7zm9 0h7v7h-7v-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div class="quick-filters">
          <button class="pill">All Workflows</button>
          <button class="pill">In Progress</button>
          <button class="pill">Completed</button>
          <button class="pill">Recommended</button>
          <div class="divider"></div>
          <ng-container *ngFor="let tag of availableTags.slice(0,5)">
            <button
              class="pill"
              [class.selected]="selectedTags.includes(tag)"
              (click)="toggleTag(tag)"
            >
              {{ formatTag(tag) }}
            </button>
          </ng-container>
          <button class="pill more">
            More
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div class="results-count" *ngIf="!loading" >
          Showing {{ workflows.length }} of {{ totalPages * perPage }} workflows
          <button *ngIf="selectedTags.length > 0" class="clear-btn" (click)="clearTags()">Clear filters</button>
        </div>
      </div>

      <!-- Workflows Grid -->
      <div class="grid-view" *ngIf="viewMode === 'grid' && !loading && workflows.length > 0">
        <div class="grid-card" *ngFor="let workflow of workflows" (click)="viewWorkflow(workflow)">
          <div class="grid-thumb">
            <img *ngIf="workflow.thumbnail_url" [src]="workflow.thumbnail_url" alt="" />
            <div *ngIf="!workflow.thumbnail_url" class="thumb-placeholder">{{ getWorkflowIcon(workflow) }}</div>
            <div *ngIf="isEnrolled(workflow.id)" class="grid-progress">
              <div class="progress-bar">
                <div class="progress" [style.width.%]="getProgress(workflow.id)"></div>
              </div>
              <span class="progress-label">{{ getProgress(workflow.id) }}% Complete</span>
            </div>
          </div>
          <div class="grid-content">
            <h3 class="grid-title">{{ workflow.title }}</h3>
            <p class="grid-desc">{{ workflow.description }}</p>
            <div class="grid-meta">
              <span>{{ workflow.lesson_count }} lessons</span>
              <span *ngIf="getDuration(workflow)">{{ getDuration(workflow) }}</span>
            </div>
            <div class="grid-tags">
              <span *ngFor="let tag of workflow.tags.slice(0,3)">{{ formatTag(tag) }}</span>
            </div>
            <div class="grid-footer">
              <div class="creator">
                <div class="avatar">{{ workflow.creator_name.charAt(0) }}</div>
                <span class="creator-name">{{ workflow.creator_name }}</span>
              </div>
              <button class="action-btn" (click)="handleActionClick($event, workflow)" [class.enrolled]="isEnrolled(workflow.id)">
                {{ isEnrolled(workflow.id) ? 'Continue' : 'Enroll' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Workflows List -->
      <div class="list" *ngIf="viewMode === 'list' && !loading && workflows.length > 0">
        <div class="workflow-item" *ngFor="let workflow of workflows">
          <div class="item-main" (click)="toggleExpanded(workflow.id)">
            <div class="thumb">
              <span *ngIf="!workflow.thumbnail_url">{{ getWorkflowIcon(workflow) }}</span>
              <img *ngIf="workflow.thumbnail_url" [src]="workflow.thumbnail_url" alt="">
            </div>

            <div class="info">
              <div class="info-header">
                <h3 class="item-title">{{ workflow.title }}</h3>
                <span class="completed" *ngIf="isEnrolled(workflow.id) && getProgress(workflow.id) === 100">Completed</span>
              </div>
              <p class="item-desc">{{ workflow.description }}</p>

              <div class="meta">
                <span class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {{ workflow.lesson_count }} lessons
                </span>
                <span class="meta-item" *ngIf="getDuration(workflow)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ getDuration(workflow) }}
                </span>
                <span class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {{ workflow.enrolled_count }} enrolled
                </span>
                <span class="creator">by {{ workflow.creator_name }}</span>
              </div>

              <div *ngIf="isEnrolled(workflow.id)" class="progress-wrapper">
                <div class="progress-bar">
                  <div class="progress" [style.width.%]="getProgress(workflow.id)"></div>
                </div>
                <span class="progress-label">{{ getProgress(workflow.id) }}%</span>
              </div>
            </div>

            <button class="action-btn" (click)="handleActionClick($event, workflow)" [class.enrolled]="isEnrolled(workflow.id)">
              {{ isEnrolled(workflow.id) ? 'Continue' : 'Start Learning' }}
            </button>
          </div>

          <div class="item-expanded" *ngIf="expandedId === workflow.id">
            <div class="expanded-content">
              <div class="lesson-overview">
                <h4>Lesson Overview</h4>
                <div class="lesson" *ngFor="let n of [1,2,3,4]; let i = index">
                  <div class="lesson-number" [class.done]="isEnrolled(workflow.id) && i < 2">{{ isEnrolled(workflow.id) && i < 2 ? '✓' : i + 1 }}</div>
                  <span [class.strike]="isEnrolled(workflow.id) && i < 2">Lesson {{ i + 1 }}</span>
                </div>
              </div>
              <div class="learn-overview">
                <h4>What You'll Learn</h4>
                <ul>
                  <li>Core theological concepts</li>
                  <li>Historical context</li>
                  <li>Practical application</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading and Empty States -->
      <div class="loading-container" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading workflows...</p>
      </div>

      <div class="empty-state" *ngIf="!loading && workflows.length === 0">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3>No workflows found</h3>
        <p>Try adjusting your search or filters</p>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button
          class="page-button"
          [disabled]="currentPage === 1"
          (click)="goToPage(currentPage - 1)"
        >
          Previous
        </button>

        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button
          class="page-button"
          [disabled]="currentPage === totalPages"
          (click)="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./workflow-list.component.scss']
})
export class WorkflowListComponent implements OnInit {
  workflows: Workflow[] = [];
  enrolledWorkflows: Map<number, any> = new Map();
  loading = false;
  searchQuery = '';
  selectedTags: string[] = [];
  availableTags: string[] = [];
  currentUser: User | null = null;

  currentPage = 1;
  totalPages = 1;
  perPage = 20;

  expandedId: number | null = null;
  viewMode: 'list' | 'grid' = 'list';

  constructor(
    private workflowService: WorkflowService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAvailableTags();
    this.loadWorkflows();

    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadEnrolledWorkflows();
      }
    });
  }

  loadAvailableTags() {
    this.availableTags = this.workflowService.getSuggestedTags();
  }

  loadWorkflows() {
    this.loading = true;

    this.workflowService.getPublicWorkflows(
      this.currentPage,
      this.perPage,
      this.searchQuery,
      this.selectedTags
    ).subscribe({
      next: (response) => {
        this.workflows = response.workflows;
        this.totalPages = Math.ceil(response.total / this.perPage);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading workflows:', error);
        this.loading = false;
      }
    });
  }

  loadEnrolledWorkflows() {
    if (!this.currentUser) return;

    const userId = typeof this.currentUser.id === 'string'
      ? parseInt(this.currentUser.id)
      : this.currentUser.id;

    this.workflowService.getEnrolledWorkflows(userId).subscribe({
      next: (workflows) => {
        workflows.forEach(w => {
          this.enrolledWorkflows.set(w.id, {
            progress: 0,
            completedLessons: 0
          });
        });
      }
    });
  }

  searchWorkflows() {
    this.currentPage = 1;
    this.loadWorkflows();
  }

  toggleTag(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.searchWorkflows();
  }

  clearTags() {
    this.selectedTags = [];
    this.searchWorkflows();
  }

  formatTag(tag: string): string {
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getTagsDisplay(tags: string[]): string {
    return tags.slice(0, 2).map(tag => this.formatTag(tag)).join(', ');
  }

  viewWorkflow(workflow: Workflow) {
    this.router.navigate(['/workflows', workflow.id]);
  }

  isEnrolled(workflowId: number): boolean {
    return this.enrolledWorkflows.has(workflowId);
  }

  getProgress(workflowId: number): number {
    return this.enrolledWorkflows.get(workflowId)?.progress || 0;
  }

  getCompletedLessons(workflowId: number): number {
    return this.enrolledWorkflows.get(workflowId)?.completedLessons || 0;
  }

  getDuration(workflow: Workflow): string {
    const hours = Math.ceil(workflow.lesson_count * 0.5);
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  getWorkflowIcon(workflow: Workflow): string {
    const icons = ['📖', '🙏', '✝️', '🕊️', '💫', '🌟'];
    return icons[workflow.id % icons.length];
  }

  handleActionClick(event: Event, workflow: Workflow) {
    event.stopPropagation();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isEnrolled(workflow.id)) {
      this.viewWorkflow(workflow);
    } else {
      const userId = typeof this.currentUser.id === 'string'
        ? parseInt(this.currentUser.id)
        : this.currentUser.id;

      this.workflowService.enrollInWorkflow(workflow.id, userId).subscribe({
        next: () => {
          this.enrolledWorkflows.set(workflow.id, { progress: 0, completedLessons: 0 });
          this.viewWorkflow(workflow);
        }
      });
    }
  }

  navigateToCreate() {
    this.router.navigate(['/workflows/create']);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadWorkflows();
  }

  toggleExpanded(id: number) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  toggleView(mode: 'list' | 'grid') {
    this.viewMode = mode;
  }
}
