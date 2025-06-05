// frontend/src/app/features/workflows/workflow-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  WorkflowService,
  WorkflowResponse,
} from '../../core/services/workflow.service';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workflow-list.component.html',
  styleUrls: ['./workflow-list.component.scss'],
})
export class WorkflowListComponent implements OnInit {
  workflows: WorkflowResponse[] = [];
  isLoading = true;

  constructor(private workflowService: WorkflowService) {}

  ngOnInit() {
    this.loadWorkflows();
  }

  loadWorkflows() {
    this.workflowService.getPublicWorkflows().subscribe({
      next: (res) => {
        this.workflows = res.workflows;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }
}
