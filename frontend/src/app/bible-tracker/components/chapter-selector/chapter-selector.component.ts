// components/chapter-selector.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgForOf } from '@angular/common';
import { BibleBook, BibleChapter } from '../../../models/bible.model';
import { BaseBibleComponent } from '../../base-bible.component';

@Component({
  selector: 'app-chapter-selector',
  standalone: true,
  imports: [FormsModule, NgClass, NgForOf],
  templateUrl: './chapter-selector.component.html',
  styleUrls: ['./chapter-selector.component.scss'],
})
export class ChapterSelectorComponent extends BaseBibleComponent {
  @Input() selectedChapter: BibleChapter;

  @Output() chapterSelect = new EventEmitter<BibleChapter>();
  @Input() currentBook: BibleBook;

  constructor() {
    super();

    this.selectedChapter = this.getDefaultChapter();
    this.currentBook = this.getDefaultBook();
  }


  onChapterSelect(): void {
    this.chapterSelect.emit(this.selectedChapter);
  }

  selectChapter(chapterNumber: BibleChapter): void {
    this.selectedChapter = chapterNumber;
    this.chapterSelect.emit(chapterNumber);
  }

}
