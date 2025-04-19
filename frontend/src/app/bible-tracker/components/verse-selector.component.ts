// components/verse-selector.component.ts
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass, NgFor} from '@angular/common';

@Component({
  selector: 'app-verse-selector',
  standalone: true,
  imports: [
    NgClass,
    NgFor
  ],
  template: `
    <div class="mt-4">
      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          class="h-2 rounded-full bg-blue-500"
          [style.width.%]="progressPercent"
        ></div>
      </div>

      <!-- Verse bubbles -->
      <div class="bubbles-container scrollable">
        <button
          *ngFor="let i of versesArray; trackBy: trackByFn"
          (click)="toggleVerse(i)"
          class="bubble verse-bubble"
          [ngClass]="{
            'not-selected': !isVerseSelected(i),
            'selected': isVerseSelected(i)
          }"
        >
          {{ i }}
        </button>
      </div>

      <div class="flex justify-between mt-4">
        <button
          (click)="selectAll()"
          class="action-button primary"
        >
          Select All
        </button>

        <button
          (click)="clearAll()"
          class="action-button secondary"
        >
          Clear All
        </button>
      </div>
    </div>
  `,
  styles: [`
    .bubble {
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

    .bubble:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .verse-bubble.selected {
      background-color: rgba(16, 185, 129, 0.2);
      color: rgb(6, 95, 70);
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4);
    }

    .verse-bubble.not-selected {
      background-color: rgba(229, 231, 235, 1);
      color: rgba(55, 65, 81, 1);
    }

    .action-button {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .action-button.primary {
      background-color: rgba(59, 130, 246, 1);
      color: white;
    }

    .action-button.primary:hover {
      background-color: rgba(37, 99, 235, 1);
    }

    .action-button.secondary {
      background-color: rgba(156, 163, 175, 1);
      color: white;
    }

    .action-button.secondary:hover {
      background-color: rgba(107, 114, 128, 1);
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

    .bubbles-container.scrollable {
      max-height: 180px;
      overflow-y: auto;
    }

    @media (min-width: 768px) {
      .bubbles-container {
        gap: 0.75rem;
      }
    }
  `]
})
export class VerseSelectorComponent {
  @Input() totalVerses: number = 0;
  @Input() versesMemorized: boolean[] = [];

  @Output() versesChange = new EventEmitter<boolean[]>();

  get versesArray(): number[] {
    return Array.from({length: this.totalVerses}, (_, i) => i + 1);
  }

  get progressPercent(): number {
    if (!this.totalVerses) return 0;
    const memorizedCount = this.versesMemorized.filter(v => v).length;
    return Math.round((memorizedCount / this.totalVerses) * 100);
  }

  ngOnChanges(): void {
    // Make sure versesMemorized is always the right length
    if (!this.versesMemorized || this.versesMemorized.length !== this.totalVerses) {
      this.versesMemorized = Array(this.totalVerses).fill(false);
    }
  }

  isVerseSelected(verseNumber: number): boolean {
    return this.versesMemorized[verseNumber - 1];
  }

  toggleVerse(verseNumber: number): void {
    if (verseNumber < 1 || verseNumber > this.totalVerses) return;

    // Create a new array to ensure change detection
    const updatedVerses = [...this.versesMemorized];
    updatedVerses[verseNumber - 1] = !updatedVerses[verseNumber - 1];

    this.versesMemorized = updatedVerses;
    this.versesChange.emit(updatedVerses);
  }

  selectAll(): void {
    this.versesMemorized = Array(this.totalVerses).fill(true);
    this.versesChange.emit(this.versesMemorized);
  }

  clearAll(): void {
    this.versesMemorized = Array(this.totalVerses).fill(false);
    this.versesChange.emit(this.versesMemorized);
  }

  trackByFn(index: number): number {
    return index;
  }
}
