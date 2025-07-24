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
  selectViewMode
} from '@app/state/bible-tracker/selectors/bible-tracker.selectors';
import { BookProgress } from '@app/state/bible-tracker/models/bible-tracker.model';

import { BibleTrackerBookGridComponent } from './components/bible-tracker-book-grid/bible-tracker-book-grid.component';
import { SpinnerComponent } from '../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-bible-tracker',
  standalone: true,
  imports: [CommonModule, BibleTrackerBookGridComponent, SpinnerComponent],
  templateUrl: './bible-tracker.component.html',
  styleUrls: ['./bible-tracker.component.scss']
})
export class BibleTrackerComponent implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);
  private destroy$ = new Subject<void>();

  // Selectors
  books$ = this.store.select(selectFilteredBooks);
  statistics$ = this.store.select(selectStatisticsOverview);
  isLoading$ = this.store.select(selectIsLoadingProgress);
  selectedBook$ = this.store.select(selectSelectedBookDetails);
  todaysProgress$ = this.store.select(selectTodaysProgress);
  viewMode$ = this.store.select(selectViewMode);

  ngOnInit(): void {
    this.store.dispatch(BibleTrackerActions.init());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBookSelected(book: BookProgress): void {
    this.store.dispatch(BibleTrackerActions.selectBook({ bookId: book.bookId }));
  }

  onVersesMarked(event: { bookId: string; chapter: number; verses: number[] }): void {
    this.store.dispatch(
      BibleTrackerActions.markVersesAsRead({
        bookId: event.bookId,
        chapter: event.chapter,
        verses: event.verses
      })
    );
  }

  markChapterComplete(bookId: string, chapter: number): void {
    this.store.dispatch(BibleTrackerActions.markChapterAsComplete({ bookId, chapter }));
  }

  setViewMode(viewMode: 'grid' | 'list' | 'reading'): void {
    this.store.dispatch(BibleTrackerActions.setViewMode({ viewMode }));
  }

  toggleCompletedFilter(): void {
    this.store.dispatch(BibleTrackerActions.toggleCompletedFilter());
  }
}
