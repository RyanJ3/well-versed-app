import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { RecordingService, RecordingState } from '../../../../core/services/recording.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navigation-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation-controls.component.html',
  styleUrls: ['./navigation-controls.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50%) translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(-50%) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-50%) translateY(10px)' }))
      ])
    ])
  ]
})
export class NavigationControlsComponent implements OnInit, OnDestroy {
  @Input() canGoBack = false;
  @Input() currentStepIndex = 0;
  @Input() nextDisabled = false;

  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() jumpToStep = new EventEmitter<number>();

  recordingState: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioUrl: null
  };

  isPlaying = false;
  showMicPermissionMessage = false;
  private currentAudio: HTMLAudioElement | null = null;
  private destroy$ = new Subject<void>();

  constructor(private recordingService: RecordingService) { }

  ngOnInit() {
    this.recordingService.getRecordingState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.recordingState = state;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  async onRecordClick() {
    if (this.recordingState.isRecording) {
      this.recordingService.stopRecording();
    } else {
      try {
        await this.recordingService.startRecording();
        this.showMicPermissionMessage = false;
      } catch (error) {
        console.error('Failed to start recording:', error);
        this.showMicPermissionMessage = true;
        // Auto-hide message after 3 seconds
        setTimeout(() => {
          this.showMicPermissionMessage = false;
        }, 3000);
      }
    }
  }

  onPlayClick() {
    if (this.isPlaying && this.currentAudio) {
      this.currentAudio.pause();
      this.isPlaying = false;
      this.showMicPermissionMessage = false;
      this.showMicPermissionMessage = false;
      this.currentAudio = null;
    } else if (this.recordingState.audioUrl) {
      this.currentAudio = this.recordingService.playRecording();
      if (this.currentAudio) {
        this.isPlaying = true;
        this.currentAudio.onended = () => {
          this.isPlaying = false;
          this.showMicPermissionMessage = false;
          this.showMicPermissionMessage = false;
          this.currentAudio = null;
        };
      }
    }
  }

  getRecordTooltip(): string {
    if (this.recordingState.isRecording) {
      return 'Stop recording';
    } else if (this.recordingState.audioUrl) {
      return 'Start new recording';
    }
    return 'Start recording';
  }

  formatDuration(seconds: number): string {
    return this.recordingService.formatDuration(seconds);
  }
}