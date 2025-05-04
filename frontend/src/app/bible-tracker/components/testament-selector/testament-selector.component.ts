// components/testament-selector.component.ts - Enhanced version with vertical layout
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../../shared/components/notification/confirmation-modal';
import { BibleService } from '../../../services/bible.service';
import { TestamentType, BookGroupType, BibleTestament, BibleGroup } from '../../../models/bible.model';
import { BaseBibleComponent } from '../../base-bible.component';

@Component({
  selector: 'app-testament-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testament-selector.component.html',
  styleUrls: ['./testament-selector.component.scss'],
})
export class TestamentSelectorComponent extends BaseBibleComponent {

  @Input() testaments: BibleTestament[] = [];
  @Input() selectedTestament: BibleTestament ;;
  @Input() selectedGroup: BibleGroup ;

  @Output() testamentChange = new EventEmitter<BibleTestament>();
  @Output() resetTestament = new EventEmitter<void>();

  isConfirmModalVisible: boolean = false;

  constructor() {
    super();

    this.selectedTestament = this.getDefaultTestament();
    this.selectedGroup = this.getDefaultGroup();
    this.testaments = this.testaments;
  }

  selectTestament(testament: BibleTestament): void {
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

  filterBookGroups(bibleTestament: BibleTestament) {
    this.testamentChange.emit(bibleTestament);
  }

}