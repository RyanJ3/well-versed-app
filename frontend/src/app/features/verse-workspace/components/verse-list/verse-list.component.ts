import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceVerse } from '../../models/workspace.models';
import { WorkspaceVerseUtils } from '../../utils/workspace-verse.utils';

@Component({
  selector: 'app-verse-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verse-list.component.html',
  styleUrls: ['./verse-list.component.scss']
})
export class VerseListComponent {
  @Input() verses: WorkspaceVerse[] = [];
  @Input() filteredVerses: WorkspaceVerse[] = [];
  @Input() selectedVerses: Set<string> = new Set();
  @Input() showFullText = true;
  @Input() fontSize = 16;
  @Input() layoutMode: 'grid' | 'single' = 'grid';
  @Input() verseReviewData: Record<string, { lastReviewed: number; strength: number }> = {};
  @Input() mode: 'chapter' | 'crossReferences' | 'topical' = 'chapter';
  @Input() isRTL = false;

  @Output() verseClick = new EventEmitter<{ verse: WorkspaceVerse; event: MouseEvent; index: number }>();
  @Output() verseDoubleClick = new EventEmitter<WorkspaceVerse>();
  @Output() verseContextMenu = new EventEmitter<{ verse: WorkspaceVerse; event: MouseEvent }>();
  @Output() verseMouseDown = new EventEmitter<number>();
  @Output() verseMouseEnter = new EventEmitter<number>();
  @Output() verseMouseUp = new EventEmitter<void>();

  Math = Math;
  verseUtils = WorkspaceVerseUtils;

  isVerseSelected(verse: WorkspaceVerse): boolean {
    return this.selectedVerses.has(verse.verseCode);
  }

  needsReview(verseCode: string): boolean {
    return WorkspaceVerseUtils.needsReview(verseCode, this.verseReviewData);
  }

  getVerseDisplay(verse: WorkspaceVerse): string {
    return WorkspaceVerseUtils.getVerseDisplay(verse, this.showFullText);
  }

  getVerseClasses(verse: WorkspaceVerse): string {
    return WorkspaceVerseUtils.getVerseClasses(
      verse,
      this.isVerseSelected(verse),
      this.needsReview(verse.verseCode)
    );
  }

  isNewParagraph(verse: WorkspaceVerse): boolean {
    return WorkspaceVerseUtils.isNewParagraph(verse);
  }

  onVerseClick(verse: WorkspaceVerse, event: MouseEvent, index: number): void {
    this.verseClick.emit({ verse, event, index });
  }

  onVerseDoubleClick(verse: WorkspaceVerse): void {
    this.verseDoubleClick.emit(verse);
  }

  onVerseContextMenu(verse: WorkspaceVerse, event: MouseEvent): void {
    this.verseContextMenu.emit({ verse, event });
  }

  onVerseMouseDown(index: number): void {
    this.verseMouseDown.emit(index);
  }

  onVerseMouseEnter(index: number): void {
    this.verseMouseEnter.emit(index);
  }

  onVerseMouseUp(): void {
    this.verseMouseUp.emit();
  }
}