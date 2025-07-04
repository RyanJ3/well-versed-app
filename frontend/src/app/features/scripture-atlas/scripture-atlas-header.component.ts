import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Journey } from '../../core/services/atlas.service';

@Component({
  selector: 'app-scripture-atlas-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="atlas-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="main-title">
            <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <select class="journey-select" name="journey" 
              [(ngModel)]="selectedJourneyId"
              [ngModelOptions]="{standalone: true}"
              (change)="journeyChange.emit($event)">
              <option *ngFor="let j of journeys" [ngValue]="j.id">
                {{ j.name }}
              </option>
            </select>
          </h1>
          <div class="journey-info">
            <span class="info-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ yearRange }}
            </span>
            <span class="info-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {{ scriptureRefs }}
            </span>
            <span class="info-badge highlight">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <strong>{{ currentDistance }}</strong> miles
            </span>
          </div>
        </div>

        <div class="header-right">
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-value">{{ currentIndex + 1 }}</span>
              <span class="stat-label">of {{ totalCities }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ memorizedCount }}</span>
              <span class="stat-label">memorized</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ progressPercentage }}%</span>
              <span class="stat-label">complete</span>
            </div>
          </div>

          <div class="header-controls">
            <button class="control-btn" [class.active]="isPlaying" 
              (click)="playToggle.emit()" title="Play Journey">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path *ngIf="!isPlaying" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path *ngIf="!isPlaying" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path *ngIf="isPlaying" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="btn-label">{{ isPlaying ? "Pause" : "Play" }}</span>
            </button>

            <button class="control-btn" [class.active]="terrainView" 
              (click)="terrainToggle.emit()" title="Toggle Terrain">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="btn-label">Terrain</span>
            </button>

            <button class="control-btn" [class.active]="splitView" 
              (click)="splitToggle.emit()" title="Split View">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <span class="btn-label">Split</span>
            </button>

            <button class="control-btn" [class.active]="sidebarOpen" 
              (click)="sidebarToggle.emit()" title="Info Panel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="btn-label">Info</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .atlas-header {
      position: relative;
      width: 100%;
      height: 100px;
      background: linear-gradient(to bottom, white, #f9fafb);
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 2px 6px 0 rgb(0 0 0 / 0.1);
      z-index: 100;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .header-content {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1.5rem;
      gap: 2rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 2rem;
      flex: 1;
    }

    .main-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .main-title .title-icon {
      width: 24px;
      height: 24px;
      color: #6366f1;
    }

    .main-title .journey-select {
      font-size: inherit;
      font-weight: inherit;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 0.125rem 0.25rem;
      background: white;
      color: inherit;
    }

    .journey-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .info-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      background: #f3f4f6;
      border-radius: 9999px;
      font-size: 0.75rem;
      color: #4b5563;
    }

    .info-badge svg {
      width: 14px;
      height: 14px;
    }

    .info-badge.highlight {
      background: rgba(99, 102, 241, 0.1);
      color: #6366f1;
      font-weight: 500;
    }

    .info-badge.highlight strong {
      font-weight: 700;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .header-stats {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-item .stat-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: #6366f1;
      margin-right: 0.25rem;
    }

    .stat-item .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .header-controls {
      display: flex;
      gap: 0.5rem;
    }

    .control-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }

    .control-btn svg {
      width: 16px;
      height: 16px;
    }

    .control-btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .control-btn.active {
      background: #6366f1;
      border-color: #6366f1;
      color: white;
    }

    @media (max-width: 1024px) {
      .control-btn .btn-label {
        display: none;
      }

      .journey-info {
        display: none;
      }

      .header-stats {
        gap: 1rem;
      }
    }

    @media (max-width: 768px) {
      .atlas-header {
        height: 80px;
      }

      .header-content {
        padding: 0 1rem;
      }

      .main-title {
        font-size: 1rem;
      }

      .main-title .title-icon {
        width: 20px;
        height: 20px;
      }

      .stat-item .stat-value {
        font-size: 0.875rem;
      }

      .stat-item .stat-label {
        font-size: 0.625rem;
      }
    }
  `]
})
export class ScriptureAtlasHeaderComponent {
  @Input() journeys: Journey[] = [];
  @Input() selectedJourneyId: number | null = null;
  @Input() yearRange = '';
  @Input() scriptureRefs = '';
  @Input() currentDistance = 0;
  @Input() currentIndex = 0;
  @Input() totalCities = 0;
  @Input() memorizedCount = 0;
  @Input() progressPercentage = 0;
  @Input() isPlaying = false;
  @Input() terrainView = false;
  @Input() splitView = false;
  @Input() sidebarOpen = true;

  @Output() journeyChange = new EventEmitter<Event>();
  @Output() playToggle = new EventEmitter<void>();
  @Output() terrainToggle = new EventEmitter<void>();
  @Output() splitToggle = new EventEmitter<void>();
  @Output() sidebarToggle = new EventEmitter<void>();
}