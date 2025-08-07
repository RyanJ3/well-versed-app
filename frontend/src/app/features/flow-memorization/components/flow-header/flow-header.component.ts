import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChapterData {
  number: number;
  totalVerses: number;
  memorizedVerses: number;
  isCompleted: boolean;
  isCurrent: boolean;
  progressPercentage: number;
}

@Component({
  selector: 'app-flow-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flow-header.component.html',
  styleUrls: ['./flow-header.component.scss']
})
export class FlowHeaderComponent {
  // Inputs from parent FlowComponent
  @Input() currentBook: any = null;
  @Input() currentChapter = 1;
  @Input() totalChapters = 50;
  @Input() memorizedVersesCount = 0;
  @Input() totalVerses = 0;
  @Input() progressPercentage = 0;
  @Input() selectedVersesCount = 0;
  @Input() showFullText = false;
  @Input() chapterProgress: Record<number, any> = {};
  @Input() availableChapters: number[] = [];

  // Outputs to parent FlowComponent
  @Output() toggleTextMode = new EventEmitter<void>();
  @Output() startFullChapter = new EventEmitter<void>();
  @Output() startStudySession = new EventEmitter<void>();
  @Output() changeChapter = new EventEmitter<number>();

  // Filter state for chapters only
  activeChapterFilter: 'all' | 'inProgress' | 'completed' = 'all';
  
  // Progress ring calculations
  get progressCircumference(): number {
    return 2 * Math.PI * 36; // radius = 36
  }

  get progressOffset(): number {
    return this.progressCircumference - (this.progressPercentage / 100) * this.progressCircumference;
  }

  get completedChaptersCount(): number {
    return Object.values(this.chapterProgress).filter(ch => 
      ch.total > 0 && ch.memorized === ch.total
    ).length;
  }

  get chaptersWithProgress(): number {
    return Object.values(this.chapterProgress).filter(ch => 
      ch.memorized > 0
    ).length;
  }

  // Get filtered chapters for display
  get filteredChapters(): ChapterData[] {
    const chapters: ChapterData[] = this.availableChapters.map(num => {
      const progress = this.chapterProgress[num] || { memorized: 0, total: 0 };
      const percentage = progress.total > 0 
        ? Math.round((progress.memorized / progress.total) * 100)
        : 0;
      
      return {
        number: num,
        totalVerses: progress.total,
        memorizedVerses: progress.memorized,
        isCompleted: progress.total > 0 && progress.memorized === progress.total,
        isCurrent: num === this.currentChapter,
        progressPercentage: percentage
      };
    });

    switch (this.activeChapterFilter) {
      case 'completed':
        return chapters.filter(ch => ch.isCompleted);
      case 'inProgress':
        return chapters.filter(ch => ch.memorizedVerses > 0 && !ch.isCompleted);
      default:
        return chapters;
    }
  }

  // Get visible chapters (show 10 at a time)
  get visibleChapters(): ChapterData[] {
    return this.filteredChapters.slice(0, 10);
  }

  setChapterFilter(filter: 'all' | 'inProgress' | 'completed'): void {
    this.activeChapterFilter = filter;
  }

  onChapterClick(chapterNumber: number): void {
    if (chapterNumber !== this.currentChapter) {
      this.changeChapter.emit(chapterNumber);
    }
  }

  onStartButtonClick(): void {
    if (this.selectedVersesCount > 0) {
      this.startStudySession.emit();
    } else {
      this.startFullChapter.emit();
    }
  }
}
