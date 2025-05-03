import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { BaseBibleComponent } from '../../base-bible.component';
import { BibleService } from '../../../services/bible.service';
import { BibleGroup, BibleTestament, TestamentType } from '../../../models/bible.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-group-selector',
  templateUrl: './group-selector.component.html',
  styleUrls: ['./group-selector.component.scss'],
  imports: [CommonModule]
})
export class GroupSelectorComponent extends BaseBibleComponent implements OnInit {

@Input() testament: string = '';
  @Output() groupChange = new EventEmitter<string>();
  
  availableGroups: BibleGroup[] = [];
  selectedGroup: BibleGroup | null = null;
  
  constructor(protected override bibleService: BibleService) {
    super(bibleService);
  }
  
  override ngOnInit(): void {
    super.ngOnInit(); // Important! This initializes bibleData
  }
  
  // Override this method from BaseBibleComponent to safely use bibleData
  protected override onBibleDataLoaded(): void {
    // Only now is it safe to use bibleData
    // if (this.testament && this.bibleData) {
    //   const testament = this.bibleData?.getTestament(this.testament as TestamentType);
    //   if (testament) {
    //     this.groups = testament.getGroupNames();
    //     this.selectedGroup = testament.getDefaultGroup();
    //     if (this.selectedGroup) {
    //       this.groupChange.emit(this.selectedGroup);
    //     }
    //   }
    // }
  }
  
  onGroupSelected(group: string): void {
    this.groupChange.emit(group);
  }
}