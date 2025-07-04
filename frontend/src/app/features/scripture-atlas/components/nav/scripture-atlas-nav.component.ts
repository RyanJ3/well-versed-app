import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scripture-atlas-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nav-buttons">
      <button class="nav-btn" (click)="previous.emit()" [disabled]="currentCityIndex === 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>
      <button class="nav-btn primary" (click)="next.emit()">
        Next
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  `,
  styleUrls: ['./scripture-atlas-nav.component.scss']
})
export class ScriptureAtlasNavComponent {
  @Input() currentCityIndex = 0;
  @Input() totalCities = 0;

  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
}
