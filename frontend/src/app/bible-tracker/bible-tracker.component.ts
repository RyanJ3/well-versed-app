import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppState } from '@app/state';
import { BibleTrackerActions } from '@app/state/bible-tracker';
import {
  selectStatisticsOverview,
  selectIsAnyLoading,
  selectSelectedBookDetails,
  selectSelectedChapter,
} from '@app/state/bible-tracker/selectors/bible-tracker.selectors';

import { BibleService } from '@app/core/services/bible.service';
import { BibleTestament, BibleBook, BibleChapter } from '@app/core/models/bible';
import { BibleGroup } from '@app/core/models/bible/bible-group.modle';

import { BibleTrackerHeaderComponent } from './components/bible-tracker-header/bible-tracker-header.component';
import { BibleTrackerStatsComponent } from './components/bible-tracker-stats/bible-tracker-stats.component';
import { BibleTrackerTestamentCardComponent } from './components/bible-tracker-testament-card/bible-tracker-testament-card.component';
import { BibleTrackerBookGroupsComponent } from './components/bible-tracker-book-groups/bible-tracker-book-groups.component';
import { BibleTrackerBookGridComponent } from './components/bible-tracker-book-grid/bible-tracker-book-grid.component';
import { BibleTrackerChapterHeatmapComponent } from './components/bible-tracker-chapter-heatmap/bible-tracker-chapter-heatmap.component';
import { BibleTrackerVerseGridComponent } from './components/bible-tracker-verse-grid/bible-tracker-verse-grid.component';

@Component({
  selector: 'app-bible-tracker',
  standalone: true,
  imports: [
    CommonModule,
    BibleTrackerHeaderComponent,
    BibleTrackerStatsComponent,
    BibleTrackerTestamentCardComponent,
    BibleTrackerBookGroupsComponent,
    BibleTrackerBookGridComponent,
    BibleTrackerChapterHeatmapComponent,
    BibleTrackerVerseGridComponent,
  ],
  templateUrl: './bible-tracker.component.html',
  styleUrls: ['./bible-tracker.component.scss'],
})
export class BibleTrackerComponent implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);
  private bibleService = inject(BibleService);
  private destroy$ = new Subject<void>();

  // State derived values
  memorizedVerses = 0;
  percentComplete = 0;
  isLoading = false;

  selectedBook: BibleBook | null = null;
  selectedChapter: BibleChapter | null = null;

  // Local bible data selections
  testaments: BibleTestament[] = [];
  selectedTestament: BibleTestament | null = null;
  selectedGroup: BibleGroup | null = null;

  includeApocrypha = false;
  isSavingBulk = false;

  progressViewMode: 'testament' | 'groups' = 'testament';
  progressSegments: any[] = [];

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
    'Revelation': '#ef4444',
  };

  // Success popup state
  showSuccessMessage = false;
  successMessage = '';

  constructor() {
    const data = this.bibleService.getBibleData();
    this.testaments = data.testaments;
    this.selectedTestament = this.testaments[0] || null;
    if (this.selectedTestament && this.selectedTestament.groups.length) {
      this.setGroup(this.selectedTestament.groups[0]);
    }
  }

  ngOnInit(): void {
    this.store.dispatch(BibleTrackerActions.init());

    this.store
      .select(selectIsAnyLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => (this.isLoading = loading));

    this.store
      .select(selectStatisticsOverview)
      .pipe(takeUntil(this.destroy$))
      .subscribe((stats) => {
        this.percentComplete = stats.overallPercentage;
        this.memorizedVerses = stats.versesRead;
      });

    this.store
      .select(selectSelectedBookDetails)
      .pipe(takeUntil(this.destroy$))
      .subscribe((book) => (this.selectedBook = book as BibleBook | null));

    this.store
      .select(selectSelectedChapter)
      .pipe(takeUntil(this.destroy$))
      .subscribe((ch) => (this.selectedChapter = ch as BibleChapter | null));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleProgressView(): void {
    this.progressViewMode =
      this.progressViewMode === 'testament' ? 'groups' : 'testament';
  }

  setTestament(testament: BibleTestament): void {
    this.selectedTestament = testament;
    if (testament.groups.length) {
      this.setGroup(testament.groups[0]);
    }
  }

  setGroup(group: BibleGroup): void {
    this.selectedGroup = group;
    if (group.books.length) {
      this.setBook(group.books[0]);
    }
  }

  setBook(book: BibleBook): void {
    this.selectedBook = book;
    const chapters = book.getVisibleChapters(this.includeApocrypha);
    if (chapters.length) {
      this.setChapter(chapters[0]);
    }
    this.store.dispatch(BibleTrackerActions.selectBook({ bookId: book.id.toString() }));
  }

  setChapter(chapter: BibleChapter): void {
    this.selectedChapter = chapter;
    this.store.dispatch(BibleTrackerActions.selectChapter({ chapter: chapter.chapterNumber }));
  }

  selectAllChapters(): void {
    if (!this.selectedBook) return;
    this.store.dispatch(BibleTrackerActions.markBookAsComplete({ bookId: this.selectedBook.id.toString() }));
  }

  clearAllChapters(): void {
    if (!this.selectedBook) return;
    this.store.dispatch(BibleTrackerActions.resetBookProgress({ bookId: this.selectedBook.id.toString() }));
  }

  selectAllVerses(): void {
    if (!this.selectedBook || !this.selectedChapter) return;
    const verses = this.selectedChapter.verses.map(v => v.verseNumber);
    this.store.dispatch(
      BibleTrackerActions.markVersesAsRead({
        bookId: this.selectedBook.id.toString(),
        chapter: this.selectedChapter.chapterNumber,
        verses,
      })
    );
  }

  clearAllVerses(): void {
    if (!this.selectedBook || !this.selectedChapter) return;
    this.store.dispatch(
      BibleTrackerActions.resetChapterProgress({
        bookId: this.selectedBook.id.toString(),
        chapter: this.selectedChapter.chapterNumber,
      })
    );
  }

  toggleAndSaveVerse(verse: any): void {
    if (!this.selectedBook || !this.selectedChapter) return;
    this.store.dispatch(
      BibleTrackerActions.markVersesAsRead({
        bookId: this.selectedBook.id.toString(),
        chapter: this.selectedChapter.chapterNumber,
        verses: [verse.verseNumber],
      })
    );
  }
}
