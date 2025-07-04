import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Journey } from '../../../core/services/atlas.service';

@Component({
  selector: 'app-scripture-atlas-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="atlas-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="main-title">
            <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <select
              class="journey-select"
              name="journey"
              [(ngModel)]="selectedJourneyId"
              [ngModelOptions]="{standalone: true}"
              (change)="onJourneyChange()">
              <option *ngFor="let j of journeys" [ngValue]="j.id">{{ j.name }}</option>
            </select>
          </h1>
          <div class="journey-info">
            <span class="info-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ selectedJourney?.start_year }}-{{ selectedJourney?.end_year }} AD
            </span>
            <span class="info-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {{ selectedJourney?.scripture_refs }}
            </span>
            <span class="info-badge highlight">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <strong>{{ currentDistance }}</strong> miles
            </span>
          </div>
        </div>

        <div class="header-right">
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-value">{{ currentCityIndex + 1 }}</span>
              <span class="stat-label">of {{ totalCities }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ memorizedCount }}</span>
              <span class="stat-label">memorized</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ progressPercentage }}%</span>
              <span class="stat-label">complete</span>
            </div>
          </div>

          <div class="header-controls">
            <button class="control-btn" [class.active]="isPlaying" (click)="togglePlayback.emit()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path *ngIf="!isPlaying" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path *ngIf="!isPlaying" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path *ngIf="isPlaying" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="btn-label">{{ isPlaying ? "Pause" : "Play" }}</span>
            </button>

            <button class="control-btn" [class.active]="terrainView" (click)="toggleTerrain.emit()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="btn-label">Terrain</span>
            </button>

            <button class="control-btn" [class.active]="splitView" (click)="toggleSplit.emit()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <span class="btn-label">Split</span>
            </button>

            <button class="control-btn" [class.active]="sidebarOpen" (click)="toggleSidebar.emit()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="btn-label">Info</span>
            </button>
          </div>
        </div>
      </div>

      <app-scripture-atlas-timeline
        [cities]="cities"
        [currentCityIndex]="currentCityIndex"
        [memorizedCities]="memorizedCities"
        [selectedCityId]="selectedCityId"
        (citySelected)="citySelected.emit($event)"
        (timelineChange)="timelineChange.emit($event)">
      </app-scripture-atlas-timeline>
    </header>
  `,
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
