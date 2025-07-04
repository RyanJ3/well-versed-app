import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, transition, animate } from '@angular/animations';
import { interval, Subscription } from 'rxjs';
import { AtlasService, Journey, City } from '../../core/services/atlas.service';
import { ScriptureAtlasHeaderComponent } from './scripture-atlas-header.component';
import { ScriptureAtlasTimelineComponent } from './scripture-atlas-timeline.component';
import { ScriptureAtlasSidebarComponent } from './scripture-atlas-sidebar.component';
import { ScriptureAtlasMapComponent } from './scripture-atlas-map.component';

@Component({
  selector: 'app-scripture-atlas',
  standalone: true,
  imports: [
    CommonModule,
    ScriptureAtlasHeaderComponent,
    ScriptureAtlasTimelineComponent,
    ScriptureAtlasSidebarComponent,
    ScriptureAtlasMapComponent
  ],
  template: `
    <div class="atlas-container">
      <app-scripture-atlas-header
        [journeys]="journeys"
        [selectedJourneyId]="selectedJourneyId"
        [yearRange]="yearRange"
        [scriptureRefs]="selectedJourney?.scripture_refs || ''"
        [currentDistance]="currentDistance"
        [currentIndex]="currentCityIndex"
        [totalCities]="cities.length"
        [memorizedCount]="memorized.size"
        [progressPercentage]="getProgressPercentage()"
        [isPlaying]="isPlaying"
        [terrainView]="terrainView"
        [splitView]="splitView"
        [sidebarOpen]="sidebarOpen"
        (journeyChange)="onJourneyChange($event)"
        (playToggle)="toggleJourneyPlayback()"
        (terrainToggle)="terrainView = !terrainView"
        (splitToggle)="splitView = !splitView"
        (sidebarToggle)="sidebarOpen = !sidebarOpen"
      ></app-scripture-atlas-header>

      <app-scripture-atlas-timeline
        [cities]="cities"
        [currentIndex]="currentCityIndex"
        [selectedCityId]="selectedCity?.id || null"
        [memorizedCities]="memorized"
        [progress]="timelineProgress"
        (cityClick)="selectCity($event)"
        (indexChange)="onTimelineIndexChange($event)"
      ></app-scripture-atlas-timeline>

      <div class="atlas-main">
        <app-scripture-atlas-sidebar
          [isOpen]="sidebarOpen"
          [selectedCity]="selectedCity"
          [isMemorized]="selectedCity ? memorized.has(selectedCity.id) : false"
          [isRead]="selectedCity ? versesRead.has(selectedCity.id) : false"
          (close)="sidebarOpen = false"
          (memorizeToggle)="toggleMemorized($event)"
          (markRead)="markVersesAsRead($event)"
        ></app-scripture-atlas-sidebar>

        <app-scripture-atlas-map
          [cities]="cities"
          [selectedCity]="selectedCity"
          [currentIndex]="currentCityIndex"
          [memorizedCities]="memorized"
          [splitView]="splitView"
          [terrainView]="terrainView"
          [isPlaying]="isPlaying"
          [progress]="timelineProgress"
          (citySelect)="selectCity($event)"
          (previousCity)="previousCity()"
          (nextCity)="nextCity()"
        ></app-scripture-atlas-map>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    :host-context(body) {
      overflow: hidden;
    }

    .atlas-container {
      width: 100%;
      height: calc(100vh - 56px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      position: relative;
      top: 56px;
    }

    .atlas-main {
      position: relative;
      flex: 1;
      display: flex;
      overflow: hidden;
      min-height: 0;
    }

    app-scripture-atlas-sidebar {
      flex-shrink: 0;
    }

    app-scripture-atlas-map {
      flex: 1;
      min-width: 0;
      height: 100%;
    }

    @media (max-width: 768px) {
      .atlas-main {
        flex: 1;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class ScriptureAtlasComponent implements OnInit, OnDestroy {
  cities: City[] = [];
  journeys: Journey[] = [];
  selectedJourneyId: number | null = null;
  selectedJourney: Journey | undefined;
  
  memorized = new Set<string>();
  versesRead = new Set<string>();
  selectedCity: City | null = null;
  currentCityIndex = 0;
  currentDistance = 0;
  timelineProgress = 0;
  yearRange = '';
  
  isPlaying = false;
  terrainView = false;
  splitView = false;
  sidebarOpen = true;
  
  playbackInterval?: Subscription;
  distances: number[] = [];

  constructor(private atlasService: AtlasService) {}

  ngOnInit() {
    const savedMemorized = localStorage.getItem('scripture-atlas-memorized');
    if (savedMemorized) {
      this.memorized = new Set(JSON.parse(savedMemorized));
    }

    const savedVersesRead = localStorage.getItem('scripture-atlas-verses-read');
    if (savedVersesRead) {
      this.versesRead = new Set(JSON.parse(savedVersesRead));
    }

    this.atlasService.getJourneys().subscribe((js) => {
      this.journeys = js;
      if (js.length) {
        this.selectedJourneyId = js[0].id;
        this.loadJourney(js[0].id);
      }
    });
  }

  ngOnDestroy() {
    if (this.playbackInterval) {
      this.playbackInterval.unsubscribe();
    }
  }

  onJourneyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const id = parseInt(target.value);
    if (id) {
      this.selectedJourneyId = id;
      this.loadJourney(id);
    }
  }

  loadJourney(id: number) {
    if (id == null) return;
    
    this.atlasService.getJourney(id).subscribe((detail) => {
      this.cities = detail.cities;
      this.distances = this.cities.map((c) => c.distance);
      this.selectedJourney = this.journeys.find(j => j.id === id);
      this.yearRange = this.formatYearRange(this.selectedJourney?.start_year, this.selectedJourney?.end_year);
      
      if (this.cities.length) {
        this.selectCity(this.cities[0]);
      }
    });
  }

  selectCity(city: City) {
    this.selectedCity = city;
    this.currentCityIndex = this.cities.indexOf(city);
    this.currentDistance = this.distances[this.currentCityIndex];
    this.timelineProgress = (this.currentCityIndex / (this.cities.length - 1)) * 100;
  }

  onTimelineIndexChange(index: number) {
    if (index >= 0 && index < this.cities.length) {
      this.selectCity(this.cities[index]);
    }
  }

  toggleJourneyPlayback() {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  private startPlayback() {
    this.isPlaying = true;
    this.currentCityIndex = 0;
    this.selectCity(this.cities[0]);

    this.playbackInterval = interval(3000).subscribe(() => {
      if (this.currentCityIndex < this.cities.length - 1) {
        this.currentCityIndex++;
        this.selectCity(this.cities[this.currentCityIndex]);
      } else {
        this.stopPlayback();
      }
    });
  }

  private stopPlayback() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      this.playbackInterval.unsubscribe();
    }
  }

  toggleMemorized(cityId: string) {
    if (this.memorized.has(cityId)) {
      this.memorized.delete(cityId);
    } else {
      this.memorized.add(cityId);
    }

    localStorage.setItem(
      'scripture-atlas-memorized',
      JSON.stringify(Array.from(this.memorized))
    );
  }

  markVersesAsRead(cityId: string) {
    this.versesRead.add(cityId);
    localStorage.setItem(
      'scripture-atlas-verses-read',
      JSON.stringify(Array.from(this.versesRead))
    );
  }

  previousCity() {
    if (this.currentCityIndex > 0) {
      this.selectCity(this.cities[this.currentCityIndex - 1]);
    }
  }

  nextCity() {
    if (this.currentCityIndex < this.cities.length - 1) {
      this.selectCity(this.cities[this.currentCityIndex + 1]);
    } else {
      this.selectCity(this.cities[0]);
    }
  }

  getProgressPercentage(): number {
    return Math.round((this.memorized.size / this.cities.length) * 100);
  }

  formatYear(year: number | undefined): string {
    if (year == null) return '';
    return year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
  }

  formatYearRange(start?: number, end?: number): string {
    if (start == null || end == null) return '';
    const startStr = this.formatYear(start);
    const endStr = this.formatYear(end);
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
  }
}