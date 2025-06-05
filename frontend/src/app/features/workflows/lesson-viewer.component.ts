import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkflowService, LessonResponse } from '../../core/services/workflow.service';

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lesson-viewer.component.html',
  styleUrls: ['./lesson-viewer.component.scss'],
})
export class LessonViewerComponent implements OnInit {
  workflowId!: number;
  lessonId!: number;
  lesson: LessonResponse | null = null;
  activeTab: 'video' | 'article' | 'link' | 'audio' = 'video';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.workflowId = +params['workflowId'];
      this.lessonId = +params['lessonId'];
      this.loadLesson();
    });
  }

  loadLesson() {
    this.workflowService.getLessons(this.workflowId).subscribe(res => {
      const found = res.lessons.find(l => l.lesson_id === this.lessonId);
      if (found) {
        this.lesson = found;
        this.setInitialTab();
      }
    });
  }

  setInitialTab() {
    if (!this.lesson) return;
    if (this.lesson.video_url) {
      this.activeTab = 'video';
    } else if (this.lesson.article_text) {
      this.activeTab = 'article';
    } else if (this.lesson.article_url) {
      this.activeTab = 'link';
    } else if (this.lesson.audio_url) {
      this.activeTab = 'audio';
    }
  }

  selectTab(tab: 'video' | 'article' | 'link' | 'audio') {
    this.activeTab = tab;
  }

  back() {
    this.router.navigate(['/workflows', this.workflowId]);
  }
}
