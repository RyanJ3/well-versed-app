import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Journey, City } from '../../core/services/atlas.service';

@Component({
  selector: 'app-atlas-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './atlas-header.component.html',
  styleUrls: ['./scripture-atlas.component.scss']
})
export class AtlasHeaderComponent {
  @Input() journeys: Journey[] = [];
  @Input() selectedJourneyId: number | null = null;
  @Input() selectedJourney: Journey | undefined;
  @Input() currentDistance = 0;
  @Input() currentCityIndex = 0;
  @Input() cities: City[] = [];
  @Input() memorized: Set<string> = new Set();
  @Input() timelineProgress = 0;
  @Input() isPlaying = false;
  @Input() terrainView = false;
  @Input() splitView = false;
  @Input() sidebarOpen = true;

  @Output() journeyChange = new EventEmitter<number>();
  @Output() togglePlayback = new EventEmitter<void>();
  @Output() toggleTerrain = new EventEmitter<void>();
  @Output() toggleSplit = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() selectCity = new EventEmitter<City>();
  @Output() timelineChange = new EventEmitter<number>();

  getProgressPercentage(): number {
    return this.cities.length
      ? Math.round((this.memorized.size / this.cities.length) * 100)
      : 0;
  }

  onTimelineChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.timelineChange.emit(value);
  }
}
