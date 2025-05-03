// components/chapter-selector.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgForOf } from '@angular/common';
import { BibleChapter } from '../../../models/bible.model';

@Component({
  selector: 'app-chapter-selector',
  standalone: true,
  imports: [FormsModule, NgClass, NgForOf],
  templateUrl: './chapter-selector.component.html',
  styleUrls: ['./chapter-selector.component.scss'],
})
export class ChapterSelectorComponent {
  @Input() currentBookProgress: BibleChapter[] = [];
  @Input() selectedChapter: number = 1;

  @Output() chapterSelect = new EventEmitter<number>();

  onChapterSelect(): void {
    this.chapterSelect.emit(this.selectedChapter);
  }

  selectChapter(chapterNumber: number): void {
    this.selectedChapter = chapterNumber;
    this.chapterSelect.emit(chapterNumber);
  }

  get currentBookProgressCount(): number {
    return this.currentBookProgress.length;
  }
}
