// components/verse-selector.component.ts
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';

@Component({
  selector: 'app-verse-selector',
  standalone: true,
  imports: [NgClass, NgFor],
  templateUrl: './verse-selector.component.html',
  styleUrls: ['./verse-selector.component.scss'],
})
export class VerseSelectorComponent implements OnChanges {
  @Input() totalVerses: number = 0;
  @Input() versesMemorized: number[] = []; // Array of verse numbers that are memorized

  @Output() versesChange = new EventEmitter<number[]>();

  // Internal array to track verse state
  private selectedVerses: Set<number> = new Set<number>();

  get versesArray(): number[] {
    return Array.from({ length: this.totalVerses }, (_, i) => i + 1);
  }

  get progressPercent(): number {
    if (!this.totalVerses) return 0;
    return Math.round((this.selectedVerses.size / this.totalVerses) * 100);
  }

  ngOnChanges(): void {
    // Initialize the set of selected verses based on input
    this.selectedVerses = new Set<number>(this.versesMemorized || []);
  }

  isVerseSelected(verseNumber: number): boolean {
    return this.selectedVerses.has(verseNumber);
  }

  toggleVerse(verseNumber: number): void {
    if (verseNumber < 1 || verseNumber > this.totalVerses) return;

    // Toggle the verse in our set
    if (this.selectedVerses.has(verseNumber)) {
      this.selectedVerses.delete(verseNumber);
    } else {
      this.selectedVerses.add(verseNumber);
    }

    // Emit the updated array of selected verse numbers
    this.emitChanges();
  }

  selectAll(): void {
    this.selectedVerses = new Set<number>(this.versesArray);
    this.emitChanges();
  }

  clearAll(): void {
    this.selectedVerses.clear();
    this.emitChanges();
  }

  private emitChanges(): void {
    // Convert Set to Array for emission
    const selectedArray = Array.from(this.selectedVerses);
    this.versesChange.emit(selectedArray);
  }

  trackByFn(index: number): number {
    return index;
  }
}