import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChapterProgress {
  memorized: number;
  total: number;
  lastStudied: string | null;
}

@Component({
  selector: 'app-chapter-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chapter-navigation.component.html',
  styleUrls: ['./chapter-navigation.component.scss']
})
export class ChapterNavigationComponent {
  @Input() currentChapter = 1;
  @Input() visibleChapters: number[] = [];
  @Input() chapterProgress: Record<number, ChapterProgress> = {};
  @Input() hasNext = false;

  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() change = new EventEmitter<number>();

  hasPrevious(): boolean {
    return this.currentChapter > 1;
    }

  getChapterProgress(chapter: number): number {
    const progress = this.chapterProgress[chapter];
    return progress && progress.total > 0
      ? Math.round((progress.memorized / progress.total) * 100)
      : 0;
  }
}
