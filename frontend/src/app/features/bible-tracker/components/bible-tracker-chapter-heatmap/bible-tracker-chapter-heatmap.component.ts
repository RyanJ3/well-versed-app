import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleBook, BibleChapter } from '../../../../models/bible';

@Component({
  selector: 'app-bible-tracker-chapter-heatmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bible-tracker-chapter-heatmap.component.html',
  styleUrls: ['./bible-tracker-chapter-heatmap.component.scss']
})
export class BibleTrackerChapterHeatmapComponent implements OnInit {
  @Input() selectedBook: BibleBook | null = null;
  @Input() selectedChapter: BibleChapter | null = null;
  @Input() includeApocrypha: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() isSavingBulk: boolean = false;
  @Output() chapterSelected = new EventEmitter<BibleChapter>();
  @Output() selectAllChapters = new EventEmitter<void>();
  @Output() clearAllChapters = new EventEmitter<void>();
  
  // View mode state
  viewMode: 'grid' | 'list' = 'grid';
  private readonly VIEW_MODE_KEY = 'tracker-chapter-view-mode';
  
  // Filter state
  activeFilter: 'all' | 'inProgress' | 'completed' = 'all';
  
  // Progress circle properties
  progressCircumference = `${2 * Math.PI * 36} ${2 * Math.PI * 36}`;
  
  get progressOffset(): number {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const progress = this.bookProgressPercentage / 100;
    return circumference * (1 - progress);
  }
  
  ngOnInit() {
    // Load saved view mode
    const savedMode = localStorage.getItem(this.VIEW_MODE_KEY);
    if (savedMode === 'list' || savedMode === 'grid') {
      this.viewMode = savedMode;
    }
  }
  
  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    localStorage.setItem(this.VIEW_MODE_KEY, this.viewMode);
  }
  
  getViewModeIcon(): string {
    return this.viewMode === 'grid' ? '☰' : '⊞';
  }
  
  get bookProgressPercentage(): number {
    if (!this.selectedBook) return 0;
    const memorized = this.memorizedBookVerses;
    const total = this.totalBookVerses;
    return total > 0 ? Math.round((memorized / total) * 100) : 0;
  }
  
  get memorizedBookVerses(): number {
    if (!this.selectedBook) return 0;
    return this.selectedBook.chapters.reduce((sum, ch) => {
      if (!this.isChapterVisible(ch)) return sum;
      return sum + (ch.memorizedVerses || 0);
    }, 0);
  }
  
  get totalBookVerses(): number {
    if (!this.selectedBook) return 0;
    return this.selectedBook.chapters.reduce((sum, ch) => {
      if (!this.isChapterVisible(ch)) return sum;
      return sum + (ch.totalVerses || 0);
    }, 0);
  }
  
  isChapterVisible(chapter: BibleChapter): boolean {
    return this.includeApocrypha || !chapter.isApocryphal;
  }
  
  getChapterProgress(chapter: BibleChapter): number {
    return chapter.percentComplete || 0;
  }
  
  get filteredChapters(): BibleChapter[] {
    if (!this.selectedBook) return [];
    
    return this.selectedBook.chapters.filter(ch => {
      if (!this.isChapterVisible(ch)) return false;
      
      if (this.activeFilter === 'completed') {
        return ch.percentComplete === 100;
      } else if (this.activeFilter === 'inProgress') {
        return ch.percentComplete > 0 && ch.percentComplete < 100;
      }
      return true; // 'all'
    });
  }
  
  setFilter(filter: 'all' | 'inProgress' | 'completed') {
    this.activeFilter = filter;
  }
  
  selectChapter(chapter: BibleChapter): void {
    this.chapterSelected.emit(chapter);
  }
}
