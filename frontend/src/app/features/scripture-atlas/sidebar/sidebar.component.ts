import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../core/services/atlas.service';

@Component({
  selector: 'app-atlas-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class AtlasSidebarComponent {
  @Input() selectedCity: City | null = null;
  @Input() sidebarOpen = true;
  @Input() sidebarView: 'scripture' | 'city' = 'scripture';
  @Input() memorized = new Set<string>();
  @Input() versesRead = new Set<string>();
  @Input() currentScriptureText = '';

  @Output() closeSidebar = new EventEmitter<void>();
  @Output() toggleMemorized = new EventEmitter<string>();
  @Output() markVersesRead = new EventEmitter<void>();
  @Output() sidebarViewChange = new EventEmitter<'scripture' | 'city'>();
}
