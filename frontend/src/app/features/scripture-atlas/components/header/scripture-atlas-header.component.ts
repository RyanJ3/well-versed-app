import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Journey } from '../../../../core/services/atlas.service';
import { ScriptureAtlasTimelineComponent } from '../timeline/scripture-atlas-timeline.component';

@Component({
  selector: 'app-scripture-atlas-header',
  standalone: true,
  imports: [CommonModule, FormsModule, ScriptureAtlasTimelineComponent],
  templateUrl: './scripture-atlas-header.component.html',
  styleUrls: ['./scripture-atlas-header.component.scss']
})
export class ScriptureAtlasHeaderComponent {
  @Input() journeys: Journey[] = [];
  @Input() selectedJourneyId: number | null = null;
  @Input() selectedJourney?: Journey;
  @Input() currentDistance = 0;
  @Input() currentCityIndex = 0;
  @Input() totalCities = 0;
  @Input() memorizedCount = 0;
  @Input() progressPercentage = 0;
  @Input() isPlaying = false;
  @Input() terrainView = false;
  @Input() splitView = false;
  @Input() sidebarOpen = true;
  @Input() cities: any[] = [];
  @Input() memorizedCities: Set<string> = new Set();
  @Input() selectedCityId?: string;

  @Output() journeyChange = new EventEmitter<number>();
  @Output() togglePlayback = new EventEmitter<void>();
  @Output() toggleTerrain = new EventEmitter<void>();
  @Output() toggleSplit = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() citySelected = new EventEmitter<any>();
  @Output() timelineChange = new EventEmitter<number>();

  onJourneyChange() {
    if (this.selectedJourneyId !== null) {
      this.journeyChange.emit(this.selectedJourneyId);
    }
  }
}
