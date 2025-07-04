import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Journey } from '../../../core/services/atlas.service';

@Component({
  selector: 'app-scripture-atlas-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scripture-atlas-header.component.html',
})
export class ScriptureAtlasHeaderComponent {
  @Input() journeys: Journey[] = [];
  @Input() selectedJourneyId: number | null = null;
  @Input() selectedJourney: Journey | undefined;
  @Input() isPlaying = false;
  @Input() terrainView = false;
  @Input() splitView = false;
  @Input() sidebarOpen = true;
  @Input() timelineProgress = 0;
  @Input() currentCityIndex = 0;
  @Input() citiesLength = 0;
  @Input() memorizedCount = 0;
  @Input() progressPercentage = 0;
  @Input() currentDistance = 0;

  @Output() journeyChange = new EventEmitter<number>();
  @Output() togglePlayback = new EventEmitter<void>();
  @Output() toggleTerrain = new EventEmitter<void>();
  @Output() toggleSplit = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();

  @Output() timelineChange = new EventEmitter<number>();

  formatYear(year: number | undefined): string {
    if (year == null) {
      return '';
    }
    return year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
  }

  formatYearRange(start?: number, end?: number): string {
    if (start == null || end == null) {
      return '';
    }
    const startStr = this.formatYear(start);
    const endStr = this.formatYear(end);
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
  }
}
