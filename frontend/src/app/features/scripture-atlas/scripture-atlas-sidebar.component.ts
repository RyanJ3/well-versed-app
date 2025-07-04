import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../core/services/atlas.service';

@Component({
  selector: 'app-scripture-atlas-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar" [class.collapsed]="!isOpen">
      <div class="sidebar-wrapper" *ngIf="selectedCity">
        <div class="sidebar-tabs">
          <button class="tab-btn" [class.active]="activeView === 'scripture'"
            (click)="activeView = 'scripture'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Scripture
          </button>
          <button class="tab-btn" [class.active]="activeView === 'city'"
            (click)="activeView = 'city'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            City Info
          </button>
          <button class="close-btn" (click)="close.emit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="sidebar-content" *ngIf="activeView === 'scripture'">
          <div class="content-header">
            <h2>{{ selectedCity.name }}</h2>
            <p class="verse-reference">{{ selectedCity.verses?.join(', ') }}</p>
          </div>

          <div class="verse-text" [innerHTML]="selectedCity.scriptureText"></div>

          <div class="content-footer">
            <button class="action-btn primary" 
              (click)="memorizeToggle.emit(selectedCity.id)"
              [class.completed]="isMemorized">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M5 13l4 4L19 7" />
              </svg>
              {{ isMemorized ? "Memorized" : "Memorize" }}
            </button>
            <button class="action-btn" 
              (click)="markRead.emit(selectedCity.id)"
              [class.completed]="isRead">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ isRead ? "Read ✓" : "Mark as Read" }}
            </button>
          </div>
        </div>

        <div class="sidebar-content" *ngIf="activeView === 'city'">
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
  styles: [`
    .sidebar {
      width: 360px;
      height: 100%;
      background: transparent;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s ease;
      padding: 1rem 0 1rem 1rem;
    }

    .sidebar.collapsed {
      margin-left: -360px;
    }

    .sidebar-wrapper {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.06);
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-tabs {
      display: flex;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      position: relative;
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.75rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: #4b5563;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn svg {
      width: 16px;
      height: 16px;
    }

    .tab-btn:hover {
      color: #1f2937;
      background: rgba(243, 244, 246, 0.5);
    }

    .tab-btn.active {
      color: #6366f1;
      border-bottom-color: #6366f1;
      background: white;
    }

    .close-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .close-btn svg {
      width: 16px;
      height: 16px;
      color: #6b7280;
    }

    .close-btn:hover {
      background: #e5e7eb;
    }

    .sidebar-content {
      flex: 1;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .content-header {
      margin-bottom: 1rem;
    }

    .content-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.25rem;
    }

    .content-header .verse-reference {
      font-size: 0.875rem;
      color: #6366f1;
      margin: 0;
    }

    .content-header .city-modern {
      font-size: 0.875rem;
      color: #4b5563;
      margin: 0;
    }

    .verse-text {
      flex: 1;
      font-size: 0.875rem;
      line-height: 1.6;
      color: #374151;
      overflow-y: auto;
    }

    :host ::ng-deep .verse-text .verse-number {
      font-weight: 700;
      color: #6366f1;
      margin-right: 0.25rem;
    }

    :host ::ng-deep .verse-text .verse {
      margin-bottom: 0.5rem;
    }

    .city-description {
      font-size: 0.875rem;
      line-height: 1.5;
      color: #374151;
      margin-bottom: 1rem;
    }

    .city-events {
      margin-bottom: 1rem;
    }

    .city-events h4 {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin: 0 0 0.5rem;
    }

    .city-events ul {
      margin: 0;
      padding-left: 1.25rem;
    }

    .city-events ul li {
      font-size: 0.8125rem;
      line-height: 1.5;
      color: #4b5563;
      margin-bottom: 0.25rem;
    }

    .city-fact {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(245, 158, 11, 0.05);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 0.5rem;
      margin-top: auto;
    }

    .city-fact svg {
      width: 20px;
      height: 20px;
      color: #f59e0b;
      flex-shrink: 0;
    }

    .city-fact p {
      font-size: 0.75rem;
      line-height: 1.4;
      color: #374151;
      margin: 0;
    }

    .content-footer {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.625rem;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
    }

    .action-btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .action-btn.primary {
      background: #6366f1;
      border-color: #6366f1;
      color: white;
    }

    .action-btn.primary:hover {
      background: #4f46e5;
      border-color: #4f46e5;
    }

    .action-btn.primary.completed {
      background: #10b981;
      border-color: #10b981;
    }

    .action-btn.completed {
      opacity: 0.8;
    }

    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    ::-webkit-scrollbar-track {
      background: #f3f4f6;
    }

    ::-webkit-scrollbar-thumb {
      background: #9ca3af;
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #6b7280;
    }

    @media (max-width: 1024px) {
      .sidebar {
        position: absolute;
        z-index: 60;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        background: white;
        padding: 0;
        border-right: 1px solid #e5e7eb;
      }

      .sidebar.collapsed {
        transform: translateX(-100%);
        margin-left: 0;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        max-width: 320px;
      }
    }
  `]
})
export class ScriptureAtlasSidebarComponent {
  @Input() isOpen = true;
  @Input() selectedCity: City | null = null;
  @Input() isMemorized = false;
  @Input() isRead = false;

  @Output() close = new EventEmitter<void>();
  @Output() memorizeToggle = new EventEmitter<string>();
  @Output() markRead = new EventEmitter<string>();

  activeView: 'scripture' | 'city' = 'scripture';
}