import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';

import { AppState } from '@app/state';
import { BibleTrackerActions } from '@app/state/bible-tracker';
import {
  selectFilteredBooks,
  selectStatisticsOverview,
  selectIsLoadingProgress,
  selectSelectedBookDetails,
  selectTodaysProgress,
  selectViewMode,
} from '@app/state/bible-tracker/selectors/bible-tracker.selectors';

@Component({
  selector: 'app-bible-tracker',
  standalone: true,
  imports: [CommonModule /* other component imports */],
  template: `
    <div class="bible-tracker">
      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading$ | async">
        <app-spinner></app-spinner>
      </div>

      <!-- Header with Stats -->
      <div class="tracker-header">
        <h1>Bible Reading Tracker</h1>

        <div class="stats-summary" *ngIf="statistics$ | async as stats">
          <div class="stat-card">
            <div class="stat-value">
              {{ stats.overallPercentage | number: '1.1-1' }}%
            </div>
            <div class="stat-label">Complete</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.versesRead | number }}</div>
            <div class="stat-label">Verses Read</div>
          </div>
          <div class="stat-card" *ngIf="todaysProgress$ | async as today">
            <div class="stat-value">{{ today.versesReadToday }}</div>
            <div class="stat-label">Today</div>
          </div>
        </div>
      </div>

      <!-- View Mode Toggle -->
      <div class="view-controls">
        <button
          class="view-btn"
          [class.active]="(viewMode$ | async) === 'grid'"
          (click)="setViewMode('grid')"
        >
          Grid View
        </button>
        <button
          class="view-btn"
          [class.active]="(viewMode$ | async) === 'list'"
          (click)="setViewMode('list')"
        >
          List View
        </button>
        <button
          class="view-btn"
          [class.active]="(viewMode$ | async) === 'reading'"
          (click)="setViewMode('reading')"
        >
          Reading View
        </button>
      </div>

      <!-- Book Grid/List -->
      <div class="books-container" [ngSwitch]="viewMode$ | async">
        <app-bible-tracker-book-grid
          *ngSwitchCase="'grid'"
          [books]="books$ | async"
          (bookSelected)="selectBook($event)"
          (versesMarked)="markVersesRead($event)"
        >
        </app-bible-tracker-book-grid>

        <app-bible-tracker-book-list
          *ngSwitchCase="'list'"
          [books]="books$ | async"
          (bookSelected)="selectBook($event)"
        >
        </app-bible-tracker-book-list>

        <app-bible-tracker-reading-view
          *ngSwitchCase="'reading'"
          [selectedBook]="selectedBook$ | async"
          (versesRead)="markVersesRead($event)"
        >
        </app-bible-tracker-reading-view>
      </div>
    </div>
  `,
  styleUrls: ['./bible-tracker.component.scss'],
})
export class BibleTrackerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State Selectors
  books$ = this.store.select(selectFilteredBooks);
  statistics$ = this.store.select(selectStatisticsOverview);
  isLoading$ = this.store.select(selectIsLoadingProgress);
  selectedBook$ = this.store.select(selectSelectedBookDetails);
  todaysProgress$ = this.store.select(selectTodaysProgress);
  viewMode$ = this.store.select(selectViewMode);

  private store = inject(Store<AppState>);

  ngOnInit(): void {
    this.store.dispatch(BibleTrackerActions.init());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectBook(bookId: string): void {
    this.store.dispatch(BibleTrackerActions.selectBook({ bookId }));
  }

  markVersesRead(event: {
    bookId: string;
    chapter: number;
    verses: number[];
  }): void {
    this.store.dispatch(
      BibleTrackerActions.markVersesAsRead({
        bookId: event.bookId,
        chapter: event.chapter,
        verses: event.verses,
      }),
    );
  }

  markChapterComplete(bookId: string, chapter: number): void {
    this.store.dispatch(
      BibleTrackerActions.markChapterAsComplete({
        bookId,
        chapter,
      }),
    );
  }

  setViewMode(viewMode: 'grid' | 'list' | 'reading'): void {
    this.store.dispatch(BibleTrackerActions.setViewMode({ viewMode }));
  }

  toggleCompletedFilter(): void {
    this.store.dispatch(BibleTrackerActions.toggleCompletedFilter());
  }
}
