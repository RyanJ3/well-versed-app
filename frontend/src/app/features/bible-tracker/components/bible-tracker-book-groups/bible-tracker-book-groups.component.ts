import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleTestament } from '@models/bible';
import { BibleGroup } from '@models/bible/bible-group.modle';

@Component({
  selector: 'app-bible-tracker-book-groups',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bible-tracker-book-groups.component.html',
  styleUrls: ['./bible-tracker-book-groups.component.scss']
})
export class BibleTrackerBookGroupsComponent {
  @Input() selectedTestament: BibleTestament | null = null;
  @Input() selectedGroup: BibleGroup | null = null;
  @Input() groupColors: { [key: string]: string } = {};
  @Output() groupSelected = new EventEmitter<BibleGroup>();
  
  getGroupColor(groupName: string): string {
    return this.groupColors[groupName] || '#6b7280';
  }
  
  getGroupBooksList(group: BibleGroup): string {
    const bookNames = group.books.slice(0, 3).map((b: any) => b.name).join(', ');
    return group.books.length > 3 ? `${bookNames}...` : bookNames;
  }
  
  selectGroup(group: BibleGroup): void {
    this.groupSelected.emit(group);
  }
}