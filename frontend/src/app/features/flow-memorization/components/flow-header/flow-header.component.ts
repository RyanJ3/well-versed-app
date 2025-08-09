import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleBook, BibleChapter } from '@models/bible';

@Component({
  selector: 'app-flow-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flow-header.component.html',
  styleUrls: ['./flow-header.component.scss']
})
export class FlowHeaderComponent implements OnInit {
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

  // Component state
  activeChapterFilter: 'all' | 'inProgress' | 'completed' = 'all';
  testamentFilter: 'ALL' | 'OT' | 'NT' | 'APO' = 'ALL';
  chapterViewMode: 'grid' | 'row' | 'list' = 'grid';
  showBookDropdown = false;
  
  // Collapse state
  isCollapsed = false;
  private readonly COLLAPSED_STATE_KEY = 'flow-header-collapsed';
  private readonly isBrowser = typeof window !== 'undefined';

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Load collapsed state from localStorage
    this.loadCollapsedState();
    
    // On mobile, default to collapsed unless user has explicitly expanded
    if (this.isBrowser && window.innerWidth <= 768) {
      const hasUserPreference = localStorage.getItem(this.COLLAPSED_STATE_KEY) !== null;
      if (!hasUserPreference) {
        this.isCollapsed = true;
      }
    }
    
    console.log('FlowHeaderComponent initialized');
    console.log('Collapsed state:', this.isCollapsed);
    console.log('Available chapters:', this.availableChapters.length);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showBookDropdown = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    // Auto-collapse on mobile if window is resized to mobile size
    if (this.isBrowser && window.innerWidth <= 768) {
      const hasUserPreference = localStorage.getItem(this.COLLAPSED_STATE_KEY) !== null;
      if (!hasUserPreference) {
        this.isCollapsed = true;
      }
    }
  }

  // Toggle collapse/expand
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.saveCollapsedState();
  }

  // Expand header and open book selector
  expandAndOpenBookSelector(): void {
    if (this.isCollapsed) {
      this.isCollapsed = false;
      this.saveCollapsedState();
      // Small delay to let animation complete before opening dropdown
      setTimeout(() => {
        this.showBookDropdown = true;
      }, 300);
    } else {
      this.showBookDropdown = !this.showBookDropdown;
    }
  }

  // Save collapsed state to localStorage
  private saveCollapsedState(): void {
    if (this.isBrowser) {
      localStorage.setItem(this.COLLAPSED_STATE_KEY, JSON.stringify(this.isCollapsed));
    }
  }

  // Load collapsed state from localStorage
  private loadCollapsedState(): void {
    if (this.isBrowser) {
      const savedState = localStorage.getItem(this.COLLAPSED_STATE_KEY);
      if (savedState !== null) {
        try {
          this.isCollapsed = JSON.parse(savedState);
        } catch (e) {
          console.error('Error parsing collapsed state:', e);
          this.isCollapsed = false;
        }
      }
    }
  }

  // Progress ring calculations for expanded view
  get progressCircumference(): number {
    return 2 * Math.PI * 45;
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

  // Filter books by testament
  get filteredBooks(): BibleBook[] {
    if (!this.allBooks || this.allBooks.length === 0) {
      return [];
    }
    
    if (this.testamentFilter === 'ALL') {
      return this.allBooks;
    }
    
    return this.allBooks.filter(book => {
      const testament = this.getBookTestament(book);
      return testament === this.testamentFilter;
    });
  }

  // Get books grouped by testament for dropdown
  get booksByTestament() {
    if (!this.allBooks || this.allBooks.length === 0) {
      console.warn('No books available for dropdown');
      return { OT: [], NT: [], APO: [] };
    }
    
    // Apply testament filter
    let filteredBooks = this.allBooks;
    if (this.testamentFilter !== 'ALL') {
      filteredBooks = this.filteredBooks;
    }
    
    const otBooks = filteredBooks.filter(b => this.getBookTestament(b) === 'OT');
    const ntBooks = filteredBooks.filter(b => this.getBookTestament(b) === 'NT');
    const apoBooks = filteredBooks.filter(b => this.getBookTestament(b) === 'APO');
    
    return {
      OT: otBooks,
      NT: ntBooks,
      APO: apoBooks
    };
  }

  // Helper to determine testament based on book ID
  private getBookTestament(book: BibleBook): 'OT' | 'NT' | 'APO' {
    // ID-based detection
    // Standard Protestant Bible: OT (1-39), NT (40-66)
    // Books after 66 are Apocrypha/Deuterocanonical
    if (book.id <= 39) {
      return 'OT';
    } else if (book.id <= 66) {
      return 'NT';
    } else {
      return 'APO';
    }
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

  // Get book progress percentage
  getBookProgress(book: BibleBook): number {
    if (!book || book.totalVerses === 0) return 0;
    return Math.round((book.memorizedVerses / book.totalVerses) * 100);
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

  setTestamentFilter(filter: 'ALL' | 'OT' | 'NT' | 'APO'): void {
    this.testamentFilter = filter;
  }

  toggleChapterView(): void {
    const modes: ('grid' | 'row' | 'list')[] = ['grid', 'row', 'list'];
    const currentIndex = modes.indexOf(this.chapterViewMode);
    this.chapterViewMode = modes[(currentIndex + 1) % 3];
  }

  toggleBookDropdown(): void {
    // If collapsed, expand first
    if (this.isCollapsed) {
      this.expandAndOpenBookSelector();
    } else {
      this.showBookDropdown = !this.showBookDropdown;
    }
  }

  onChapterClick(chapterNumber: number): void {
    if (chapterNumber !== this.currentChapter) {
      this.changeChapter.emit(chapterNumber);
    }
  }

  onBookSelect(bookId: number): void {
    console.log('Book selected:', bookId);
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