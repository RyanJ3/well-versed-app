import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../../core/services/atlas.service';

@Component({
  selector: 'app-scripture-atlas-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scripture-atlas-timeline.component.html',
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
