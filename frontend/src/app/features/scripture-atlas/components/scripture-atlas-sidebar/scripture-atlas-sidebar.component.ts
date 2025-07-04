import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../core/services/atlas.service';

@Component({
  selector: 'app-scripture-atlas-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar" [class.collapsed]="!isOpen">
      <div class="sidebar-wrapper" *ngIf="selectedCity">
        <div class="sidebar-tabs">
          <button class="tab-btn" [class.active]="view === 'scripture'" (click)="view = 'scripture'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Scripture
          </button>
          <button class="tab-btn" [class.active]="view === 'city'" (click)="view = 'city'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            City Info
          </button>
          <button class="close-btn" (click)="closeSidebar.emit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="sidebar-content" *ngIf="view === 'scripture'">
          <div class="content-header">
            <h2>{{ selectedCity.name }}</h2>
            <p class="verse-reference">{{ selectedCity.verses?.join(', ') }}</p>
          </div>

          <div class="verse-text" [innerHTML]="selectedCity.scriptureText || ''"></div>

          <div class="content-footer">
            <button
              class="action-btn primary"
              (click)="toggleMemorized.emit(selectedCity.id)"
              [class.completed]="isMemorized">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ isMemorized ? "Memorized" : "Memorize" }}
            </button>
            <button
              class="action-btn"
              (click)="markAsRead.emit(selectedCity.id)"
              [class.completed]="isRead">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ isRead ? "Read ✓" : "Mark as Read" }}
            </button>
          </div>
        </div>

        <div class="sidebar-content" *ngIf="view === 'city'">
          <div class="content-header">
            <h2>{{ selectedCity.name }}</h2>
            <p class="city-modern">{{ selectedCity.modern }}</p>
          </div>

          <div class="city-description">{{ selectedCity.description }}</div>

          <div class="city-events" *ngIf="selectedCity.events?.length">
            <h4>Key Events</h4>
            <ul>
              <li *ngFor="let event of selectedCity.events">{{ event }}</li>
            </ul>
          </div>

          <div class="city-fact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p>{{ selectedCity.keyFact }}</p>
          </div>
        </div>
      </div>
    </aside>
  `,
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
