// components/verse-selector.component.ts
import { NgClass, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { BibleStatsComponent } from '../../bible-stats.component';

@Component({
  selector: 'app-verse-selector',
  standalone: true,
  imports: [NgClass, NgFor],
  templateUrl: './verse-selector.component.html',
  styleUrls: ['./verse-selector.component.scss'],
})
export class VerseSelectorComponent extends BibleStatsComponent {

  constructor() {
    super();
  }

  selectAll(): void {
    this.selectedChapter.markAllVersesAsMemorized();
  }

  clearAll(): void {
    this.selectedChapter.verses.forEach(verse => {
      verse.memorized = false;
    });
  }

}