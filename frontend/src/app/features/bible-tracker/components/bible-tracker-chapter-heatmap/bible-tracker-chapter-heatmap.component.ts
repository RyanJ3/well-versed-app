import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleBook, BibleChapter } from '../../../../models/bible';

@Component({
  selector: 'app-bible-tracker-chapter-heatmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bible-tracker-chapter-heatmap.component.html',
  styleUrls: ['./bible-tracker-chapter-heatmap.component.scss']
})
export class BibleTrackerChapterHeatmapComponent {
  @Input() selectedBook: BibleBook | null = null;
  @Input() includeApocrypha: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() isSavingBulk: boolean = false;
  @Output() chapterSelected = new EventEmitter<BibleChapter>();
  @Output() selectAllChapters = new EventEmitter<void>();
  @Output() clearAllChapters = new EventEmitter<void>();
  
  isChapterVisible(chapter: BibleChapter): boolean {
    return this.includeApocrypha || !chapter.isApocryphal;
  }
  
  getHeatmapClass(chapter: BibleChapter): string {
    const percent = chapter.percentComplete;
    if (percent === 0) return 'heatmap-cell heat-0';
    if (percent <= 20) return 'heatmap-cell heat-1';
    if (percent <= 40) return 'heatmap-cell heat-2';
    if (percent <= 60) return 'heatmap-cell heat-3';
    if (percent <= 80) return 'heatmap-cell heat-4';
    if (percent < 100) return 'heatmap-cell heat-5';
    return 'heatmap-cell heat-complete';
  }
  
  selectChapter(chapter: BibleChapter): void {
    this.chapterSelected.emit(chapter);
  }
}
