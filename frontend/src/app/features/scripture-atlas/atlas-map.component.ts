import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-atlas-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atlas-map.component.html',
  styleUrls: ['./scripture-atlas.component.scss']
})
export class AtlasMapComponent {
  @Input() splitView = false;
  @Input() isPlaying = false;
  @Input() currentCityIndex = 0;
  @Input() citiesLength = 0;
  @Input() timelineProgress = 0;

  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
}
