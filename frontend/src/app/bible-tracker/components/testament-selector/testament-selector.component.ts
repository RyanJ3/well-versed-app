// components/testament-selector.component.ts - Enhanced version with vertical layout
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../../shared/components/notification/confirmation-modal';
import { BibleTrackerService } from '../../bible-tracker-service';
import { BIBLE_DATA } from '../../models';

@Component({
  selector: 'app-testament-selector',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './testament-selector.component.html',
  styleUrls: ['./testament-selector.component.scss'],
})
export class TestamentSelectorComponent {
  @Input() testaments: string[] = [];
  @Input() selectedTestament: string = '';
  @Input() selectedGroup: string = '';

  @Output() testamentChange = new EventEmitter<string>();
  @Output() resetTestament = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;

  constructor(private bibleTrackerService: BibleTrackerService) {}

  selectTestament(testament: string): void {
    this.testamentChange.emit(testament);
  }

  showConfirmModal(): void {
    this.isConfirmModalVisible = true;
  }

  confirmReset(): void {
    this.resetTestament.emit();
    this.isConfirmModalVisible = false;
  }

  cancelReset(): void {
    this.isConfirmModalVisible = false;
  }

  getTestamentStats(testament: string): { percentComplete: number } {
    return this.bibleTrackerService.calculateTestamentStats(testament);
  }

  getTestamentBookCount(testament: string): number {
    return Object.values(BIBLE_DATA).filter(
      (book) => book.testament === testament,
    ).length;
  }

  getTestamentChapterCount(testament: string): number {
    return Object.values(BIBLE_DATA)
      .filter((book) => book.testament === testament)
      .reduce((sum, book) => sum + book.totalChapters, 0);
  }

  getTestamentVerseCount(testament: string): number {
    return Object.values(BIBLE_DATA)
      .filter((book) => book.testament === testament)
      .reduce((sum, book) => sum + book.totalVerses, 0);
  }

  getTestamentGroups(testament: string): string[] {
    return this.bibleTrackerService.getGroupsInTestament(testament);
  }
}
