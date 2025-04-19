// components/chapter-selector.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgForOf } from '@angular/common';
import { ChapterProgress } from '../../models';

@Component({
  selector: 'app-chapter-selector',
  standalone: true,
  imports: [FormsModule, NgClass, NgForOf],
  templateUrl: './chapter-selector.component.html',
  styleUrls: ['./chapter-selector.component.scss'],
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
