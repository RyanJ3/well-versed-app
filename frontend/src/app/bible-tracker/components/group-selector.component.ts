// components/group-selector.component.ts - Enhanced version
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BibleTrackerService} from '../bible-tracker-service';
import {BIBLE_DATA} from '../models';
import {ConfirmationModalComponent} from '../../shared/components/notification/confirmation-modal';

@Component({
  selector: 'app-group-selector',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  template: `
    <div class="bg-white p-4 rounded shadow mb-6">
      <h3 class="text-lg font-semibold mb-3">Select Book Group</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <button
          *ngFor="let group of availableGroups"
          (click)="selectGroup(group)"
          class="group-card"
          [class.active]="selectedGroup === group"
          [ngClass]="{
              'testament-old': selectedTestament === 'Old Testament',
              'testament-new': selectedTestament === 'New Testament'
            }"
        >
          <div class="card-content">
            <div class="flex justify-between items-center mb-2">
              <h4 class="group-name">{{ group }}</h4>
              <span class="group-badge"
                    [ngClass]="{
                      'bg-amber-100 text-amber-800': selectedTestament === 'Old Testament',
                      'bg-indigo-100 text-indigo-800': selectedTestament === 'New Testament'
                    }">
                {{ getGroupStats(group).percentComplete }}%
              </span>
            </div>

            <div class="progress-container">
              <div
                class="progress-bar"
                [ngClass]="{
                    'bg-amber-500': selectedTestament === 'Old Testament',
                    'bg-indigo-500': selectedTestament === 'New Testament'
                  }"
                [style.width.%]="getGroupStats(group).percentComplete"
              ></div>
            </div>

            <div class="flex justify-between items-center mt-3">
              <div class="book-count">
                <span class="text-xs font-medium">{{ getGroupBookCount(group) }} Books</span>
              </div>
              <div class="stats-text text-xs">
                <span>{{ getGroupStats(group).completedChapters }}/{{ getGroupStats(group).totalChapters }}
                  Chapters</span>
                <span class="mx-1">•</span>
                <span>{{ getGroupTotalVerses(group) }} Verses</span>
              </div>
            </div>

            <!-- Book preview -->
            <div class="book-preview mt-3">
              <div class="flex flex-wrap gap-1">
                <span *ngFor="let book of getTopBooksInGroup(group, 5)"
                      class="book-chip"
                      [ngClass]="{
                        'bg-amber-50 text-amber-900': selectedTestament === 'Old Testament',
                        'bg-indigo-50 text-indigo-900': selectedTestament === 'New Testament'
                      }">
                  {{ getShortBookName(book) }}
                </span>
                <span *ngIf="getGroupBookCount(group) > 5"
                      class="book-chip more-chip"
                      [ngClass]="{
                        'bg-amber-50 text-amber-900': selectedTestament === 'Old Testament',
                        'bg-indigo-50 text-indigo-900': selectedTestament === 'New Testament'
                      }">
                  +{{ getGroupBookCount(group) - 5 }}
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div class="mt-4 text-right">
        <button
          (click)="showConfirmModal()"
          class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
        >
          Reset {{ selectedGroup }}
        </button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <app-confirmation-modal
      [isVisible]="isConfirmModalVisible"
      [title]="'Reset Book Group'"
      [message]="'Are you sure you want to reset all progress for ' + selectedGroup + ' books? This action cannot be undone.'"
      [confirmText]="'Reset'"
      (confirm)="confirmReset()"
      (cancel)="cancelReset()"
    ></app-confirmation-modal>
  `,
  styles: [`
    .group-card {
      background-color: white;
      text-align: left;
      border-radius: 10px;
      padding: 14px;
      border: 1px solid #e5e7eb;
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
      width: 100%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .group-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }

    .group-card.active {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    /* Old Testament themes */
    .testament-old.active {
      border-color: #f59e0b;
      background-color: rgba(254, 243, 199, 0.2);
    }

    .testament-old.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background: linear-gradient(to bottom, #f59e0b, #fbbf24);
    }

    /* New Testament themes */
    .testament-new.active {
      border-color: #6366f1;
      background-color: rgba(224, 231, 255, 0.2);
    }

    .testament-new.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background: linear-gradient(to bottom, #6366f1, #818cf8);
    }

    .card-content {
      position: relative;
      z-index: 2;
    }

    .group-name {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      color: #1f2937;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .active .group-name {
      color: #111827;
    }

    .group-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
    }

    .progress-container {
      height: 5px;
      background-color: #f3f4f6;
      border-radius: 2.5px;
      overflow: hidden;
      margin: 8px 0;
    }

    .progress-bar {
      height: 100%;
      border-radius: 2.5px;
      transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .stats-text {
      color: #6b7280;
      font-size: 11px;
    }

    .book-chip {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 4px;
      display: inline-block;
    }

    .more-chip {
      font-weight: 600;
    }

    .book-preview {
      border-top: 1px solid rgba(229, 231, 235, 0.7);
      padding-top: 6px;
    }

    /* Add subtle pattern to active cards */
    .group-card.active::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f9fafb' fill-opacity='0.6' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.5;
      z-index: 1;
    }

    @media (max-width: 640px) {
      .group-name {
        font-size: 14px;
      }

      .stats-text, .book-count {
        font-size: 10px;
      }
    }
  `]
})
export class GroupSelectorComponent {
  @Input() availableGroups: string[] = [];
  @Input() selectedGroup: string = '';
  @Input() selectedTestament: string = '';

  @Output() groupChange = new EventEmitter<string>();
  @Output() resetGroup = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;

  constructor(private bibleTrackerService: BibleTrackerService) {
  }

  selectGroup(group: string): void {
    this.groupChange.emit(group);
  }

  showConfirmModal(): void {
    this.isConfirmModalVisible = true;
  }

  confirmReset(): void {
    this.resetGroup.emit();
    this.isConfirmModalVisible = false;
  }

  cancelReset(): void {
    this.isConfirmModalVisible = false;
  }

  getGroupStats(group: string): { percentComplete: number, completedChapters: number, totalChapters: number } {
    return this.bibleTrackerService.calculateGroupStats(group);
  }

  getGroupBookCount(group: string): number {
    return Object.values(BIBLE_DATA)
      .filter(book => book.group === group)
      .length;
  }

  getGroupTotalVerses(group: string): number {
    return Object.values(BIBLE_DATA)
      .filter(book => book.group === group)
      .reduce((sum, book) => sum + book.totalVerses, 0);
  }

  getTopBooksInGroup(group: string, count: number): string[] {
    return Object.entries(BIBLE_DATA)
      .filter(([_, book]) => book.group === group)
      .sort((a, b) => a[1].order - b[1].order)
      .slice(0, count)
      .map(([name, _]) => name);
  }

  // Shorten book names for chips display
  getShortBookName(bookName: string): string {
    // Handle special cases
    if (bookName.startsWith('1 ')) return '1' + bookName.split(' ')[1].substring(0, 3);
    if (bookName.startsWith('2 ')) return '2' + bookName.split(' ')[1].substring(0, 3);
    if (bookName.startsWith('3 ')) return '3' + bookName.split(' ')[1].substring(0, 3);

    // For Song of Solomon and other long names
    if (bookName === 'Song of Solomon') return 'Song';

    // For normal books, just use the first 5 characters or the whole name if shorter
    return bookName.length > 5 ? bookName.substring(0, 5) : bookName;
  }
}
