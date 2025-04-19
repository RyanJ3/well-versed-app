// components/verse-selector.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';

@Component({
  selector: 'app-verse-selector',
  standalone: true,
  imports: [NgClass, NgFor],
  templateUrl: './verse-selector.component.html',
  styleUrls: ['./verse-selector.component.scss'],
})
export class VerseSelectorComponent {
  @Input() totalVerses: number = 0;
  @Input() versesMemorized: boolean[] = [];

  @Output() versesChange = new EventEmitter<boolean[]>();

  get versesArray(): number[] {
    return Array.from({ length: this.totalVerses }, (_, i) => i + 1);
  }

  get progressPercent(): number {
    if (!this.totalVerses) return 0;
    const memorizedCount = this.versesMemorized.filter((v) => v).length;
    return Math.round((memorizedCount / this.totalVerses) * 100);
  }

  ngOnChanges(): void {
    // Make sure versesMemorized is always the right length
    if (
      !this.versesMemorized ||
      this.versesMemorized.length !== this.totalVerses
    ) {
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
