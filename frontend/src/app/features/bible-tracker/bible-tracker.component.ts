import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import NgRx elements
import { BibleMemorizationActions } from '../../state/bible-tracker/actions/bible-memorization.actions';
import {
  selectBibleDataWithProgress,
  selectTestaments,
  selectMemorizedVersesCount,
  selectOverallPercentComplete,
  selectProgressSegments,
  selectProgressViewMode,
  selectIsLoading,
  selectIsSavingBulk,
  selectUserId
} from '../../state/bible-tracker/selectors/bible-memorization.selectors';

// Import models
import { BibleBook, BibleChapter, BibleTestament, BibleGroup, BibleData } from '../../core/models/bible';
import { BibleVerse } from '../../core/models/bible/bible-verse.model';
import { ProgressSegment } from '../../state/bible-tracker/models/bible-memorization.model';

// Import services (only for modal, no more data services!)
import { ModalService } from '../../core/services/modal.service';

// Import sub-components
import { BibleTrackerHeaderComponent } from './components/bible-tracker-header/bible-tracker-header.component';
import { BibleTrackerStatsComponent } from './components/bible-tracker-stats/bible-tracker-stats.component';
import { BibleTrackerTestamentCardComponent } from './components/bible-tracker-testament-card/bible-tracker-testament-card.component';
import { BibleTrackerBookGroupsComponent } from './components/bible-tracker-book-groups/bible-tracker-book-groups.component';
import { BibleTrackerBookGridComponent } from './components/bible-tracker-book-grid/bible-tracker-book-grid.component';
import { BibleTrackerChapterHeatmapComponent } from './components/bible-tracker-chapter-heatmap/bible-tracker-chapter-heatmap.component';
import { BibleTrackerVerseGridComponent } from './components/bible-tracker-verse-grid/bible-tracker-verse-grid.component';

