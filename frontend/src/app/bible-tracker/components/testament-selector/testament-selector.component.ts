// components/testament-selector.component.ts - Enhanced version with vertical layout
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../../shared/components/notification/confirmation-modal';
import { BibleService } from '../../../services/bible.service';
import { TestamentType, BookGroupType, BibleTestament } from '../../../models/bible.model';

@Component({
  selector: 'app-testament-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testament-selector.component.html',
  styleUrls: ['./testament-selector.component.scss'],
})
export class TestamentSelectorComponent {
  @Input() testaments: TestamentType[] = [];
  @Input() selectedTestament: TestamentType = TestamentType.OLD;
  @Input() selectedGroup: BookGroupType = BookGroupType.LAW;

  @Output() testamentChange = new EventEmitter<TestamentType>();
  @Output() resetTestament = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;

  constructor(private bibleService: BibleService) {}

  selectTestament(testament: TestamentType): void {
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

  getTestamentStats(testament: TestamentType): { percentComplete: number } {
    return this.bibleService.calculateTestamentStats(testament);
  }

  getTestamentBookCount(testament: TestamentType): number {
    return this.bibleService.getTestamentBookCount(testament);
  }

  getTestamentChapterCount(testament: TestamentType): number {
    return this.bibleService.getTestamentChapterCount(testament);
  }

  getTestamentVerseCount(testament: TestamentType): number {
    const testamentObj = this.bibleService.getTestament(testament);
    return testamentObj?.totalVerses || 0;
  }

  getTestamentMemorizedVerseCount(testament: TestamentType): number {
    const testamentObj = this.bibleService.getTestament(testament);
    return testamentObj?.memorizedVerses || 0;
  }

  getTestamentGroups(testament: TestamentType): BookGroupType[] {
    return this.bibleService.getGroupsInTestament(testament);
  }
}