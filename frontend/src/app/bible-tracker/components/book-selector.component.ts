// In book-selector.component.ts - Enhanced version
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BibleBook} from '../models';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {BibleTrackerService} from '../bible-tracker-service';

@Component({
  selector: 'app-book-selector',
  standalone: true,
  imports: [
    NgClass,
    NgFor,
    NgIf
  ],
  template: `
    <div class="bg-white p-4 rounded shadow mb-6">
      <h3 class="text-lg font-semibold mb-3">{{ selectedGroup }} Books</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <button
          *ngFor="let book of orderedBooks"
          (click)="selectBook(book.name)"
          class="book-card"
          [class.active]="selectedBook === book.name"
          [class.completed]="isBookCompleted(book.name)"
          [class.in-progress]="isBookInProgress(book.name)"
        >
          <div class="card-content">
            <div class="book-name">{{ book.name }}</div>

            <div class="progress-container">
              <div
                class="progress-bar"
                [ngClass]="{
                  'completed-bar': isBookCompleted(book.name),
                  'progress-bar-default': !isBookCompleted(book.name)
                }"
                [style.width.%]="getBookStats(book.name)"
              ></div>
            </div>

            <div class="stats">
              <div class="stat-value">{{ getBookStats(book.name) }}%</div>
              <div class="chapter-stat">{{ getCompletedChapters(book.name) }}/{{ book.book.totalChapters }}</div>
            </div>

            <!-- Status indicator icon -->
            <div class="status-icon" *ngIf="isBookCompleted(book.name) || isBookInProgress(book.name)">
              <svg *ngIf="isBookCompleted(book.name)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                   fill="currentColor" class="completed-icon">
                <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"/>
              </svg>
              <svg *ngIf="!isBookCompleted(book.name) && isBookInProgress(book.name)" xmlns="http://www.w3.org/2000/svg"
                   viewBox="0 0 20 20" fill="currentColor" class="progress-icon">
                <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .book-card {
      width: 100%;
      background-color: white;
      border-radius: 8px;
      padding: 12px;
      border: 1px solid #e5e7eb;
      text-align: left;
      position: relative;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .book-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .book-card.active {
      transform: translateY(-2px);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
    }

    .book-card.active {
      border-color: #3b82f6;
      background-color: #eff6ff;
    }

    .book-card.completed {
      border-color: #10b981;
    }

    .book-card.completed.active {
      border-color: #10b981;
      background-color: #ecfdf5;
    }

    .book-card.in-progress.active {
      border-color: #3b82f6;
      background-color: #eff6ff;
    }

    .card-content {
      position: relative;
    }

    .book-name {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .completed .book-name {
      color: #047857;
    }

    .in-progress .book-name {
      color: #1e40af;
    }

    .progress-container {
      height: 3px;
      background-color: #f3f4f6;
      border-radius: 1.5px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-bar {
      height: 100%;
      border-radius: 1.5px;
      transition: width 0.3s ease;
    }

    .progress-bar-default {
      background-color: #3b82f6;
    }

    .completed-bar {
      background-color: #10b981;
    }

    .stats {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6b7280;
    }

    .stat-value {
      font-weight: 600;
    }

    .completed .stat-value {
      color: #047857;
    }

    .in-progress .stat-value {
      color: #1e40af;
    }

    .status-icon {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 16px;
      height: 16px;
    }

    .completed-icon {
      color: #10b981;
    }

    .progress-icon {
      color: #3b82f6;
    }

    @media (max-width: 640px) {
      .book-name {
        font-size: 12px;
      }

      .stats {
        font-size: 10px;
      }

      .book-card {
        padding: 8px;
      }
    }
  `]
})
export class BookSelectorComponent {
  @Input() booksInGroup: { [key: string]: BibleBook } = {};
  @Input() selectedGroup: string = '';
  @Input() selectedBook: string = '';

  @Output() bookChange = new EventEmitter<string>();

  constructor(private bibleTrackerService: BibleTrackerService) {
  }

  get orderedBooks(): { name: string, book: BibleBook }[] {
    // Convert the object to an array and sort by canonical order
    return Object.entries(this.booksInGroup)
      .map(([name, book]) => ({name, book}))
      .sort((a, b) => a.book.order - b.book.order);
  }

  selectBook(bookName: string): void {
    this.bookChange.emit(bookName);
  }

  getBookStats(bookName: string): number {
    return this.bibleTrackerService.calculateBookStats(bookName).percentComplete;
  }

  getCompletedChapters(bookName: string): number {
    return this.bibleTrackerService.calculateBookStats(bookName).completedChapters;
  }

  isBookCompleted(bookName: string): boolean {
    const stats = this.bibleTrackerService.calculateBookStats(bookName);
    return stats.percentComplete === 100;
  }

  isBookInProgress(bookName: string): boolean {
    const stats = this.bibleTrackerService.calculateBookStats(bookName);
    return !this.isBookCompleted(bookName) && stats.memorizedVerses > 0;
  }
}
