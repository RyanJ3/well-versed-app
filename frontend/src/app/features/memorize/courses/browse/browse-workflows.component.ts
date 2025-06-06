// frontend/src/app/features/workflows/browse/browse-workflows.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { WorkflowService } from '../../../../core/services/workflow.service';
import { UserService } from '../../../../core/services/user.service';
import { Workflow } from '../../../../core/models/workflow.model';
import { User } from '../../../../core/models/user';

@Component({
  selector: 'app-browse-workflows',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './browse-workflows.component.html',
  styleUrls: ['./browse-workflows.component.scss'],
})
export class BrowseWorkflowsComponent implements OnInit {
  workflows: Workflow[] = [];
  enrolledWorkflowIds: number[] = [];
  loading = false;
  searchQuery = '';
  selectedTags: string[] = [];
  availableTags: string[] = [];
  currentUser: User | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  perPage = 12;

  constructor(
    private workflowService: WorkflowService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadAvailableTags();
    this.loadWorkflows();

    // Subscribe to current user
    this.userService.currentUser$.subscribe((user) => {
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

    this.workflowService
      .getPublicWorkflows(
        this.currentPage,
        this.perPage,
        this.searchQuery,
        this.selectedTags,
      )
      .subscribe({
        next: (response) => {
          this.workflows = response.workflows;
          this.totalPages = Math.ceil(response.total / this.perPage);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading workflows:', error);
          this.loading = false;
        },
      });
  }

  loadEnrolledWorkflows() {
    if (!this.currentUser) return;

    const userId =
      typeof this.currentUser.id === 'string'
        ? parseInt(this.currentUser.id)
        : this.currentUser.id;

    this.workflowService.getEnrolledWorkflows(userId).subscribe({
      next: (workflows) => {
        this.enrolledWorkflowIds = workflows.map((w) => w.id);
      },
      error: (error) => {
        console.error('Error loading enrolled workflows:', error);
      },
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

  formatTag(tag: string): string {
    return tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  viewWorkflow(workflow: Workflow) {
    this.router.navigate(['/courses', workflow.id]);
  }

  isEnrolled(workflowId: number): boolean {
    return this.enrolledWorkflowIds.includes(workflowId);
  }

  toggleEnrollment(event: Event, workflow: Workflow) {
    event.stopPropagation();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    const userId =
      typeof this.currentUser.id === 'string'
        ? parseInt(this.currentUser.id)
        : this.currentUser.id;

    if (this.isEnrolled(workflow.id)) {
      // If enrolled, navigate to the workflow
      this.viewWorkflow(workflow);
    } else {
      // Enroll in the workflow
      this.workflowService.enrollInWorkflow(workflow.id, userId).subscribe({
        next: () => {
          this.enrolledWorkflowIds.push(workflow.id);
          // Navigate to the workflow after enrollment
          this.viewWorkflow(workflow);
        },
        error: (error) => {
          console.error('Error enrolling in workflow:', error);
        },
      });
    }
  }

  getCreatorInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  navigateToCreate() {
    this.router.navigate(['/courses/create']);
  }
}
