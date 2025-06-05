// frontend/src/app/features/workflows/workflow-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  WorkflowService,
  WorkflowResponse,
} from '../../core/services/workflow.service';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './workflow-list.component.html',
  styleUrls: ['./workflow-list.component.scss'],
})
export class WorkflowListComponent implements OnInit {
  workflows: WorkflowResponse[] = [];
  isLoading = true;
  searchTerm = '';

  constructor(private workflowService: WorkflowService) {}

  ngOnInit() {
    this.loadWorkflows();
  }

  loadWorkflows() {
    this.workflowService.getPublicWorkflows(this.searchTerm).subscribe({
      next: (res) => {
        this.workflows = res.workflows;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onSearch() {
    this.loadWorkflows();
  }
}
