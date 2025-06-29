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
    <div class="memorization-overlay" *ngIf="visible">
      <div class="memorization-container">
        <!-- Setup Stage -->
        <ng-container *ngIf="setup">
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
        </ng-container>

        <!-- Practice Stage -->
        <ng-container *ngIf="!setup && !review">
          <div class="progress">
            Group {{ currentGroupIndex + 1 }} / {{ verseGroups.length }}
          </div>

          <div class="verse-display" *ngIf="currentStage === 0">
            <p *ngFor="let v of verseGroups[currentGroupIndex]">{{ v.text }}</p>
            <p class="instruction">Read aloud 2-3 times</p>
          </div>

          <div class="verse-display" *ngIf="currentStage === 1">
            <p *ngFor="let v of verseGroups[currentGroupIndex]">
              {{ getInitials(v.text) }}
            </p>
            <p class="instruction">Read using first letters</p>
          </div>

          <div class="verse-display" *ngIf="currentStage === 2">
            <p class="instruction">Recite from memory</p>
          </div>

          <div class="recording-controls">
            <button (click)="toggleRecording()" [class.recording]="isRecording">
              {{ isRecording ? 'Stop' : currentAudio ? 'Re-record' : 'Record' }}
            </button>
            <audio #player *ngIf="currentAudio" [src]="currentAudio"></audio>
            <button *ngIf="currentAudio" (click)="playAudio()">Play</button>
          </div>

          <button class="next-btn" (click)="next()">Next</button>
        </ng-container>

        <!-- Review Stage -->
        <ng-container *ngIf="review">
          <div class="progress">
            Review {{ reviewIndex + 1 }} /
            {{ reviewStages[currentReviewStage].length }}
          </div>
          <div class="verse-display">
            <p *ngFor="let v of reviewStages[currentReviewStage][reviewIndex]">
              {{ v.text }}
            </p>
            <p class="instruction">Recite from memory</p>
          </div>
          <button class="next-btn" (click)="nextReview()">Next</button>
        </ng-container>
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

  private destroy$ = new Subject<void>();
  private userId = 1;

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
  }

  createGroups() {
    for (let i = 0; i < this.verses.length; i += this.groupSize) {
      this.verseGroups.push(this.verses.slice(i, i + this.groupSize));
    }
  }

  next() {
    if (this.currentStage < 2) {
      this.currentStage++;
    } else {
      this.currentStage = 0;
      this.currentGroupIndex++;
      this.currentAudio = null;
      if (this.currentGroupIndex >= this.verseGroups.length) {
        this.prepareReview();
      }
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
  }

  nextReview() {
    this.reviewIndex++;
    if (this.reviewIndex >= this.reviewStages[this.currentReviewStage].length) {
      this.reviewIndex = 0;
      this.currentReviewStage++;
    }
    if (this.currentReviewStage >= this.reviewStages.length) {
      this.complete();
    }
  }

  async complete() {
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
    this.visible = false;
    this.router.navigate(['/profile'], {
      queryParams: { memorized: true },
    });
  }

  getInitials(text: string): string {
    return text
      .split(' ')
      .map((word) => word[0] || '')
      .join(' ');
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
