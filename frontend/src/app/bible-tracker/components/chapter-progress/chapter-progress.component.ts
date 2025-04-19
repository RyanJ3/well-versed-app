// components/chapter-progress.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BIBLE_DATA, BibleBook, BibleData, ChapterProgress } from '../models';
import { CommonModule } from '@angular/common';
import { VerseSelectorComponent } from './verse-selector.component';
import { ConfirmationModalComponent } from '../../shared/components/notification/confirmation-modal';

@Component({
  selector: 'app-chapter-progress',
  standalone: true,
  imports: [CommonModule, VerseSelectorComponent, ConfirmationModalComponent],
  templateUrl: './chapter-progress.component.html',
  styleUrls: ['./chapter-progress.component.scss'],
})
export class ChapterProgressComponent {
  @Input() currentBook: BibleBook = BIBLE_DATA.getBookByName('Psalms');
  @Input() selectedChapter: number = 1;
  @Input() selectedChapterIndex: number = 0;
  @Input() chapterProgress: ChapterProgress =
    this.currentBook.getChapterProgress(this.selectedChapter);

  @Output() incrementVersesEvent = new EventEmitter<void>();
  @Output() decrementVersesEvent = new EventEmitter<void>();
  @Output() updateProgress = new EventEmitter<number[]>();
  @Output() resetChapter = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;

  get totalVerses(): number {
    if (
      !this.currentBook ||
      this.selectedChapterIndex < 0 ||
      this.selectedChapterIndex >= this.currentBook.chapters.length
    ) {
      return 0;
    }
    return this.currentBook.chapters[this.selectedChapterIndex];
  }

  get memorizedCount(): number {
    return this.chapterProgress?.versesMemorized?.filter((v) => v).length || 0;
  }

  get progressPercent(): number {
    if (!this.totalVerses) return 0;
    return Math.round((this.memorizedCount / this.totalVerses) * 100);
  }

  onVersesChange(versesMemorized: boolean[]): void {
    // Convert boolean array to list of verse numbers for API compatibility
    const selectedVerses = versesMemorized
      .map((isMemorized, index) => (isMemorized ? index + 1 : null))
      .filter((v) => v !== null) as number[];

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
