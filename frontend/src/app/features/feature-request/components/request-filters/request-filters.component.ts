import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-request-filters',
  templateUrl: './request-filters.component.html',
  styleUrls: ['./request-filters.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RequestFiltersComponent {
  @Input() searchQuery: string = '';
  @Input() selectedType: string = '';
  @Input() selectedStatus: string = '';
  @Input() sortBy: string = 'upvotes';
  
  @Output() searchChange = new EventEmitter<string>();
  @Output() typeChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<void>();

  onSearchChange(): void {
    this.searchChange.emit(this.searchQuery);
  }

  onTypeChange(): void {
    this.typeChange.emit(this.selectedType);
    this.filterChange.emit();
  }

  onStatusChange(): void {
    this.statusChange.emit(this.selectedStatus);
    this.filterChange.emit();
  }

  onSortChange(): void {
    this.sortChange.emit(this.sortBy);
    this.filterChange.emit();
  }
}
