import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapView } from '@models/journey.models';

@Component({
  selector: 'app-map-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.scss']
})
export class MapControlsComponent {
  @Input() currentSegmentIndex: number = 0;
  @Input() totalSegments: number = 0;
  @Input() currentView: MapView = '3d';
  
  @Output() previousSegment = new EventEmitter<void>();
  @Output() nextSegment = new EventEmitter<void>();
  @Output() viewChange = new EventEmitter<MapView>();
  @Output() resetView = new EventEmitter<void>();
  
  setView(view: MapView) {
    this.viewChange.emit(view);
  }
  
  onPrevious() {
    if (this.currentSegmentIndex > 0) {
      this.previousSegment.emit();
    }
  }
  
  onNext() {
    if (this.currentSegmentIndex < this.totalSegments - 1) {
      this.nextSegment.emit();
    }
  }

  
  onResetView() {
    this.resetView.emit();
  }
}