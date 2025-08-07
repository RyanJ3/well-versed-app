import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChapterData {
  number: number;
  totalVerses: number;
  memorizedVerses: number;
  isCompleted: boolean;
  isCurrent: boolean;
  progressPercentage: number;
  lastStudied?: string;
}

interface BookWithProgress {
  id: number;
  name: string;
  testament: 'OT' | 'NT' | 'APO';
  totalChapters: number;
  progressPercentage: number;
}

interface RecentlyStudied {
  bookName: string;
  chapter: number;
  timeAgo: string;
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
  @Input() allBooks: BookWithProgress[] = [];

  // Outputs to parent FlowComponent
  @Output() toggleTextMode = new EventEmitter<void>();
  @Output() startFullChapter = new EventEmitter<void>();
  @Output() startStudySession = new EventEmitter<void>();
  @Output() changeChapter = new EventEmitter<number>();
  @Output() changeBook = new EventEmitter<number>();

  // Component state
  activeChapterFilter: 'all' | 'inProgress' | 'completed' = 'all';
  testamentFilter: 'ALL' | 'OT' | 'NT' | 'APO' = 'ALL';
  chapterViewMode: 'grid' | 'row' | 'list' = 'grid';
  showBookDropdown = false;

  // Mock recently studied data - in real app, this would come from parent
  recentlyStudied: RecentlyStudied[] = [
    { bookName: 'Genesis', chapter: 3, timeAgo: '2 hours ago' },
    { bookName: 'Mark', chapter: 5, timeAgo: 'Yesterday' },
    { bookName: 'Psalms', chapter: 23, timeAgo: '3 days ago' }
  ];

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showBookDropdown = false;
    }
  }

  // LARGER Progress ring calculations for more prominent display
  get progressCircumference(): number {
    return 2 * Math.PI * 54; // INCREASED radius from 36 to 54
  }

  get progressOffset(): number {
    return this.progressCircumference - (this.progressPercentage / 100) * this.progressCircumference;
  }

  // Book statistics
  get totalBookVerses(): number {
    if (!this.currentBook) return 0;
    // Sum all verses from all chapters in the book
    let total = 0;
    for (let i = 1; i <= this.currentBook.totalChapters; i++) {
      const progress = this.chapterProgress[i];
      if (progress) {
        total += progress.total;
      }
    }
    return total;
  }

  get memorizedBookVerses(): number {
    return Object.values(this.chapterProgress).reduce((sum, ch: any) =>
      sum + (ch.memorized || 0), 0
    );
  }

  get chaptersWithProgress(): number {
    return Object.values(this.chapterProgress).filter((ch: any) =>
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

      // Mock last studied data for completed chapters
      let lastStudied: string | undefined;
      if (percentage === 100) {
        const daysAgo = Math.floor(Math.random() * 30);
        if (daysAgo === 0) lastStudied = 'Today';
        else if (daysAgo === 1) lastStudied = 'Yesterday';
        else lastStudied = `${daysAgo} days ago`;
      }

      return {
        number: num,
        totalVerses: progress.total,
        memorizedVerses: progress.memorized,
        isCompleted: progress.total > 0 && progress.memorized === progress.total,
        isCurrent: num === this.currentChapter,
        progressPercentage: percentage,
        lastStudied
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

  // Get all chapters - no slicing!
  get visibleChapters(): ChapterData[] {
    return this.filteredChapters;
  }

  // Filter books by testament
  get filteredBooks(): BookWithProgress[] {
    if (!this.allBooks || this.allBooks.length === 0) {
      return [];
    }
    if (this.testamentFilter === 'ALL') return this.allBooks;
    return this.allBooks.filter(book =>
      book.testament === this.testamentFilter
    );
  }

  // Get books grouped by testament for dropdown
  get booksByTestament() {
    if (!this.allBooks || this.allBooks.length === 0) {
      return { OT: [], NT: [], APO: [] };
    }
    const otBooks = this.allBooks.filter(b => b.testament === 'OT');
    const ntBooks = this.allBooks.filter(b => b.testament === 'NT');
    const apoBooks = this.allBooks.filter(b => b.testament === 'APO');

    return {
      OT: otBooks,
      NT: ntBooks,
      APO: apoBooks
    };
  }

  // Calculate pie chart values for chapter cards
  getChapterPieCircumference(): number {
    return 2 * Math.PI * 18; // radius for small pie charts
  }

  getChapterPieOffset(percentage: number): number {
    const circumference = this.getChapterPieCircumference();
    return circumference - (percentage / 100) * circumference;
  }

  setChapterFilter(filter: 'all' | 'inProgress' | 'completed'): void {
    this.activeChapterFilter = filter;
  }

  setTestamentFilter(filter: 'ALL' | 'OT' | 'NT' | 'APO'): void {
    this.testamentFilter = filter;
  }

  toggleChapterView(): void {
    const modes: ('grid' | 'row' | 'list')[] = ['grid', 'row', 'list'];
    const currentIndex = modes.indexOf(this.chapterViewMode);
    this.chapterViewMode = modes[(currentIndex + 1) % 3];
  }

  toggleBookDropdown(): void {
    this.showBookDropdown = !this.showBookDropdown;
  }

  // FIX: Properly emit chapter change event
  onChapterClick(chapterNumber: number): void {
    if (chapterNumber !== this.currentChapter) {
      this.changeChapter.emit(chapterNumber);
    }
  }

  onBookSelect(bookId: number): void {
    this.changeBook.emit(bookId);
    this.showBookDropdown = false;
  }

  onStartButtonClick(): void {
    if (this.selectedVersesCount > 0) {
      this.startStudySession.emit();
    } else {
      this.startFullChapter.emit();
    }
  }

  getViewModeIcon(): string {
    switch (this.chapterViewMode) {
      case 'grid': return '⊞';
      case 'row': return '☰';
      case 'list': return '⋮⋮';
      default: return '⊞';
    }
  }
}

