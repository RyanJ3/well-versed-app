import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../core/services/atlas.service';

@Component({
  selector: 'app-scripture-atlas-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scripture-atlas-sidebar.component.html',
})
export class ScriptureAtlasSidebarComponent {
  @Input() sidebarOpen = true;
  @Input() sidebarView: 'scripture' | 'city' = 'scripture';
  @Input() selectedCity: City | null = null;
  @Input() memorized = new Set<string>();
  @Input() versesRead = new Set<string>();
  @Input() currentScriptureText = '';

  @Output() sidebarViewChange = new EventEmitter<'scripture' | 'city'>();
  @Output() close = new EventEmitter<void>();
  @Output() toggleMemorized = new EventEmitter<string>();
  @Output() markVersesAsRead = new EventEmitter<void>();
}
