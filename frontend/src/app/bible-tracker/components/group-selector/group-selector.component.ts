// components/group-selector.component.ts - Enhanced version
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BIBLE_DATA } from '../../models';
import { BibleTrackerService } from '../../bible-tracker-service';
import { ConfirmationModalComponent } from '../../../shared/components/notification/confirmation-modal';

@Component({
  selector: 'app-group-selector',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './group-selector.component.html',
  styleUrls: ['./group-selector.component.scss'],
})
export class GroupSelectorComponent {
  @Input() availableGroups: string[] = [];
  @Input() selectedGroup: string = '';
  @Input() selectedTestament: string = '';

  @Output() groupChange = new EventEmitter<string>();
  @Output() resetGroup = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;

  constructor(private bibleTrackerService: BibleTrackerService) {}

  selectGroup(group: string): void {
    this.groupChange.emit(group);
  }

  showConfirmModal(): void {
    this.isConfirmModalVisible = true;
  }

  confirmReset(): void {
    this.resetGroup.emit();
    this.isConfirmModalVisible = false;
  }

  cancelReset(): void {
    this.isConfirmModalVisible = false;
  }

  getGroupStats(group: string): {
    percentComplete: number;
    completedChapters: number;
    totalChapters: number;
  } {
    return this.bibleTrackerService.calculateGroupStats(group);
  }

  getGroupBookCount(group: string): number {
    return Object.values(BIBLE_DATA).filter((book) => book.group === group)
      .length;
  }

  getGroupTotalVerses(group: string): number {
    return Object.values(BIBLE_DATA)
      .filter((book) => book.group === group)
      .reduce((sum, book) => sum + book.totalVerses, 0);
  }

  getTopBooksInGroup(group: string, count: number): string[] {
    return Object.entries(BIBLE_DATA)
      .filter(([_, book]) => book.group === group)
      .sort((a, b) => a[1].order - b[1].order)
      .slice(0, count)
      .map(([name, _]) => name);
  }

  // Shorten book names for chips display
  getShortBookName(bookName: string): string {
    // Handle special cases
    if (bookName.startsWith('1 '))
      return '1' + bookName.split(' ')[1].substring(0, 3);
    if (bookName.startsWith('2 '))
      return '2' + bookName.split(' ')[1].substring(0, 3);
    if (bookName.startsWith('3 '))
      return '3' + bookName.split(' ')[1].substring(0, 3);

    // For Song of Solomon and other long names
    if (bookName === 'Song of Solomon') return 'Song';

    // For normal books, just use the first 5 characters or the whole name if shorter
    return bookName.length > 5 ? bookName.substring(0, 5) : bookName;
  }
}
