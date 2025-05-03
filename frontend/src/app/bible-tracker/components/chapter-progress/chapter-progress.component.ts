// components/chapter-progress.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../../shared/components/notification/confirmation-modal';
import { VerseSelectorComponent } from '../verse-selector/verse-selector.component';
import { BibleBook, BibleChapter } from '../../../models/bible.model';
import { BibleService } from '../../../services/bible.service';

@Component({
  selector: 'app-chapter-progress',
  standalone: true,
  imports: [CommonModule, VerseSelectorComponent, ConfirmationModalComponent],
  templateUrl: './chapter-progress.component.html',
  styleUrls: ['./chapter-progress.component.scss'],
})
export class ChapterProgressComponent {
  @Input() selectedChapter: number = 1;
  @Input() selectedChapterIndex: number = 0;
  @Input() chapter: BibleChapter | undefined = undefined;

  // @Output() incrementVersesEvent = new EventEmitter<void>();
  // @Output() decrementVersesEvent = new EventEmitter<void>();
  @Output() updateProgress = new EventEmitter<number[]>();
  @Output() resetChapter = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;
  currentBook: BibleBook | undefined = undefined;

  constructor(private bibleService: BibleService) {
    this.chapter = this.bibleService.getBible().getBook("Psalms")?.chapters[22]; // Default to first chapter of Psalms or fallback
    this.currentBook = this.bibleService.getBible().getBook("Psalms"); // Default to first chapter of Psalms or fallback
  }

  get totalVerses(): number {
    return this.chapter?.totalVerses || 0;
  }

  get memorizedCount(): number {
    return this.chapter?.memorizedVerses || 0;
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