@Component({
  selector: 'app-bible-tracker',
  templateUrl: './bible-tracker.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BibleTrackerHeaderComponent,
    BibleTrackerStatsComponent,
    BibleTrackerTestamentCardComponent,
    BibleTrackerBookGroupsComponent,
    BibleTrackerBookGridComponent,
    BibleTrackerChapterHeatmapComponent,
    BibleTrackerVerseGridComponent
  ],
  styleUrls: ['./bible-tracker.component.scss'],
})
export class BibleTrackerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observables from store
  bibleData$!: Observable<BibleData>;
  testaments$!: Observable<BibleTestament[]>;
  memorizedVerses$!: Observable<number>;
  percentComplete$!: Observable<number>;
  progressSegments$!: Observable<ProgressSegment[]>;
  progressViewMode$!: Observable<'testament' | 'groups'>;
  isLoading$!: Observable<boolean>;
  isSavingBulk$!: Observable<boolean>;
  
  // Local UI state for navigation (not persisted)
  selectedTestament: BibleTestament | null = null;
  selectedGroup: BibleGroup | null = null;
  selectedBook: BibleBook | null = null;
  selectedChapter: BibleChapter | null = null;
  
  // Group colors configuration
  groupColors: { [key: string]: string } = {
    'Law': '#10b981',
    'History': '#3b82f6',
    'Wisdom': '#8b5cf6',
    'Major Prophets': '#f59e0b',
    'Minor Prophets': '#ef4444',
    'Gospels': '#10b981',
    'Acts': '#3b82f6',
    'Pauline Epistles': '#8b5cf6',
    'General Epistles': '#f59e0b',
    'Revelation': '#ef4444'
  };
  
  // Success popup state (purely UI)
  showSuccessMessage = false;
  successMessage = '';
  
  // Store current user ID for operations
  private userId: number = 1;
  
  // Cache for current bible data and apocrypha setting
  private currentBibleData: any = null;
  includeApocrypha = false;

  constructor(
    private store: Store,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.bibleData$ = this.store.select(selectBibleDataWithProgress);
    this.testaments$ = this.store.select(selectTestaments);
    this.memorizedVerses$ = this.store.select(selectMemorizedVersesCount);
    this.percentComplete$ = this.store.select(selectOverallPercentComplete);
    this.progressSegments$ = this.store.select(selectProgressSegments);
    this.progressViewMode$ = this.store.select(selectProgressViewMode);
    this.isLoading$ = this.store.select(selectIsLoading);
    this.isSavingBulk$ = this.store.select(selectIsSavingBulk);
  }

  ngOnInit() {
    // Initialize the feature
    this.store.dispatch(BibleMemorizationActions.initialize());
    
    // Subscribe to bible data to set initial selections
    this.bibleData$.pipe(takeUntil(this.destroy$)).subscribe(bibleData => {
      this.currentBibleData = bibleData;
      this.includeApocrypha = bibleData.includeApocrypha;

      this.updateSelections(bibleData);
    });
    
    // Get current user ID
    this.store.select(selectUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(userId => this.userId = userId);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation methods
  setTestament(testament: BibleTestament): void {
    this.selectedTestament = testament;
    if (testament.groups.length > 0) {
      this.setGroup(testament.groups[0]);
    }
    
    // Also update in store for persistence
    if (testament.books.length > 0) {
      this.store.dispatch(BibleMemorizationActions.selectBook({ 
        bookId: testament.books[0].id 
      }));
    }
  }

  setGroup(group: BibleGroup): void {
    this.selectedGroup = group;
    if (group.books.length > 0) {
      this.setBook(group.books[0]);
    }
  }

  setBook(book: BibleBook): void {
    this.selectedBook = book;
    const visibleChapters = this.getVisibleChapters(book);
    if (visibleChapters.length > 0) {
      this.setChapter(visibleChapters[0]);
    }
    
    // Update store
    this.store.dispatch(BibleMemorizationActions.selectBook({ bookId: book.id }));
  }

  setChapter(chapter: BibleChapter): void {
    this.selectedChapter = chapter;
    
    // Update store
    this.store.dispatch(BibleMemorizationActions.selectChapter({ 
      chapterNumber: chapter.chapterNumber 
    }));
  }

  // Verse operations
  toggleAndSaveVerse(verse: BibleVerse): void {
    if (!this.selectedBook || !this.selectedChapter) {
      console.error('No book or chapter selected');
      return;
    }
    
    // Dispatch action to toggle verse
    this.store.dispatch(BibleMemorizationActions.toggleVerseMemorization({
      userId: this.userId,
      bookId: this.selectedBook.id,
      chapterNumber: this.selectedChapter.chapterNumber,
      verseNumber: verse.verseNumber
    }));
  }

  // Bulk operations
  selectAllVerses(): void {
    if (!this.selectedChapter || !this.selectedBook) return;
    
    this.store.dispatch(BibleMemorizationActions.memorizeAllChapterVerses({
      userId: this.userId,
      bookId: this.selectedBook.id,
      chapterNumber: this.selectedChapter.chapterNumber,
      operation: 'memorize'
    }));
  }

  async clearAllVerses(): Promise<void> {
    if (!this.selectedChapter || !this.selectedBook) return;
    
    const confirmed = await this.modalService.danger(
      'Clear All Verses?',
      `Are you sure you want to clear all memorized verses in ${this.selectedBook.name} ${this.selectedChapter.chapterNumber}? This action cannot be undone.`,
      'Clear Verses'
    );
    
    if (!confirmed) return;
    
    this.store.dispatch(BibleMemorizationActions.clearAllChapterVerses({
      userId: this.userId,
      bookId: this.selectedBook.id,
      chapterNumber: this.selectedChapter.chapterNumber,
      operation: 'clear'
    }));
  }

  async selectAllChapters(): Promise<void> {
    if (!this.selectedBook) return;
    
    const confirmed = await this.modalService.danger(
      'Memorize All Chapters?',
      `Are you sure you want to mark all chapters in ${this.selectedBook.name} as memorized?`,
      'Memorize All'
    );
    
    if (!confirmed) return;
    
    this.store.dispatch(BibleMemorizationActions.memorizeAllBookVerses({
      userId: this.userId,
      bookId: this.selectedBook.id,
      operation: 'memorize'
    }));
  }

  async clearAllChapters(): Promise<void> {
    if (!this.selectedBook) return;
    
    const confirmed = await this.modalService.danger(
      'Clear All Chapters?',
      `Are you sure you want to clear all memorized verses in ${this.selectedBook.name}? This action cannot be undone.`,
      'Clear Chapters'
    );
    
    if (!confirmed) return;
    
    this.store.dispatch(BibleMemorizationActions.clearAllBookVerses({
      userId: this.userId,
      bookId: this.selectedBook.id,
      operation: 'clear'
    }));
  }

  // UI methods
  toggleProgressView(): void {
    this.store.dispatch(BibleMemorizationActions.toggleProgressViewMode());
  }

  // Helper methods
  isChapterVisible(chapter: BibleChapter): boolean {
    return this.includeApocrypha || !chapter.isApocryphal;
  }

  getVisibleChapters(book: BibleBook): BibleChapter[] {
    return book.chapters.filter(chapter => this.isChapterVisible(chapter));
  }

  private updateSelections(bibleData: BibleData): void {
    if (!this.selectedTestament && bibleData.testaments.length > 0) {
      this.setTestament(bibleData.testaments[0]);
      return;
    }

    if (this.selectedTestament) {
      const testament = bibleData.testaments.find(t => t.name === this.selectedTestament!.name);
      if (testament) {
        this.selectedTestament = testament;

        if (this.selectedGroup) {
          const group = testament.groups.find(g => g.name === this.selectedGroup!.name);
          if (group) {
            this.selectedGroup = group;

            if (this.selectedBook) {
              const book = group.books.find(b => b.id === this.selectedBook!.id);
              if (book) {
                this.selectedBook = book;

                if (this.selectedChapter) {
                  const chapter = book.chapters.find(c => c.chapterNumber === this.selectedChapter!.chapterNumber);
                  if (chapter) {
                    this.selectedChapter = chapter;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Local success popup (kept local as it's pure UI)
  private showSuccessPopup(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}
