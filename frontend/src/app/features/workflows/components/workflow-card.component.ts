import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WorkflowResponse } from '../../../core/services/workflow.service';

@Component({
  selector: 'app-workflow-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workflow-card.component.html',
  styleUrls: ['./workflow-card.component.scss'],
})
export class WorkflowCardComponent {
  @Input() workflow!: WorkflowResponse;
}
