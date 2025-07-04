import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../../core/services/atlas.service';

@Component({
  selector: 'app-scripture-atlas-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-bar">
      <div class="timeline-track">
        <div class="timeline-progress" [style.width.%]="timelineProgress"></div>
        <div class="timeline-markers">
          <div
            *ngFor="let city of cities; index as i"
            class="timeline-marker"
            [class.visited]="i <= currentCityIndex"
            [class.active]="selectedCityId === city.id"
            [class.memorized]="memorizedCities.has(city.id)"
            [style.left.%]="(i / (cities.length - 1)) * 100"
            (click)="selectCity(city)"
            [title]="city.name">
            <div class="marker-dot"></div>
            <div class="marker-label">{{ i + 1 }}</div>
          </div>
        </div>
        <input
          type="range"
          class="timeline-slider"
          min="0"
          [max]="cities.length - 1"
          [value]="currentCityIndex"
          (input)="onSliderChange($event)" />
      </div>
    </div>
  `,
  styleUrls: ['./scripture-atlas-timeline.component.scss']
})
export class ScriptureAtlasTimelineComponent {
  @Input() cities: City[] = [];
  @Input() currentCityIndex = 0;
  @Input() memorizedCities: Set<string> = new Set();
  @Input() selectedCityId?: string;

  @Output() citySelected = new EventEmitter<City>();
  @Output() timelineChange = new EventEmitter<number>();

  get timelineProgress(): number {
    if (this.cities.length <= 1) return 0;
    return (this.currentCityIndex / (this.cities.length - 1)) * 100;
  }

  selectCity(city: City) {
    this.citySelected.emit(city);
  }

  onSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const index = parseInt(target.value);
    this.timelineChange.emit(index);
  }
}
