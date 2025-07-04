import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../core/services/atlas.service';

@Component({
  selector: 'app-scripture-atlas-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-bar">
      <div class="timeline-track">
        <div class="timeline-progress" [style.width.%]="progress"></div>
        <div class="timeline-markers">
          <div *ngFor="let city of cities; index as i"
            class="timeline-marker"
            [class.visited]="i <= currentIndex"
            [class.active]="selectedCityId === city.id"
            [class.memorized]="memorizedCities.has(city.id)"
            [style.left.%]="(i / (cities.length - 1)) * 100"
            (click)="cityClick.emit(city)"
            [title]="city.name">
            <div class="marker-dot"></div>
            <div class="marker-label">{{ i + 1 }}</div>
          </div>
        </div>
        <input type="range" class="timeline-slider" min="0" 
          [max]="cities.length - 1" [value]="currentIndex"
          (input)="onTimelineChange($event)" />
      </div>
    </div>
  `,
  styles: [`
    .timeline-bar {
      height: 32px;
      padding: 0 1.5rem;
      background: #f9fafb;
      display: flex;
      align-items: center;
    }

    .timeline-track {
      position: relative;
      width: 100%;
      height: 20px;
    }

    .timeline-progress {
      position: absolute;
      top: 9px;
      left: 0;
      height: 2px;
      background: #6366f1;
      transition: width 0.5s ease;
    }

    .timeline-markers {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .timeline-marker {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      cursor: pointer;
      transition: all 0.2s;
    }

    .timeline-marker .marker-dot {
      width: 8px;
      height: 8px;
      margin: 6px auto 0;
      background: white;
      border: 2px solid #d1d5db;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .timeline-marker .marker-label {
      display: none;
      font-size: 0.625rem;
      color: #4b5563;
      text-align: center;
      margin-top: 2px;
    }

    .timeline-marker:hover .marker-dot {
      transform: scale(1.5);
      border-color: #6366f1;
    }

    .timeline-marker.visited .marker-dot {
      background: #6366f1;
      border-color: #6366f1;
    }

    .timeline-marker.active .marker-dot {
      transform: scale(1.75);
      background: #ef4444;
      border-color: #ef4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
    }

    .timeline-marker.active .marker-label {
      display: block;
      color: #ef4444;
      font-weight: 600;
    }

    .timeline-marker.memorized .marker-dot {
      background: #10b981;
      border-color: #10b981;
    }

    .timeline-slider {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 20px;
      opacity: 0;
      cursor: pointer;
      z-index: 10;
    }
  `]
})
export class ScriptureAtlasTimelineComponent {
  @Input() cities: City[] = [];
  @Input() currentIndex = 0;
  @Input() selectedCityId: string | null = null;
  @Input() memorizedCities = new Set<string>();
  @Input() progress = 0;

  @Output() cityClick = new EventEmitter<City>();
  @Output() indexChange = new EventEmitter<number>();

  onTimelineChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const index = parseInt(target.value);
    if (index >= 0 && index < this.cities.length) {
      this.indexChange.emit(index);
    }
  }
}