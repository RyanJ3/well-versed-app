// components/chapter-selector.component.ts
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ChapterProgress} from '../models';
import {FormsModule} from '@angular/forms';
import {NgClass, NgForOf} from '@angular/common';

@Component({
  selector: 'app-chapter-selector',
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    NgForOf
  ],
  template: `
    <div class="mb-6">
      <h2 class="text-lg font-semibold mb-3">Chapter Progress</h2>

      <div class="bg-white p-4 rounded shadow mb-4">
        <div class="mb-3">
          <label for="chapter-select" class="block text-sm font-medium text-gray-700 mb-1">
            Select Chapter:
          </label>
          <select
            id="chapter-select"
            [(ngModel)]="selectedChapter"
            (change)="onChapterSelect()"
            class="w-full p-2 border rounded"
          >
            <option *ngFor="let chapter of currentBookProgress; let i = index" [value]="chapter.chapter">
              Chapter {{ chapter.chapter }}
              {{
                chapter.completed ? ' (Completed)' :
                  (chapter.inProgress ? ' (In Progress)' : ' (Not Started)')
              }}
            </option>
          </select>
        </div>

        <!-- Chapter Overview -->
        <div class="mb-3">
          <p class="text-sm text-gray-500 mb-2">Quick Overview:</p>
          <div class="bubbles-container">
            <button
              *ngFor="let chapter of currentBookProgress; trackBy: trackByFn"
              (click)="selectChapter(chapter.chapter)"
              class="chapter-bubble"
              [ngClass]="{
                'not-started': !chapter.inProgress && !chapter.completed,
                'in-progress': chapter.inProgress && !chapter.completed,
                'completed': chapter.completed,
                'selected': chapter.chapter === selectedChapter
              }"
            >
              {{ chapter.chapter }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chapter-bubble {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .chapter-bubble:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .chapter-bubble.not-started {
      background-color: #d1d5db; /* bg-gray-200 */
      color: #1f2937; /* text-gray-800 */
    }

    .chapter-bubble.in-progress {
      background-color: #dbeafe; /* bg-blue-100 */
      color: #1e40af; /* text-blue-800 */
    }

    .chapter-bubble.completed {
      background-color: #dcfce7; /* bg-green-100 */
      color: #166534; /* text-green-800 */
    }

    .chapter-bubble.selected {
      box-shadow: 0 0 0 2px #3b82f6; /* ring-2 ring-blue-500 */
    }

    .bubbles-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0;
      padding: 0.5rem;
      border-radius: 0.375rem;
      background-color: rgba(249, 250, 251, 1);
    }

    @media (min-width: 768px) {
      .bubbles-container {
        gap: 0.75rem;
      }
    }
  `]
})
export class ChapterSelectorComponent {
  @Input() currentBookProgress: ChapterProgress[] = [];
  @Input() selectedChapter: number = 1;

  @Output() chapterSelect = new EventEmitter<number>();

  onChapterSelect(): void {
    this.chapterSelect.emit(this.selectedChapter);
  }

  selectChapter(chapterNumber: number): void {
    this.selectedChapter = chapterNumber;
    this.chapterSelect.emit(chapterNumber);
  }

  trackByFn(index: number): number {
    return index;
  }
}
