import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { AtlasService, Journey, City } from '../../core/services/atlas.service';

// Import sub-components
import { ScriptureAtlasHeaderComponent } from './components/header/scripture-atlas-header.component';
import { ScriptureAtlasSidebarComponent } from './components/sidebar/scripture-atlas-sidebar.component';
import { ScriptureAtlasMapComponent } from './components/map/scripture-atlas-map.component';

@Component({
  selector: 'app-scripture-atlas',
  standalone: true,
  imports: [
    CommonModule,
    ScriptureAtlasHeaderComponent,
    ScriptureAtlasSidebarComponent,
    ScriptureAtlasMapComponent
  ],
  templateUrl: './scripture-atlas.component.html',
  styleUrls: ['./scripture-atlas.component.scss']
})
export class ScriptureAtlasComponent implements OnInit, OnDestroy {
  // Data
  cities: City[] = [];
  journeys: Journey[] = [];
  selectedJourneyId: number | null = null;

  // State
  memorized = new Set<string>();
  versesRead = new Set<string>();
  selectedCity: City | null = null;
  currentCityIndex = 0;
  currentDistance = 0;

  // Features
  isPlaying = false;
  terrainView = false;
  splitView = false;
  sidebarOpen = true;

  // Animation
  playbackInterval?: Subscription;

  // Distance data
  distances: number[] = [];

  get selectedJourney(): Journey | undefined {
    if (this.selectedJourneyId == null) return undefined;
    return this.journeys.find(j => j.id === this.selectedJourneyId);
  }

  constructor(private atlasService: AtlasService) {}

  ngOnInit() {
    this.loadSavedProgress();
    console.debug('Initializing ScriptureAtlasComponent');
    this.loadJourneys();
  }

  ngOnDestroy() {
    if (this.playbackInterval) {
      this.playbackInterval.unsubscribe();
    }
  }

  private loadSavedProgress() {
    const savedMemorized = localStorage.getItem('scripture-atlas-memorized');
    if (savedMemorized) {
      this.memorized = new Set(JSON.parse(savedMemorized));
    }

    const savedVersesRead = localStorage.getItem('scripture-atlas-verses-read');
    if (savedVersesRead) {
      this.versesRead = new Set(JSON.parse(savedVersesRead));
    }
  }

  private loadJourneys() {
    console.debug('Requesting list of journeys');
    this.atlasService.getJourneys().subscribe(js => {
      console.debug('Received journeys', js.length);
      this.journeys = js;
      if (js.length) {
        this.selectedJourneyId = js[0].id;
        this.loadJourney(js[0].id);
      }
    });
  }

  loadJourney(id: number) {
    if (id == null) return;
    console.debug('Loading journey', id);

    this.atlasService.getJourney(id).subscribe(detail => {
      this.cities = detail.cities;
      this.distances = this.cities.map(c => c.distance);
      console.debug('Loaded journey details, cities count', this.cities.length);

      if (this.cities.length) {
        this.selectCity(this.cities[0]);
      }
    });
  }

  selectCity(city: City) {
    this.selectedCity = city;
    this.currentCityIndex = this.cities.indexOf(city);
    this.currentDistance = this.distances[this.currentCityIndex];
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

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
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

  onTimelineChange(index: number) {
    if (index >= 0 && index < this.cities.length) {
      this.selectCity(this.cities[index]);
    }
  }

  getProgressPercentage(): number {
    return Math.round((this.memorized.size / this.cities.length) * 100);
  }
}
