import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BibleBook, BibleChapter } from '@models/bible';
import { BookDropdownComponent } from '@components/bible/book-dropdown/book-dropdown.component';
import { ChapterDropdownComponent } from '@components/bible/chapter-dropdown/chapter-dropdown.component';
import { VerseDropdownComponent } from '@components/bible/verse-dropdown/verse-dropdown.component';
import { ModeSelectorComponent } from '@components/bible/mode-selector/mode-selector.component';

@Component({
  selector: 'app-workspace-header',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    BookDropdownComponent,
    ChapterDropdownComponent,
    VerseDropdownComponent,
    ModeSelectorComponent
  ],
  templateUrl: './workspace-header.component.html',
  styleUrls: ['./workspace-header.component.scss']
})
export class WorkspaceHeaderComponent implements OnInit {
  // Inputs from parent FlowComponent
  @Input() currentBook: BibleBook | null = null;
  @Input() currentChapter = 1;
  @Input() totalChapters = 50;
  @Input() memorizedVersesCount = 0;
  @Input() totalVerses = 0;
  @Input() progressPercentage = 0;
  @Input() selectedVersesCount = 0;
  @Input() showFullText = false;
  @Input() availableChapters: BibleChapter[] = [];
  @Input() allBooks: BibleBook[] = [];

  // Outputs to parent FlowComponent
  @Output() toggleTextMode = new EventEmitter<void>();
  @Output() startFullChapter = new EventEmitter<void>();
  @Output() startStudySession = new EventEmitter<void>();
  @Output() changeChapter = new EventEmitter<number>();
  @Output() changeBook = new EventEmitter<number>();
  @Output() modeChange = new EventEmitter<'chapter' | 'crossReferences' | 'topical'>();

  // Component state
  activeChapterFilter: 'all' | 'inProgress' | 'completed' = 'all';
  chapterViewMode: 'grid' | 'row' | 'list' = 'grid';
  
  // Mode - includes chapter, cross-references, and topical
  @Input() mode: 'chapter' | 'crossReferences' | 'topical' = 'chapter';
  
  // Cross-reference specific inputs
  @Input() selectedVerseNumber = 1;
  @Input() availableVerseNumbers: number[] = [];
  @Input() memorizedVerses: number[] = [];
  @Input() hasApocrypha = false;
  
  // Cross-reference specific outputs
  @Output() verseNumberChange = new EventEmitter<number>();
  
  constructor() {}
  
  // Getters for ngModel binding
  get currentBookId(): number {
    return this.currentBook?.id || 1;
  }
  
  set currentBookId(value: number) {
    // This setter is needed for two-way binding but actual change is handled by onBookSelect
  }

  ngOnInit() {
    // Initialize component
    console.log('WorkspaceHeaderComponent initialized');
    console.log('Available chapters:', this.availableChapters.length);
  }




  


  // Progress ring calculations for expanded view (larger ring)
  get progressCircumference(): number {
    return 2 * Math.PI * 64; // Updated for 140px ring (radius 64)
  }

  get progressOffset(): number {
    return this.progressCircumference - (this.progressPercentage / 100) * this.progressCircumference;
  }

  // Mini progress ring calculations for collapsed view
  get miniProgressCircumference(): number {
    return 2 * Math.PI * 22;
  }

  get miniProgressOffset(): number {
    return this.miniProgressCircumference - (this.progressPercentage / 100) * this.miniProgressCircumference;
  }

  // Chapter progress for collapsed view
  get chapterProgressPercentage(): number {
    if (!this.currentBibleChapter) return 0;
    const total = this.currentBibleChapter.totalVerses;
    const memorized = this.currentBibleChapter.memorizedVerses;
    return total > 0 ? Math.round((memorized / total) * 100) : 0;
  }

  get currentBibleChapter(): BibleChapter | null {
    if (!this.availableChapters || this.availableChapters.length === 0) return null;
    return this.availableChapters.find(ch => ch.chapterNumber === this.currentChapter) || null;
  }

