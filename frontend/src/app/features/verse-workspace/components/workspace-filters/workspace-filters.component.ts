import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceFilterMode } from '../../models/workspace-filter-mode.enum';

@Component({
  selector: 'app-workspace-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace-filters.component.html',
  styleUrls: ['./workspace-filters.component.scss']
})
export class WorkspaceFiltersComponent {
  @Input() activeFilter: WorkspaceFilterMode = WorkspaceFilterMode.ALL;
  @Input() totalVerses = 0;
  @Input() unmemorizedCount = 0;
  @Input() needsReviewCount = 0;
  @Input() showReviewFilter = true;

  @Output() filterChange = new EventEmitter<WorkspaceFilterMode>();

  setFilter(filter: WorkspaceFilterMode) {
    this.filterChange.emit(filter);
  }

  // Expose enum to template
  WorkspaceFilterMode = WorkspaceFilterMode;
}
