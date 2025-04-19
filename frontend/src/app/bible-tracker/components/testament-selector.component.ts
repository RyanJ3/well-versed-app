// components/testament-selector.component.ts - Enhanced version with vertical layout
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BibleTrackerService} from '../bible-tracker-service';
import {BIBLE_DATA} from '../models';
import {ConfirmationModalComponent} from '../../shared/components/notification/confirmation-modal';

@Component({
  selector: 'app-testament-selector',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  template: `
    <div class="bg-white p-4 rounded shadow mb-6">
      <h3 class="text-lg font-semibold mb-2">Select Testament</h3>
      <!-- Vertical testament cards - one testament per row -->
      <div class="flex flex-col gap-4">
        <button
          *ngFor="let testament of testaments"
          (click)="selectTestament(testament)"
          class="testament-card"
          [class.old-testament]="testament === 'Old Testament'"
          [class.new-testament]="testament === 'New Testament'"
          [class.active]="selectedTestament === testament"
        >
          <div class="card-content">
            <!-- Top section with title and statistics -->
            <div class="flex justify-between items-center mb-2">
              <div>
                <div class="text-xl font-semibold" [ngClass]="{
                  'text-amber-700': testament === 'Old Testament',
                  'text-indigo-700': testament === 'New Testament'
                }">{{ testament }}
                </div>
                <div class="text-sm mt-1" [ngClass]="{
                  'text-amber-600': testament === 'Old Testament',
                  'text-indigo-600': testament === 'New Testament'
                }">
                  {{ getTestamentStats(testament).percentComplete }}% Complete
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium">
                  {{ getTestamentBookCount(testament) }} Books
                </div>
                <div class="text-xs text-gray-500">
                  {{ getTestamentChapterCount(testament) }} Chapters •
                  {{ getTestamentVerseCount(testament) }} Verses
                </div>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-2 rounded-full transition-width relative"
                [ngClass]="{
                  'bg-gradient-to-r from-amber-500 to-amber-400': testament === 'Old Testament',
                  'bg-gradient-to-r from-indigo-600 to-indigo-400': testament === 'New Testament'
                }"
                [style.width.%]="getTestamentStats(testament).percentComplete"
              >
                <!-- Add a subtle animation effect for an active progress bar -->
                <div *ngIf="selectedTestament === testament"
                     class="progress-shimmer absolute inset-0"></div>
              </div>
            </div>

            <!-- Book groups preview -->
            <div class="mt-4 flex flex-wrap gap-2">
              <div *ngFor="let group of getTestamentGroups(testament)"
                   class="group-chip"
                   [ngClass]="{
                     'bg-amber-100 text-amber-800': testament === 'Old Testament',
                     'bg-indigo-100 text-indigo-800': testament === 'New Testament',
                     'border-amber-300': testament === 'Old Testament' && selectedGroup === group,
                     'border-indigo-300': testament === 'New Testament' && selectedGroup === group
                   }">
                {{ group }}
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
          Reset {{ selectedTestament }}
        </button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <app-confirmation-modal
      [isVisible]="isConfirmModalVisible"
      [title]="'Reset Testament'"
      [message]="'Are you sure you want to reset all progress for ' + selectedTestament + '? This action cannot be undone.'"
      [confirmText]="'Reset'"
      (confirm)="confirmReset()"
      (cancel)="cancelReset()"
    ></app-confirmation-modal>
  `,
  styles: [`
    .testament-card {
      width: 100%;
      padding: 16px 20px;
      border-radius: 12px;
      transition: all 0.3s ease;
      border: 1px solid #e5e7eb;
      position: relative;
      overflow: hidden;
      text-align: left;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }

    .testament-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.08);
    }

    .testament-card.active {
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
    }

    .old-testament {
      background: linear-gradient(120deg, rgba(251, 247, 237, 0.8) 0%, rgba(254, 249, 231, 0.6) 100%);
      border-left: 4px solid #f59e0b;
    }

    .old-testament.active {
      background: linear-gradient(120deg, rgba(254, 243, 199, 0.5) 0%, rgba(253, 230, 138, 0.3) 100%);
      border-color: #d97706;
      box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.15);
    }

    .new-testament {
      background: linear-gradient(120deg, rgba(238, 242, 255, 0.8) 0%, rgba(224, 231, 255, 0.6) 100%);
      border-left: 4px solid #6366f1;
    }

    .new-testament.active {
      background: linear-gradient(120deg, rgba(224, 231, 255, 0.5) 0%, rgba(199, 210, 254, 0.3) 100%);
      border-color: #4f46e5;
      box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.15);
    }

    .card-content {
      position: relative;
      z-index: 2;
    }

    .transition-width {
      transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Progress Bar Shimmer Effect */
    .progress-shimmer {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.3) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    /* Book Group Chips */
    .group-chip {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: 999px;
      border: 1px solid transparent;
      white-space: nowrap;
    }

    /* Add a subtle decoration to the active testament */
    .testament-card.active::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 120px;
      height: 120px;
      background-image: radial-gradient(circle at top right, rgba(255, 255, 255, 0.8) 10%, transparent 70%);
      z-index: 1;
    }

    /* Responsive adjustments */
    @media (max-width: 640px) {
      .testament-card {
        padding: 12px 16px;
      }
    }
  `]
})
export class TestamentSelectorComponent {
  @Input() testaments: string[] = [];
  @Input() selectedTestament: string = '';
  @Input() selectedGroup: string = '';

  @Output() testamentChange = new EventEmitter<string>();
  @Output() resetTestament = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;

  constructor(private bibleTrackerService: BibleTrackerService) {
  }

  selectTestament(testament: string): void {
    this.testamentChange.emit(testament);
  }

  showConfirmModal(): void {
    this.isConfirmModalVisible = true;
  }

  confirmReset(): void {
    this.resetTestament.emit();
    this.isConfirmModalVisible = false;
  }

  cancelReset(): void {
    this.isConfirmModalVisible = false;
  }

  getTestamentStats(testament: string): { percentComplete: number } {
    return this.bibleTrackerService.calculateTestamentStats(testament);
  }

  getTestamentBookCount(testament: string): number {
    return Object.values(BIBLE_DATA).filter(book => book.testament === testament).length;
  }

  getTestamentChapterCount(testament: string): number {
    return Object.values(BIBLE_DATA)
      .filter(book => book.testament === testament)
      .reduce((sum, book) => sum + book.totalChapters, 0);
  }

  getTestamentVerseCount(testament: string): number {
    return Object.values(BIBLE_DATA)
      .filter(book => book.testament === testament)
      .reduce((sum, book) => sum + book.totalVerses, 0);
  }

  getTestamentGroups(testament: string): string[] {
    return this.bibleTrackerService.getGroupsInTestament(testament);
  }
}
