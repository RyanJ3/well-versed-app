import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BiblicalJourney } from '../../models/journey.models';

@Component({
  selector: 'app-atlas-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atlas-header.component.html',
  styleUrls: ['./atlas-header.component.scss']
})
export class AtlasHeaderComponent {
  @Input() journeys: BiblicalJourney[] | null = [];
  @Input() currentJourney: BiblicalJourney | null = null;
  @Input() testament: 'Old Testament' | 'New Testament' = 'Old Testament';
  @Input() currentView: '2d' | '3d' | 'historical' = '2d';
  @Input() currentSegmentIndex = 0;
  @Input() totalSegments = 0;
  @Input() collapsed = false;
  
  @Output() testamentChange = new EventEmitter<'Old Testament' | 'New Testament'>();
  @Output() journeyChange = new EventEmitter<string>();
  @Output() viewChange = new EventEmitter<'2d' | '3d' | 'historical'>();
  @Output() previousSegment = new EventEmitter<void>();
  @Output() nextSegment = new EventEmitter<void>();
  @Output() resetView = new EventEmitter<void>();
  @Output() togglePanel = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();
  
  showJourneyDropdown = false;
  
  get progressPercentage(): number {
    if (this.totalSegments === 0) return 0;
    return ((this.currentSegmentIndex + 1) / this.totalSegments) * 100;
  }
  
  selectTestament(testament: 'Old Testament' | 'New Testament'): void {
    this.testamentChange.emit(testament);
  }
  
  onJourneySelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.journeyChange.emit(select.value);
    }
  }
  
  setView(view: '2d' | '3d' | 'historical'): void {
    this.viewChange.emit(view);
  }
  
  onPrevious(): void {
    this.previousSegment.emit();
  }
  
  onNext(): void {
    this.nextSegment.emit();
  }
  
  onReset(): void {
    this.resetView.emit();
  }
  
  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
  
  toggleJourneyPanel(): void {
    this.togglePanel.emit();
  }
}