  // Book statistics
  get totalBookVerses(): number {
    if (!this.currentBook) return 0;
    return this.currentBook.totalVerses;
  }

  get memorizedBookVerses(): number {
    if (!this.currentBook) return 0;
    return this.currentBook.memorizedVerses;
  }

  get chaptersWithProgress(): number {
    if (!this.availableChapters) return 0;
    return this.availableChapters.filter(ch => ch.memorizedVerses > 0).length;
  }

  // Get filtered chapters for display
  get filteredChapters(): BibleChapter[] {
    if (!this.availableChapters || this.availableChapters.length === 0) {
      return [];
    }

    switch (this.activeChapterFilter) {
      case 'completed':
        return this.availableChapters.filter(ch => 
          ch.totalVerses > 0 && ch.memorizedVerses === ch.totalVerses
        );
      case 'inProgress':
        return this.availableChapters.filter(ch => 
          ch.memorizedVerses > 0 && ch.memorizedVerses < ch.totalVerses
        );
      default:
        return this.availableChapters;
    }
  }

  // Get all chapters
  get visibleChapters(): BibleChapter[] {
    return this.filteredChapters;
  }


  // Calculate pie chart values for chapter cards
  getChapterPieCircumference(): number {
    return 2 * Math.PI * 16; // For 36x36 SVG with r=16
  }

  getChapterPieOffset(percentage: number): number {
    const circumference = this.getChapterPieCircumference();
    return circumference - (percentage / 100) * circumference;
  }

  // Get chapter progress percentage
  getChapterProgress(chapter: BibleChapter): number {
    if (!chapter || chapter.totalVerses === 0) return 0;
    return Math.round((chapter.memorizedVerses / chapter.totalVerses) * 100);
  }


  // Check if chapter is current
  isCurrentChapter(chapter: BibleChapter): boolean {
    return chapter.chapterNumber === this.currentChapter;
  }

  // Check if chapter is completed
  isChapterCompleted(chapter: BibleChapter): boolean {
    return chapter.totalVerses > 0 && chapter.memorizedVerses === chapter.totalVerses;
  }

  setChapterFilter(filter: 'all' | 'inProgress' | 'completed'): void {
    this.activeChapterFilter = filter;
  }


  toggleChapterView(): void {
    const modes: ('grid' | 'row' | 'list')[] = ['grid', 'row', 'list'];
    const currentIndex = modes.indexOf(this.chapterViewMode);
    this.chapterViewMode = modes[(currentIndex + 1) % 3];
  }


  onChapterClick(chapterNumber: number | string): void {
    const num = typeof chapterNumber === 'string' ? parseInt(chapterNumber, 10) : chapterNumber;
    if (num !== this.currentChapter) {
      this.changeChapter.emit(num);
    }
  }
  
  
  onVerseClick(verseNumber: number | string): void {
    const num = typeof verseNumber === 'string' ? parseInt(verseNumber, 10) : verseNumber;
    if (num !== this.selectedVerseNumber) {
      this.verseNumberChange.emit(num);
    }
  }

  onBookSelect(bookId: number | string): void {
    const id = typeof bookId === 'string' ? parseInt(bookId, 10) : bookId;
    console.log('Book selected:', id);
    this.changeBook.emit(id);
  }

  onModeChange(newMode: 'chapter' | 'crossReferences' | 'topical'): void {
    this.modeChange.emit(newMode);
  }

  onStartButtonClick(): void {
    if (this.selectedVersesCount > 0) {
      this.startStudySession.emit();
    } else {
      this.startFullChapter.emit();
    }
  }

  jumpToFurthestIncomplete(): void {
    const firstIncomplete = this.availableChapters.find(chapter => 
      !this.isChapterCompleted(chapter)
    );
    
    if (firstIncomplete) {
      this.onChapterClick(firstIncomplete.chapterNumber);
    } else {
      const lastChapter = this.availableChapters[this.availableChapters.length - 1];
      if (lastChapter) {
        this.onChapterClick(lastChapter.chapterNumber);
      }
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