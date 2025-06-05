import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkflowService, WorkflowResponse, LessonResponse } from '../../core/services/workflow.service';

@Component({
  selector: 'app-workflow-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workflow-viewer.component.html',
  styleUrls: ['./workflow-viewer.component.scss'],
})
export class WorkflowViewerComponent implements OnInit {
  workflowId!: number;
  workflow: WorkflowResponse | null = null;
  lessons: LessonResponse[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.workflowId = +params['workflowId'];
      this.loadData();
    });
  }

  loadData() {
    this.isLoading = true;
    this.workflowService.getWorkflow(this.workflowId).subscribe({
      next: wf => {
        this.workflow = wf;
      },
    });
    this.workflowService.getLessons(this.workflowId).subscribe({
      next: res => {
        this.lessons = res.lessons;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  openLesson(lesson: LessonResponse) {
    this.router.navigate(['/workflows', this.workflowId, 'lesson', lesson.lesson_id]);
  }
}
