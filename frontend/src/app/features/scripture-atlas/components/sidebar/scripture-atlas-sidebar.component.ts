import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../../core/services/atlas.service';

@Component({
  selector: 'app-scripture-atlas-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scripture-atlas-sidebar.component.html',
  styleUrls: ['./scripture-atlas-sidebar.component.scss']
})
export class ScriptureAtlasSidebarComponent {
  @Input() isOpen = true;
  @Input() selectedCity: City | null = null;
  @Input() memorizedCities: Set<string> = new Set();
  @Input() readVerses: Set<string> = new Set();

  @Output() closeSidebar = new EventEmitter<void>();
  @Output() toggleMemorized = new EventEmitter<string>();
  @Output() markAsRead = new EventEmitter<string>();

  view: 'scripture' | 'city' = 'scripture';

  get isMemorized(): boolean {
    return this.selectedCity ? this.memorizedCities.has(this.selectedCity.id) : false;
  }

  get isRead(): boolean {
    return this.selectedCity ? this.readVerses.has(this.selectedCity.id) : false;
  }
}
