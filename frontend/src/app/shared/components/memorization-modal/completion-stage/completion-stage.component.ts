import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, keyframes, state } from '@angular/animations';

@Component({
  selector: 'app-completion-stage',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('celebration', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0)' }),
        animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          style({ opacity: 1, transform: 'scale(1)' }))
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
    trigger('statReveal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms {{ delay }}ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })),
      ], { params: { delay: 0 } })
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('checkmark', [
      transition(':enter', [
        animate('400ms ease-out', keyframes([
          style({ transform: 'scale(0) rotate(-180deg)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1.2) rotate(25deg)', opacity: 1, offset: 0.5 }),
          style({ transform: 'scale(1) rotate(0)', opacity: 1, offset: 1 })
        ]))
      ])
    ])
  ],
  templateUrl: './completion-stage.component.html',
  styleUrls: ['./completion-stage.component.css']
})
export class CompletionStageComponent implements OnInit {
  @Input() chapterName = '';
  @Input() verseCount = 0;
  @Input() timeSpent = 0;
  @Input() isLastChapterOfBible = false;
  @Input() nextChapterName = '';
  @Input() hasMarkedComplete = false;
  @Input() showNavigationOptions = false;
  @Input() isSaving = false;
  @Input() saveError = false;
  @Input() showSuccessCheck = false;

  @Output() exitWithoutSaving = new EventEmitter<void>();
  @Output() markComplete = new EventEmitter<void>();
  @Output() goToTracker = new EventEmitter<void>();
  @Output() goToFlow = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  showConfetti = false;

  ngOnInit() {
    this.showConfetti = true;
    setTimeout(() => {
      this.showConfetti = false;
    }, 2500);
  }

  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}