// components/chapter-progress.component.ts
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BibleBook, ChapterProgress} from '../models';
import {CommonModule} from '@angular/common';
import {VerseSelectorComponent} from './verse-selector.component';
import {ConfirmationModalComponent} from '../../shared/components/notification/confirmation-modal';

@Component({
  selector: 'app-chapter-progress',
  standalone: true,
  imports: [
    CommonModule,
    VerseSelectorComponent,
    ConfirmationModalComponent
  ],
  template: `
    <div *ngIf="currentBook && selectedChapterIndex >= 0 && selectedChapterIndex < currentBook.chapters.length"
         class="bg-white border rounded p-4 shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">
          {{ currentBook.bookName }} {{ selectedChapter }}
          <span *ngIf="chapterProgress?.completed" class="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
            Completed
          </span>
          <span *ngIf="!chapterProgress?.completed && chapterProgress?.inProgress"
                class="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            In Progress
          </span>
        </h3>
        <span class="text-gray-600">
          {{ memorizedCount }} / {{ totalVerses }} verses
        </span>
      </div>

      <!-- Progress Details -->
      <div class="mb-4">
        <div class="flex flex-col space-y-1">
          <p class="text-sm text-gray-600">Total verses: {{ totalVerses }}</p>
          <p class="text-sm text-gray-600">Memorized: {{ memorizedCount }}</p>
          <p class="text-sm text-gray-600">
            Remaining: {{ totalVerses - memorizedCount }}
          </p>
          <p class="text-sm text-gray-600">
            Progress: {{ progressPercent }}%
          </p>
        </div>
      </div>

      <!-- Verse Selector Component -->
      <app-verse-selector
        [totalVerses]="totalVerses"
        [versesMemorized]="chapterProgress?.versesMemorized || []"
        (versesChange)="onVersesChange($event)"
      ></app-verse-selector>
    </div>

    <!-- Confirmation Modal -->
    <app-confirmation-modal
      [isVisible]="isConfirmModalVisible"
      [title]="'Reset Chapter'"
      [message]="'Are you sure you want to reset progress for Chapter ' + selectedChapter + '? This action cannot be undone.'"
      [confirmText]="'Reset'"
      (confirm)="confirmReset()"
      (cancel)="cancelReset()"
    ></app-confirmation-modal>
  `,
  styles: []
})
export class ChapterProgressComponent {
  @Input() currentBook: BibleBook | null = null;
  @Input() selectedChapter: number = 1;
  @Input() selectedChapterIndex: number = 0;
  @Input() chapterProgress: ChapterProgress | null = null;

  @Output() incrementVersesEvent = new EventEmitter<void>();
  @Output() decrementVersesEvent = new EventEmitter<void>();
  @Output() updateProgress = new EventEmitter<number[]>();
  @Output() resetChapter = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;

  get totalVerses(): number {
    if (!this.currentBook || this.selectedChapterIndex < 0 || this.selectedChapterIndex >= this.currentBook.chapters.length) {
      return 0;
    }
    return this.currentBook.chapters[this.selectedChapterIndex];
  }

  get memorizedCount(): number {
    return this.chapterProgress?.versesMemorized?.filter(v => v).length || 0;
  }

  get progressPercent(): number {
    if (!this.totalVerses) return 0;
    return Math.round((this.memorizedCount / this.totalVerses) * 100);
  }

  onVersesChange(versesMemorized: boolean[]): void {
    // Convert boolean array to list of verse numbers for API compatibility
    const selectedVerses = versesMemorized
      .map((isMemorized, index) => isMemorized ? index + 1 : null)
      .filter(v => v !== null) as number[];

    this.updateProgress.emit(selectedVerses);
  }

  confirmReset(): void {
    this.resetChapter.emit();
    this.isConfirmModalVisible = false;
  }

  cancelReset(): void {
    this.isConfirmModalVisible = false;
  }
}
