import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../../shared/components/notification/confirmation-modal';
import { BibleService } from '../../../services/bible.service';
import { BibleBook, BibleGroup, BibleTestament, BookGroupType, TestamentType } from '../../../models/bible.model';

@Component({
  selector: 'app-group-selector',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './group-selector.component.html',
  styleUrls: ['./group-selector.component.scss'],
})
export class GroupSelectorComponent {
  // Inputs & Outputs
  @Input() availableGroups: BibleGroup[] = [];
  @Input() selectedGroup: BibleGroup;
  @Input() selectedTestament: string | undefined;
  @Output() groupChange = new EventEmitter<BibleGroup>();
  @Output() resetGroup = new EventEmitter<void>();

  // UI state
  isConfirmModalVisible: boolean = false;

  constructor(private bibleService: BibleService) {
    this.selectedGroup = this.bibleService.getBible().getDefaultGroup(); // Default to first group or fallback
    this.selectedTestament = this.bibleService.getTestament(TestamentType.OLD)?.name; // Default to Old Testament or fallback
  }

  // Group selection handling
  selectGroup(group: BibleGroup): void {
    this.groupChange.emit(group);
  }

  // Group stats and data

  getBooksInGroup(group: string): BibleBook[] {
    return this.bibleService?.getBooksInGroup(group as BookGroupType);
  }

  getGroupBookCount(group: string): number {
    return this.getBooksInGroup(group).length;
  }

  getGroupTotalVerses(group: string): number {
    return this.bibleService.getGroupByName(group)?.totalVerses || 0;
  }

  getTopBooksInGroup(group: string, count: number): string[] {
    return this.getBooksInGroup(group)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, count)
      .map(book => book.name);
  }

  // Book name formatting
  getShortBookName(bookName: string): string {
    if (bookName.startsWith('1 ')) return '1' + bookName.split(' ')[1].substring(0, 3);
    if (bookName.startsWith('2 ')) return '2' + bookName.split(' ')[1].substring(0, 3);
    if (bookName.startsWith('3 ')) return '3' + bookName.split(' ')[1].substring(0, 3);
    if (bookName === 'Song of Solomon') return 'Song';
    return bookName.length > 5 ? bookName.substring(0, 5) : bookName;
  }

  // Modal handling
  showConfirmModal = () => this.isConfirmModalVisible = true;
  confirmReset = () => { this.resetGroup.emit(); this.isConfirmModalVisible = false; };
  cancelReset = () => this.isConfirmModalVisible = false;
}