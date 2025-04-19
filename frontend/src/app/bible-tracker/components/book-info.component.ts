// components/book-info.component.ts
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BibleBook} from '../models';
import {ConfirmationModalComponent} from '../../shared/components/notification/confirmation-modal';

@Component({
  selector: 'app-book-info',
  standalone: true,
  imports: [ConfirmationModalComponent],
  template: `
    <div class="mb-6 bg-blue-50 p-4 rounded-lg">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-xl font-bold">{{ currentBook?.bookName }}</h2>
        <div class="text-sm text-gray-600">
          {{ currentBook?.testament }} • {{ currentBook?.group }}
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white p-3 rounded shadow">
          <p class="text-sm text-gray-500">Verses Memorized</p>
          <p class="text-xl font-bold">{{ memorizedVerses }} / {{ totalVerses }}</p>
          <p class="text-sm text-blue-600">{{ percentComplete }}%</p>
        </div>
        <div class="bg-white p-3 rounded shadow">
          <p class="text-sm text-gray-500">Chapters</p>
          <p class="text-xl font-bold">{{ currentBook?.totalChapters }}</p>
        </div>
        <div class="bg-white p-3 rounded shadow">
          <p class="text-sm text-gray-500">Chapters Completed</p>
          <p class="text-xl font-bold">{{ completedChapters }} / {{ currentBook?.totalChapters }}</p>
        </div>
        <div class="bg-white p-3 rounded shadow">
          <p class="text-sm text-gray-500">Chapters In Progress</p>
          <p class="text-xl font-bold">{{ inProgressChapters }}</p>
        </div>
      </div>

      <!-- Book progress bar -->
      <div class="mt-4">
        <div class="w-full bg-gray-200 rounded-full h-4">
          <div
            class="bg-blue-600 h-4 rounded-full"
            [style.width.%]="percentComplete"
          ></div>
        </div>
      </div>

      <div class="mt-4 text-right">
        <button
          (click)="showConfirmModal()"
          class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Reset Book
        </button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <app-confirmation-modal
      [isVisible]="isConfirmModalVisible"
      [title]="'Reset Book'"
      [message]="'Are you sure you want to reset all progress for ' + (currentBook?.bookName || '') + '? This action cannot be undone.'"
      [confirmText]="'Reset'"
      (confirm)="confirmReset()"
      (cancel)="cancelReset()"
    ></app-confirmation-modal>
  `
})
export class BookInfoComponent {
  @Input() currentBook: BibleBook | null = null;
  @Input() memorizedVerses: number = 0;
  @Input() totalVerses: number = 0;
  @Input() completedChapters: number = 0;
  @Input() inProgressChapters: number = 0;

  @Output() resetBook = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;

  get percentComplete(): number {
    if (!this.totalVerses) return 0;
    return Math.round((this.memorizedVerses / this.totalVerses) * 100);
  }

  showConfirmModal(): void {
    this.isConfirmModalVisible = true;
  }

  confirmReset(): void {
    this.resetBook.emit();
    this.isConfirmModalVisible = false;
  }

  cancelReset(): void {
    this.isConfirmModalVisible = false;
  }
}
