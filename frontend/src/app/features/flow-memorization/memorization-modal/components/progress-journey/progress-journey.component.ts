import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

export interface ProgressMarker {
  position: number;
  type: 'star' | 'flag' | 'finish';
  completed: boolean;
  id: string;
  label?: string;
}

@Component({
  selector: 'app-progress-journey',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('starFill', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0) rotate(180deg)' }),
        animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          style({ opacity: 1, transform: 'scale(1) rotate(0deg)' }))
      ])
    ]),
    trigger('flagRaise', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('trophyBounce', [
      transition(':enter', [
        animate('1s', keyframes([
          style({ transform: 'scale(0) rotate(0deg)', offset: 0 }),
          style({ transform: 'scale(1.2) rotate(360deg)', offset: 0.5 }),
          style({ transform: 'scale(0.9) rotate(340deg)', offset: 0.7 }),
          style({ transform: 'scale(1) rotate(360deg)', offset: 1 })
        ]))
      ])
    ]),
    trigger('progressPath', [
      transition(':enter', [
        style({ strokeDashoffset: 100 }),
        animate('1000ms ease-out', style({ strokeDashoffset: '*' }))
      ])
    ])
  ],
  templateUrl: './progress-journey.component.html',
  styleUrls: ['./progress-journey.component.css']
})
export class ProgressJourneyComponent implements OnChanges {
  @Input() progressPercentage = 0;
  @Input() progressMarkers: ProgressMarker[] = [];

  ngOnChanges() {
    // Component updates automatically when inputs change
  }

  getProgressColor(): string {
    if (this.progressPercentage < 33) return '#3b82f6';
    if (this.progressPercentage < 66) return '#8b5cf6';
    return '#10b981';
  }
}