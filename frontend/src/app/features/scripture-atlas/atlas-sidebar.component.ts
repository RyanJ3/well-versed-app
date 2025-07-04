import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { City } from '../../core/services/atlas.service';

@Component({
  selector: 'app-atlas-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './atlas-sidebar.component.html',
  styleUrls: ['./scripture-atlas.component.scss']
})
export class AtlasSidebarComponent {
  @Input() sidebarOpen = true;
  @Input() sidebarView: 'scripture' | 'city' = 'scripture';
  @Input() selectedCity!: City;
  @Input() memorized: Set<string> = new Set();
  @Input() versesRead: Set<string> = new Set();
  @Input() currentScriptureText = '';

  @Output() viewChange = new EventEmitter<'scripture' | 'city'>();
  @Output() toggleMemorized = new EventEmitter<string>();
  @Output() markRead = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
}
