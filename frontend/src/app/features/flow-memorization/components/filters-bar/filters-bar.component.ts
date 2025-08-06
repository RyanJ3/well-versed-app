import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filters-bar.component.html',
  styleUrls: ['./filters-bar.component.scss']
})
export class FiltersBarComponent {
  @Input() activeFilter: 'all' | 'unmemorized' | 'needsReview' | 'sections' = 'all';
  @Input() totalVerses = 0;
  @Input() unmemorizedCount = 0;
  @Input() needsReviewCount = 0;
  @Input() sectionCount = 0;

  @Output() filterChange = new EventEmitter<'all' | 'unmemorized' | 'needsReview' | 'sections'>();

  setFilter(filter: 'all' | 'unmemorized' | 'needsReview' | 'sections') {
    this.filterChange.emit(filter);
  }
}
