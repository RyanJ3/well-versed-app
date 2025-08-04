import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { RecordingService, RecordingState } from '@services/utils/recording.service';
import { NotificationService } from '@services/utils/notification.service';
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
  micPermissionMessage = 'Please allow microphone access to record';
  currentAudio: HTMLAudioElement | null = null;
  private destroy$ = new Subject<void>();

  public playbackDuration = 0;
  public playbackRemaining = 0;
  private playbackInterval: any;
  public audioDuration = 0;

  constructor(
    private recordingService: RecordingService,
    private notificationService: NotificationService
  ) { }

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
    this.stopPlaybackTracking();
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
        
        // Determine the specific error message based on the error type
        if (error instanceof DOMException) {
          switch (error.name) {
            case 'NotFoundError':
            case 'DevicesNotFoundError':
              this.micPermissionMessage = 'No microphone found. Please connect a microphone and try again.';
              break;
            case 'NotAllowedError':
            case 'PermissionDeniedError':
              this.micPermissionMessage = 'Please allow microphone access to record.';
              break;
            case 'NotReadableError':
            case 'TrackStartError':
              this.micPermissionMessage = 'Microphone is already in use or not responding.';
              break;
            case 'OverconstrainedError':
              this.micPermissionMessage = 'Unable to access microphone with the required settings.';
              break;
            case 'SecurityError':
              this.micPermissionMessage = 'Microphone access is blocked due to security settings.';
              break;
            default:
              this.micPermissionMessage = `Microphone error: ${error.name}. Please check your audio settings.`;
          }
        } else if (error instanceof Error) {
          this.micPermissionMessage = error.message || 'Unable to start recording. Please try again.';
        } else {
          this.micPermissionMessage = 'Unable to start recording. Please check your microphone.';
        }
        
        // Show the error message
        this.showMicPermissionMessage = true;
        
        // Also show it in the notification service if available
        this.notificationService.warning(this.micPermissionMessage);
        
        // Auto-hide message after 5 seconds
        setTimeout(() => {
          this.showMicPermissionMessage = false;
        }, 5000);
      }
    }
  }

  onPlayClick() {
    if (!this.recordingState.audioUrl || this.recordingState.isRecording) return;

    if (this.isPlaying && this.currentAudio) {
      // Pause the current audio
      this.currentAudio.pause();
      this.isPlaying = false;
      this.stopPlaybackTracking();
    } else if (this.currentAudio && this.currentAudio.paused) {
      // Resume from paused position
      this.currentAudio.play();
      this.isPlaying = true;
      this.startPlaybackTracking();
    } else {
      // Start new playback
      // First, clean up any existing audio
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      this.currentAudio = this.recordingService.playRecording();
      if (this.currentAudio) {
        this.isPlaying = true;

        // Get total duration when metadata loads
        this.currentAudio.onloadedmetadata = () => {
          if (this.currentAudio) {
            this.audioDuration = this.currentAudio.duration;
            this.playbackRemaining = this.audioDuration;
          }
        };

        // Start tracking playback
        this.startPlaybackTracking();

        // Handle playback end
        this.currentAudio.onended = () => {
          this.stopPlaybackTracking();
          this.currentAudio = null; // Clear reference when ended
        };
      }
    }
  }

  private startPlaybackTracking() {
    this.playbackInterval = setInterval(() => {
      if (this.currentAudio && !this.currentAudio.paused) {
        const currentTime = this.currentAudio.currentTime;
        this.playbackDuration = currentTime;
        this.playbackRemaining = Math.max(0, this.audioDuration - currentTime);

        // Check if nearly complete (within 100ms of end)
        if (this.playbackRemaining < 0.1) {
          this.stopPlaybackTracking();
        }
      }
    }, 100);
  }

  private stopPlaybackTracking() {
    const wasComplete = this.playbackRemaining < 0.1 && this.isPlaying;

    this.isPlaying = false;
    // Don't null out currentAudio here - keep it for resume

    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }

    // Show completion feedback only if playback completed naturally
    if (wasComplete) {
      this.playbackDuration = 0;
      this.playbackRemaining = 0;
      this.currentAudio = null; // Only null out on completion

      const playBtn = document.querySelector('.play-btn');
      if (playBtn) {
        playBtn.classList.add('completion-flash');
        setTimeout(() => {
          playBtn.classList.remove('completion-flash');
        }, 500);
      }
    }
  }

  formatRemaining(seconds: number): string {
    return this.recordingService.formatDuration(Math.ceil(seconds));
  }

  formatPlaybackPosition(): string {
    const current = this.recordingService.formatDuration(Math.floor(this.playbackDuration));
    const total = this.recordingService.formatDuration(this.recordingState.duration);
    return `${current} / ${total}`;
  }

  getPlayTooltip(): string {
    if (this.recordingState.isRecording) {
      return 'Cannot play while recording';
    } else if (this.isPlaying) {
      return 'Pause playback (Space)';
    } else if (this.recordingState.audioUrl) {
      return 'Play recording (Space)';
    }
    return 'No recording to play';
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyPress(event: KeyboardEvent) {
    if (event.code === 'Space') {
      const target = event.target as HTMLElement;
      if (!target?.matches('input, textarea, button')) {
        event.preventDefault();
        if (this.recordingState.audioUrl && !this.recordingState.isRecording) {
          this.onPlayClick();
        }
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