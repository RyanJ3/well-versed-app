import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-workspace-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace-filters.component.html',
  styleUrls: ['./workspace-filters.component.scss']
})
export class WorkspaceFiltersComponent {
  @Input() activeFilter: 'all' | 'unmemorized' | 'needsReview' = 'all';
  @Input() totalVerses = 0;
  @Input() unmemorizedCount = 0;
  @Input() needsReviewCount = 0;
  @Input() mode: 'memorization' | 'crossReferences' | 'topical' = 'memorization';
  @Input() showReviewFilter = true;

  @Output() filterChange = new EventEmitter<'all' | 'unmemorized' | 'needsReview'>();
  @Output() modeChange = new EventEmitter<'memorization' | 'crossReferences' | 'topical'>();

  setFilter(filter: 'all' | 'unmemorized' | 'needsReview') {
    this.filterChange.emit(filter);
  }
  
  setMode(mode: 'memorization' | 'crossReferences' | 'topical') {
    this.modeChange.emit(mode);
  }
}
