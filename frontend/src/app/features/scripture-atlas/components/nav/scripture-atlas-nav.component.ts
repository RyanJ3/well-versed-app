import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scripture-atlas-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scripture-atlas-nav.component.html',
  styleUrls: ['./scripture-atlas-nav.component.scss']
})
export class ScriptureAtlasNavComponent {
  @Input() currentCityIndex = 0;
  @Input() totalCities = 0;

  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
}
