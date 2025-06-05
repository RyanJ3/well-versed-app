// frontend/src/app/features/workflows/workflow-builder.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkflowCreate, WorkflowService } from '../../core/services/workflow.service';

@Component({
  selector: 'app-workflow-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./workflow-builder.component.scss'],
})
export class WorkflowBuilderComponent {
  workflow: WorkflowCreate = { name: '', description: '', is_public: false };
  isSaving = false;

  constructor(private workflowService: WorkflowService, private router: Router) {}

  createWorkflow() {
    this.isSaving = true;
    this.workflowService.createWorkflow(this.workflow).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/workflows']);
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }
}
