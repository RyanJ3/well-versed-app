// components/verse-selector.component.ts
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { BibleChapter, BibleVerse } from '../../../models/bible.model';
import { BaseBibleComponent } from '../../base-bible.component';

@Component({
  selector: 'app-verse-selector',
  standalone: true,
  imports: [NgClass, NgFor],
  templateUrl: './verse-selector.component.html',
  styleUrls: ['./verse-selector.component.scss'],
})
export class VerseSelectorComponent extends BaseBibleComponent {

  @Input() selectedChapter: BibleChapter | undefined;

  get versesArray(): BibleVerse[] {
    return this.selectedChapter?.verses || [];
  }

  selectAll(): void {
    this.selectedChapter?.markAllVersesAsMemorized();
  }

  clearAll(): void {
    this.selectedChapter?.markAllVersesAsMemorized();
  }

}