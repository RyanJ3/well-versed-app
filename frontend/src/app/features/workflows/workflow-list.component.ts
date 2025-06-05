// frontend/src/app/features/workflows/workflow-list.component.ts

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
    <div class="workflow-list-container">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">Learning Workflows</h1>
        <p class="page-subtitle">Explore curated lesson series to deepen your faith</p>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
        <div class="search-bar">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search workflows..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="searchWorkflows()"
          >
          <button class="search-button" (click)="searchWorkflows()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>
        
        <div class="filter-tags">
          <button 
            class="tag"
            [class.active]="selectedTags.length === 0"
            (click)="clearTags()"
          >
            All
          </button>
          <button 
            *ngFor="let tag of availableTags" 
            class="tag"
            [class.active]="selectedTags.includes(tag)"
            (click)="toggleTag(tag)"
          >
            {{ formatTag(tag) }}
          </button>
        </div>
      </div>

      <!-- Create Workflow Button (for logged-in users) -->
      <div class="create-section" *ngIf="currentUser">
        <button class="create-button" (click)="navigateToCreate()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create New Workflow
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading workflows...</p>
      </div>

      <!-- Workflows List -->
      <div class="list-view" *ngIf="!loading && workflows.length > 0">
        <div 
          *ngFor="let workflow of workflows" 
          class="workflow-list-item"
          (click)="viewWorkflow(workflow)"
        >
          <div class="list-thumbnail">
            <span *ngIf="!workflow.thumbnail_url">{{ getWorkflowIcon(workflow) }}</span>
            <img *ngIf="workflow.thumbnail_url" [src]="workflow.thumbnail_url" alt="">
          </div>
          
          <div class="list-content">
            <div class="list-header">
              <h3 class="list-title">{{ workflow.title }}</h3>
              <span 
                class="list-badge" 
                *ngIf="isEnrolled(workflow.id)"
                [class.in-progress]="getProgress(workflow.id) > 0 && getProgress(workflow.id) < 100"
                [class.completed]="getProgress(workflow.id) === 100"
              >
                <span *ngIf="getProgress(workflow.id) === 0">Enrolled</span>
                <span *ngIf="getProgress(workflow.id) > 0 && getProgress(workflow.id) < 100">In Progress</span>
                <span *ngIf="getProgress(workflow.id) === 100">Completed</span>
              </span>
            </div>
            
            <p class="list-description">{{ workflow.description }}</p>
            
            <div class="list-footer">
              <span class="stat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {{ workflow.lesson_count }} lessons
              </span>
              
              <span class="stat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {{ workflow.enrolled_count }} enrolled
              </span>
              
              <span class="stat-item" *ngIf="getDuration(workflow)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ getDuration(workflow) }}
              </span>
              
              <span class="stat-item" *ngIf="isEnrolled(workflow.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ getCompletedLessons(workflow.id) }}/{{ workflow.lesson_count }} completed
              </span>
              
              <span class="stat-item tags" *ngIf="workflow.tags.length > 0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {{ getTagsDisplay(workflow.tags) }}
                <span *ngIf="workflow.tags.length > 2">+{{ workflow.tags.length - 2 }}</span>
              </span>
              
              <span class="creator-info">
                Created by {{ workflow.creator_name }}
              </span>
            </div>
          </div>

          <button 
            class="action-button"
            (click)="handleActionClick($event, workflow)"
            [class.enrolled]="isEnrolled(workflow.id)"
          >
            <span *ngIf="!isEnrolled(workflow.id)">Enroll</span>
            <span *ngIf="isEnrolled(workflow.id)">Continue</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && workflows.length === 0">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3>No workflows found</h3>
        <p>Try adjusting your search or filters</p>
      </div>

      <!-- Pagination -->
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
            progress: 0, // Would come from user progress data
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
    // Estimate based on lesson count
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
}