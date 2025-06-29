import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BibleService } from '../../../core/services/bible.service';
import { UserService } from '../../../core/services/user.service';
import { Subject, takeUntil } from 'rxjs';

interface Verse {
  code: string;
  text: string;
  reference: string;
  bookId: number;
  chapter: number;
  verse: number;
}

@Component({
  selector: 'app-memorization-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="memorization-modal-overlay" *ngIf="visible">
      <div class="memorization-modal-container">
        <div class="modal-header">
          <div class="header-row">
            <h2>{{ chapterName }}</h2>
            <span class="progress-text"
              >{{ progressPercentage }}% Complete</span
            >
          </div>

          <div class="verse-bubbles">
            <ng-container *ngFor="let group of verseGroups; let i = index">
              <div
                class="group-bubble"
                [class.completed]="i < currentGroupIndex"
                [class.current]="i === currentGroupIndex"
              >
                <div class="verse-numbers">
                  <div *ngFor="let verse of group" class="verse-number">
                    {{ verse.verse }}
                  </div>
                </div>
                <div class="stage-dots" *ngIf="i === currentGroupIndex">
                  <div
                    class="stage-dot"
                    [class.completed]="currentStage > 0"
                  ></div>
                  <div
                    class="stage-dot"
                    [class.completed]="currentStage > 1"
                    [class.active]="currentStage === 1"
                  ></div>
                  <div
                    class="stage-dot"
                    [class.active]="currentStage === 2"
                  ></div>
                </div>
                <span class="check-icon" *ngIf="i < currentGroupIndex">✓</span>
              </div>
            </ng-container>
          </div>

          <div class="progress-bar">
            <div
              class="progress-inner"
              [style.width.%]="progressPercentage"
            ></div>
          </div>
        </div>

        <div class="modal-content">
          <!-- Setup Stage -->
          <ng-container *ngIf="setup">
            <div class="setup">
              <h2>Memorization Setup</h2>
              <p>Select how many verses to practice at once</p>
              <div class="group-selector">
                <button
                  *ngFor="let s of [1, 2, 3]"
                  (click)="setGroupSize(s)"
                  [class.active]="groupSize === s"
                >
                  {{ s }}
                </button>
              </div>
              <button class="start-btn" (click)="start()">Start</button>
            </div>
          </ng-container>

          <!-- Practice Stage -->
          <ng-container *ngIf="!setup && !review">
            <div class="stage-indicators">
              <div
                class="stage"
                *ngFor="let s of ['Read', 'Flow', 'Memory']; let i = index"
              >
                <div
                  class="stage-circle"
                  [class.active]="currentStage === i"
                  [class.completed]="currentStage > i"
                >
                  {{ s.charAt(0) }}
                </div>
                <span class="stage-label">{{ s }}</span>
              </div>
            </div>

            <p class="group-progress">{{ progressDetail }}</p>
            <p class="instructions">{{ currentInstruction }}</p>

            <div class="verse-display">
              <div
                class="verse-block"
                *ngFor="
                  let v of verseGroups[currentGroupIndex];
                  let idx = index
                "
              >
                <p class="verse-ref">{{ v.reference }}</p>
                <p class="verse-text">{{ getVerseDisplay(v) }}</p>
              </div>
            </div>

            <div class="recording-section">
              <button
                class="record-btn"
                (click)="toggleRecording()"
                [class.recording]="isRecording"
              >
                {{
                  isRecording ? 'Stop' : currentAudio ? 'Re-record' : 'Record'
                }}
              </button>
              <button
                *ngIf="currentAudio"
                class="play-btn"
                (click)="playAudio()"
              >
                Play
              </button>
            </div>

            <div class="nav-buttons">
              <button class="prev-btn" (click)="prev()" [disabled]="!canGoBack">
                Previous
              </button>
              <button class="next-btn" (click)="next()">Next</button>
            </div>
          </ng-container>

          <!-- Review Stage -->
          <ng-container *ngIf="review">
            <p class="group-progress">{{ progressDetail }}</p>
            <p class="instructions">
              Review {{ reviewIndex + 1 }} /
              {{ reviewStages[currentReviewStage].length }}
            </p>
            <div class="verse-display">
              <div
                class="verse-block"
                *ngFor="let v of reviewStages[currentReviewStage][reviewIndex]"
              >
                <p class="verse-ref">{{ v.reference }}</p>
                <p class="verse-text">{{ v.text }}</p>
              </div>
            </div>
            <div class="nav-buttons">
              <button class="prev-btn" (click)="prev()" [disabled]="!canGoBack">
                Previous
              </button>
              <button class="next-btn" (click)="nextReview()">Next</button>
            </div>
          </ng-container>

          <!-- Save Prompt -->
          <ng-container *ngIf="promptSave">
            <div class="completion-message">
              <h3>Great job!</h3>
              <p>Would you like to mark this chapter as memorized?</p>
              <div class="nav-buttons">
                <button class="prev-btn" (click)="complete(false)">
                  Not Yet
                </button>
                <button class="next-btn" (click)="complete(true)">
                  Save & Finish
                </button>
              </div>
            </div>
          </ng-container>
        </div>

        <audio #player [src]="currentAudio" class="hidden"></audio>
      </div>
    </div>
  `,
  styleUrls: ['./memorization-modal.component.scss'],
})
export class MemorizationModalComponent implements OnInit, OnDestroy {
  @Input() verses: Verse[] = [];
  @Input() chapterId = 0; // book id
  @Input() chapterName = '';
  @Input() verseCount = 0;

  @Output() completed = new EventEmitter<{ memorized: boolean }>();

  @ViewChild('player') player!: ElementRef<HTMLAudioElement>;

  visible = true;
  setup = true;
  groupSize = 2;

  verseGroups: Verse[][] = [];
  currentGroupIndex = 0;
  currentStage = 0;

  isRecording = false;
  mediaRecorder?: MediaRecorder;
  audioChunks: Blob[] = [];
  currentAudio: string | null = null;

  review = false;
  reviewStages: Verse[][][] = [];
  currentReviewStage = 0;
  reviewIndex = 0;

  promptSave = false;

  completedSteps = 0;
  totalSteps = 0;

  private destroy$ = new Subject<void>();
  private userId = 1;

  get progressPercentage(): number {
    return this.totalSteps
      ? Math.round((this.completedSteps / this.totalSteps) * 100)
      : 0;
  }

  get progressDetail(): string {
    if (this.setup || this.promptSave) {
      return '';
    }
    if (!this.review) {
      return `Group ${this.currentGroupIndex + 1} of ${this.verseGroups.length}`;
    }
    const step = this.reviewIndex + 1;
    const total = this.reviewStages[this.currentReviewStage].length;
    return `Review ${step} / ${total} (Stage ${
      this.currentReviewStage + 1
    } of ${this.reviewStages.length})`;
  }

  get canGoBack(): boolean {
    if (this.setup) return false;
    if (!this.review) {
      return this.currentStage > 0 || this.currentGroupIndex > 0;
    }
    return this.reviewIndex > 0 || this.currentReviewStage > 0;
  }

  get currentInstruction(): string {
    if (this.promptSave) {
      return '';
    }
    switch (this.currentStage) {
      case 0:
        return 'Read the verses aloud 2-3 times';
      case 1:
        return 'Read using first letters';
      default:
        return 'Recite from memory';
    }
  }

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.userId =
            typeof user.id === 'string' ? parseInt(user.id) : user.id;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopRecording();
  }

  setGroupSize(size: number) {
    this.groupSize = size;
  }

  start() {
    this.setup = false;
    this.createGroups();
    this.totalSteps = this.verseGroups.length * 3;
    this.completedSteps = 0;
  }

  createGroups() {
    for (let i = 0; i < this.verses.length; i += this.groupSize) {
      this.verseGroups.push(this.verses.slice(i, i + this.groupSize));
    }
  }

  next() {
    if (this.currentStage < 2) {
      this.currentStage++;
      this.completedSteps++;
    } else {
      this.completedSteps++;
      this.currentStage = 0;
      this.currentGroupIndex++;
      this.currentAudio = null;
      if (this.currentGroupIndex >= this.verseGroups.length) {
        this.prepareReview();
      }
    }
  }

  prev() {
    if (this.review) {
      if (this.reviewIndex > 0) {
        this.reviewIndex--;
      } else if (this.currentReviewStage > 0) {
        this.currentReviewStage--;
        this.reviewIndex =
          this.reviewStages[this.currentReviewStage].length - 1;
      }
    } else {
      if (this.currentStage > 0) {
        this.currentStage--;
      } else if (this.currentGroupIndex > 0) {
        this.currentGroupIndex--;
        this.currentStage = 2;
        this.currentAudio = null;
      }
    }
    if (this.completedSteps > 0) {
      this.completedSteps--;
    }
  }

  prepareReview() {
    this.review = true;
    let groups = this.verseGroups.slice();
    while (groups.length > 1) {
      const stage: Verse[][] = [];
      for (let i = 0; i < groups.length; i += 2) {
        const pair = groups.slice(i, i + 2).flat();
        stage.push(pair);
      }
      this.reviewStages.push(stage);
      groups = stage;
    }
    if (groups.length === 1) {
      this.reviewStages.push([groups[0]]);
    }
    this.currentReviewStage = 0;
    this.reviewIndex = 0;
    const reviewSteps = this.reviewStages.reduce(
      (sum, stg) => sum + stg.length,
      0,
    );
    this.totalSteps += reviewSteps;
  }

  nextReview() {
    this.reviewIndex++;
    if (this.reviewIndex >= this.reviewStages[this.currentReviewStage].length) {
      this.reviewIndex = 0;
      this.currentReviewStage++;
    }
    if (this.currentReviewStage >= this.reviewStages.length) {
      this.showSavePrompt();
    }
    this.completedSteps++;
  }

  showSavePrompt() {
    this.review = false;
    this.promptSave = true;
  }

  async complete(save: boolean) {
    if (save) {
      try {
        const chapterNum = this.verses[0]?.chapter || 1;
        await this.bibleService
          .saveChapter(this.userId, this.chapterId, chapterNum)
          .toPromise();
        this.completed.emit({ memorized: true });
      } catch (err) {
        console.error('Error marking chapter memorized', err);
        this.completed.emit({ memorized: false });
      }
    } else {
      this.completed.emit({ memorized: false });
    }
    this.completedSteps = this.totalSteps;
    this.visible = false;
    this.router.navigate(['/profile'], {
      queryParams: { memorized: save },
    });
  }

  getInitials(text: string): string {
    return text
      .split(' ')
      .map((word) => word[0] || '')
      .join(' ');
  }

  getVerseDisplay(v: Verse): string {
    if (this.currentStage === 0) {
      return v.text;
    }
    if (this.currentStage === 1) {
      return this.getInitials(v.text);
    }
    return '• • •';
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];
        this.mediaRecorder.ondataavailable = (e) =>
          this.audioChunks.push(e.data);
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
          this.currentAudio = URL.createObjectURL(blob);
          stream.getTracks().forEach((t) => t.stop());
        };
        this.mediaRecorder.start();
        this.isRecording = true;
      } catch (err) {
        console.error('Recording error', err);
      }
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  playAudio() {
    if (this.player) {
      this.player.nativeElement.play();
    }
  }
}
