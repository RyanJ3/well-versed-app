import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleBook, BibleChapter } from '@models/bible';

@Component({
  selector: 'app-workspace-header',
  standalone: true,
  imports: [CommonModule],
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

  // Component state
  activeChapterFilter: 'all' | 'inProgress' | 'completed' = 'all';
  testamentFilter: 'ALL' | 'OT' | 'NT' | 'APO' = 'ALL';
  chapterViewMode: 'grid' | 'row' | 'list' = 'grid';
  showBookDropdown = false;
  showChapterDropdown = false;
  
  // Browser check
  private readonly isBrowser = typeof window !== 'undefined';
  
  // Mode - includes memorization, cross-references, and topical
  @Input() mode: 'memorization' | 'crossReferences' | 'topical' = 'memorization';
  
  // Cross-reference specific inputs
  @Input() selectedVerseNumber = 1;
  @Input() availableVerseNumbers: number[] = [];
  
  // Cross-reference specific outputs
  @Output() verseNumberChange = new EventEmitter<number>();
  
  // Verse dropdown state
  showVerseDropdown = false;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Initialize component
    console.log('WorkspaceHeaderComponent initialized');
    console.log('Available chapters:', this.availableChapters.length);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showBookDropdown = false;
      this.showChapterDropdown = false;
      this.showVerseDropdown = false;
    }
  }



  // Toggle chapter dropdown
  toggleChapterDropdown(event: MouseEvent): void {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    
    // Ensure we have the button element
    if (!target) {
      console.error('No target element found for chapter dropdown');
      return;
    }
    
    const rect = target.getBoundingClientRect();
    console.log('Chapter button clicked:', target, 'Rect:', rect);
    
    this.showChapterDropdown = !this.showChapterDropdown;
    this.showBookDropdown = false; // Close book dropdown if open
    
    if (this.showChapterDropdown) {
      // Use requestAnimationFrame instead of setTimeout for better timing
      requestAnimationFrame(() => {
        this.positionDropdownWithRect('chapter', rect);
      });
    }
  }
  
  private positionDropdown(type: 'book' | 'chapter', event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.positionDropdownWithRect(type, rect);
  }
  
  private positionDropdownWithRect(type: 'book' | 'chapter', rect: DOMRect): void {
    const dropdown = type === 'book' 
      ? document.querySelector('.book-dropdown-menu') as HTMLElement
      : document.querySelector('.chapter-dropdown-menu') as HTMLElement;
    
    if (!dropdown) {
      console.error(`${type} dropdown element not found`);
      return;
    }
    
    // Clear any existing inline styles first
    dropdown.style.cssText = '';
    
    // Force recalculation of dropdown dimensions
    dropdown.style.visibility = 'hidden';
    dropdown.style.display = 'block';
    
    // Get actual dropdown dimensions
    const dropdownRect = dropdown.getBoundingClientRect();
    const dropdownWidth = dropdownRect.width || 280; // Fallback to min-width
    
    // Calculate positions
    const viewportWidth = window.innerWidth;
    let leftPos = rect.left;
    let topPos = rect.bottom; // No gap - position directly below button
    
    // Adjust horizontal position if dropdown would go off-screen
    if (leftPos + dropdownWidth > viewportWidth - 10) {
      // Align to right edge of button if it would overflow
      leftPos = Math.max(10, rect.right - dropdownWidth);
    }
    
    // Ensure dropdown doesn't go off the left edge
    leftPos = Math.max(10, leftPos);
    
    // Apply final positioning
    dropdown.style.cssText = `
      position: fixed !important;
      top: ${topPos}px !important;
      left: ${leftPos}px !important;
      z-index: 99999 !important;
      visibility: visible !important;
      display: block !important;
    `;
    
    // Log for debugging
    console.log(`${type} dropdown positioned:`, {
      buttonRect: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height
      },
      dropdownPosition: {
        top: topPos,
        left: leftPos,
        width: dropdownWidth
      },
      dropdown: dropdown
    });
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

  toggleBookDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      const target = event.currentTarget as HTMLElement;
      
      // Ensure we have the button element
      if (!target) {
        console.error('No target element found for book dropdown');
        return;
      }
      
      const rect = target.getBoundingClientRect();
      console.log('Book button clicked:', target, 'Rect:', rect);
      
      this.showBookDropdown = !this.showBookDropdown;
      this.showChapterDropdown = false; // Close chapter dropdown if open
      
      if (this.showBookDropdown) {
        // Use requestAnimationFrame instead of setTimeout for better timing
        requestAnimationFrame(() => {
          this.positionDropdownWithRect('book', rect);
        });
      }
    } else {
      this.showBookDropdown = !this.showBookDropdown;
      this.showChapterDropdown = false;
    }
  }

  onChapterClick(chapterNumber: number): void {
    if (chapterNumber !== this.currentChapter) {
      this.changeChapter.emit(chapterNumber);
    }
  }
  
  toggleVerseDropdown(event: MouseEvent): void {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    
    if (!target) {
      console.error('No target element found for verse dropdown');
      return;
    }
    
    const rect = target.getBoundingClientRect();
    this.showVerseDropdown = !this.showVerseDropdown;
    this.showBookDropdown = false;
    this.showChapterDropdown = false;
    
    if (this.showVerseDropdown) {
      requestAnimationFrame(() => {
        this.positionVerseDropdown(rect);
      });
    }
  }
  
  private positionVerseDropdown(rect: DOMRect): void {
    const dropdown = document.querySelector('.verse-dropdown-menu') as HTMLElement;
    
    if (!dropdown) {
      console.error('Verse dropdown element not found');
      return;
    }
    
    // Clear any existing inline styles first
    dropdown.style.cssText = '';
    
    // Force recalculation of dropdown dimensions
    dropdown.style.visibility = 'hidden';
    dropdown.style.display = 'block';
    
    // Get actual dropdown dimensions
    const dropdownRect = dropdown.getBoundingClientRect();
    const dropdownWidth = dropdownRect.width || 120; // Fallback to min-width
    
    // Calculate positions
    const viewportWidth = window.innerWidth;
    let leftPos = rect.left;
    let topPos = rect.bottom; // No gap - position directly below button
    
    // Adjust horizontal position if dropdown would go off-screen
    if (leftPos + dropdownWidth > viewportWidth - 10) {
      leftPos = Math.max(10, rect.right - dropdownWidth);
    }
    
    // Ensure dropdown doesn't go off the left edge
    leftPos = Math.max(10, leftPos);
    
    // Apply final positioning
    dropdown.style.cssText = `
      position: fixed !important;
      top: ${topPos}px !important;
      left: ${leftPos}px !important;
      z-index: 99999 !important;
      visibility: visible !important;
      display: block !important;
    `;
  }
  
  onVerseClick(verseNumber: number): void {
    if (verseNumber !== this.selectedVerseNumber) {
      this.verseNumberChange.emit(verseNumber);
      this.showVerseDropdown = false;
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