import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProgressSegment {
  name: string;
  shortName: string;
  percent: number;
  color: string;
  verses: number;
}

@Component({
  selector: 'app-bible-tracker-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bible-tracker-stats.component.html',
  styleUrls: ['./bible-tracker-stats.component.scss']
})
export class BibleTrackerStatsComponent {
  @Input() memorizedVerses: number = 0;
  @Input() percentComplete: number = 0;
  @Input() progressViewMode: 'testament' | 'groups' = 'testament';
  @Input() progressSegments: ProgressSegment[] = [];
  @Output() toggleProgressView = new EventEmitter<void>();
}
