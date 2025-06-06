// frontend/src/app/features/courses/lesson-practice/lesson-practice.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BibleService } from '../../../../core/services/bible.service';
import { CourseService } from '../../../../core/services/course.service';
import { UserService } from '../../../../core/services/user.service';

interface VerseSet {
  verses: {
    code: string;
    reference: string;
    text: string;
    bookId: number;
    chapter: number;
    verse: number;
  }[];
  currentStage: 'full' | 'initials' | 'memory';
  confidence: number;
  audioBlob?: Blob;
  audioUrl?: string;
}

@Component({
  selector: 'app-lesson-practice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lesson-practice-container">
      <!-- Initial Settings -->
      <div class="settings-overlay" *ngIf="showSettings">
        <div class="settings-card">
          <h2>Practice Settings</h2>
          <p>How many verses would you like to practice at once?</p>

          <div class="verse-options">
            <button
              class="verse-option"
              [class.selected]="versesPerSet === 1"
              (click)="selectVersesPerSet(1)"
            >
              <div class="option-icon">1</div>
              <span>One verse</span>
              <small>Easier to memorize</small>
            </button>

            <button
              class="verse-option"
              [class.selected]="versesPerSet === 2"
              (click)="selectVersesPerSet(2)"
            >
              <div class="option-icon">2</div>
              <span>Two verses</span>
              <small>Better flow</small>
            </button>
          </div>

          <button
            class="start-button"
            (click)="startPractice()"
            [disabled]="!versesPerSet"
          >
            Start Practice
          </button>
        </div>
      </div>

      <!-- Main Practice Area -->
      <div class="practice-area" *ngIf="!showSettings && currentSet">
        <!-- Progress Header -->
        <div class="progress-header">
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div
                class="progress-fill"
                [style.width.%]="overallProgress"
              ></div>
            </div>
            <span class="progress-text"
              >{{ currentSetIndex + 1 }} of {{ verseSets.length }}</span
            >
          </div>
        </div>

        <!-- Stage Indicator -->
        <div class="stage-progress">
          <div
            class="stage-item"
            [class.active]="currentSet.currentStage === 'full'"
            [class.completed]="stageCompleted.full"
          >
            <div class="stage-dot"></div>
            <span>Read</span>
          </div>
          <div class="stage-line" [class.filled]="stageCompleted.full"></div>

          <div
            class="stage-item"
            [class.active]="currentSet.currentStage === 'initials'"
            [class.completed]="stageCompleted.initials"
          >
            <div class="stage-dot"></div>
            <span>FLOW</span>
          </div>
          <div
            class="stage-line"
            [class.filled]="stageCompleted.initials"
          ></div>

          <div
            class="stage-item"
            [class.active]="currentSet.currentStage === 'memory'"
          >
            <div class="stage-dot"></div>
            <span>Recite</span>
          </div>
        </div>

        <!-- Verse Display -->
        <div class="verse-container">
          <div class="verse-reference">
            {{ getSetReference() }}
          </div>

          <div class="verse-content">
            <!-- Full Text Stage -->
            <div class="full-text" *ngIf="currentSet.currentStage === 'full'">
              <p *ngFor="let verse of currentSet.verses" class="verse-text">
                <span class="verse-number">{{ verse.verse }}</span>
                {{ verse.text }}
              </p>
            </div>

            <!-- Initials Stage -->
            <div
              class="initials-text"
              *ngIf="currentSet.currentStage === 'initials'"
            >
              <p *ngFor="let verse of currentSet.verses" class="verse-initials">
                <span class="verse-number">{{ verse.verse }}</span>
                {{ getInitialsText(verse.text) }}
              </p>
            </div>

            <!-- Memory Stage -->
            <div
              class="memory-stage"
              *ngIf="currentSet.currentStage === 'memory'"
            >
              <div class="memory-icon">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <p class="memory-prompt">Recite from memory</p>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instruction-box">
          <p *ngIf="currentSet.currentStage === 'full'">
            Read the verse{{ versesPerSet > 1 ? 's' : '' }} out loud 2-3 times
          </p>
          <p *ngIf="currentSet.currentStage === 'initials'">
            Read aloud using only the first letters as guides
          </p>
          <p *ngIf="currentSet.currentStage === 'memory'">
            Recite from memory without any visual aids
          </p>
        </div>

        <!-- Recording Controls -->
        <div class="recording-section">
          <button
            class="record-btn"
            [class.recording]="isRecording"
            [class.has-audio]="!!currentSet.audioUrl"
            (click)="toggleRecording()"
            [disabled]="!canRecord"
          >
            <div
              class="record-icon"
              *ngIf="!currentSet.audioUrl || isRecording"
            >
              <svg
                *ngIf="!isRecording"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
                />
                <path
                  d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
                />
              </svg>
              <div class="recording-pulse" *ngIf="isRecording"></div>
            </div>
            <span *ngIf="!currentSet.audioUrl">{{
              isRecording ? 'Recording...' : 'Hold to Record'
            }}</span>
            <span *ngIf="currentSet.audioUrl && !isRecording">Recorded ✓</span>
          </button>

          <div
            class="audio-controls"
            *ngIf="currentSet.audioUrl && !isRecording"
          >
            <audio #audioPlayer [src]="currentSet.audioUrl"></audio>
            <button class="audio-btn" (click)="playAudio()">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <button class="audio-btn delete" (click)="deleteRecording()">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <div class="nav-buttons">
          <button
            class="nav-btn secondary"
            (click)="previousStage()"
            [disabled]="
              currentSet.currentStage === 'full' && currentSetIndex === 0
            "
          >
            Back
          </button>

          <button class="nav-btn primary" (click)="nextStage()">
            {{ getNextButtonText() }}
          </button>
        </div>
      </div>

      <!-- Confidence Rating -->
      <div class="confidence-modal" *ngIf="showConfidence && currentSet">
        <div class="confidence-card">
          <h3>How confident do you feel?</h3>
          <p>{{ getSetReference() }}</p>

          <div class="confidence-slider-container">
            <div class="confidence-labels">
              <span>Learning</span>
              <span>Confident</span>
              <span>Mastered</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              [(ngModel)]="currentSet.confidence"
              class="confidence-slider"
              (input)="onConfidenceChange()"
            />
            <div class="confidence-percentage">
              {{ currentSet.confidence }}%
            </div>
          </div>

          <div class="star-display">
            <svg
              *ngFor="let i of [1, 2, 3]"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              [class.filled]="getStars() >= i"
              fill="currentColor"
            >
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
          </div>

          <button class="confidence-continue" (click)="saveConfidence()">
            {{
              currentSetIndex < verseSets.length - 1
                ? 'Continue'
                : 'Complete Lesson'
            }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./lesson-practice.component.scss'],
})
export class LessonPracticeComponent implements OnInit, OnDestroy {
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  // Route params
  courseId!: number;
  lessonId!: number;
  userId = 1;

  // Practice settings
  showSettings = true;
  versesPerSet = 0;
  allVerseCodes: string[] = [];
  verseSets: VerseSet[] = [];

  // Current state
  currentSetIndex = 0;
  currentSet: VerseSet | null = null;
  stageCompleted = { full: false, initials: false };
  showConfidence = false;

  // Audio recording
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  isRecording = false;
  canRecord = false;
  recordingTimer: any;

  // Progress
  overallProgress = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bibleService: BibleService,
    private courseService: CourseService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.courseId = +params['courseId'];
      this.lessonId = +params['lessonId'];
    });

    this.route.queryParams.subscribe((params) => {
      if (params['verses']) {
        this.allVerseCodes = JSON.parse(params['verses']);
      }
    });

    this.userService.currentUser$.subscribe((user) => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      }
    });

    this.checkMicrophonePermission();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  async checkMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      this.canRecord = true;
    } catch {
      this.canRecord = false;
    }
  }

  selectVersesPerSet(count: number) {
    this.versesPerSet = count;
  }

  async startPractice() {
    this.showSettings = false;
    await this.createVerseSets();
    if (this.verseSets.length > 0) {
      this.currentSet = this.verseSets[0];
      this.updateProgress();
    }
  }

  async createVerseSets() {
    const texts = await this.bibleService
      .getVerseTexts(this.userId, this.allVerseCodes)
      .toPromise();

    for (let i = 0; i < this.allVerseCodes.length; i += this.versesPerSet) {
      const setVerses = [];

      for (
        let j = 0;
        j < this.versesPerSet && i + j < this.allVerseCodes.length;
        j++
      ) {
        const code = this.allVerseCodes[i + j];
        const [bookId, chapter, verse] = code.split('-').map(Number);
        const book = this.bibleService.getBibleData().getBookById(bookId);

        setVerses.push({
          code,
          reference: `${book?.name} ${chapter}:${verse}`,
          text: texts?.[code] || '',
          bookId,
          chapter,
          verse,
        });
      }

      this.verseSets.push({
        verses: setVerses,
        currentStage: 'full',
        confidence: 50,
      });
    }
  }

  getSetReference(): string {
    if (!this.currentSet) return '';
    const verses = this.currentSet.verses;
    if (verses.length === 1) {
      return verses[0].reference;
    } else {
      const first = verses[0];
      const last = verses[verses.length - 1];
      if (first.chapter === last.chapter) {
        return `${first.reference}-${last.verse}`;
      } else {
        return `${first.reference}-${last.chapter}:${last.verse}`;
      }
    }
  }

  getInitialsText(text: string): string {
    return text
      .split(' ')
      .map((word) => {
        const match = word.match(/^(\w)(.*)([.,;:!?"]?)$/);
        if (match) {
          return match[1] + match[3];
        }
        return word[0] || '';
      })
      .join(' ');
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        if (this.currentSet) {
          this.currentSet.audioBlob = blob;
          this.currentSet.audioUrl = URL.createObjectURL(blob);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.error('Recording error:', err);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  playAudio() {
    if (this.audioPlayer) {
      this.audioPlayer.nativeElement.play();
    }
  }

  deleteRecording() {
    if (this.currentSet?.audioUrl) {
      URL.revokeObjectURL(this.currentSet.audioUrl);
      this.currentSet.audioUrl = undefined;
      this.currentSet.audioBlob = undefined;
    }
  }

  previousStage() {
    if (!this.currentSet) return;

    if (this.currentSet.currentStage === 'initials') {
      this.currentSet.currentStage = 'full';
      this.stageCompleted.full = false;
    } else if (this.currentSet.currentStage === 'memory') {
      this.currentSet.currentStage = 'initials';
      this.stageCompleted.initials = false;
    } else if (this.currentSetIndex > 0) {
      this.currentSetIndex--;
      this.currentSet = this.verseSets[this.currentSetIndex];
      this.currentSet.currentStage = 'memory';
      this.stageCompleted = { full: true, initials: true };
      this.updateProgress();
    }
  }

  nextStage() {
    if (!this.currentSet) return;

    if (this.currentSet.currentStage === 'full') {
      this.currentSet.currentStage = 'initials';
      this.stageCompleted.full = true;
    } else if (this.currentSet.currentStage === 'initials') {
      this.currentSet.currentStage = 'memory';
      this.stageCompleted.initials = true;
    } else {
      this.showConfidence = true;
    }
  }

  getNextButtonText(): string {
    if (!this.currentSet) return 'Next';

    switch (this.currentSet.currentStage) {
      case 'full':
        return 'Continue to FLOW';
      case 'initials':
        return 'Continue to Recite';
      case 'memory':
        return 'Rate Confidence';
      default:
        return 'Next';
    }
  }

  onConfidenceChange() {
    // Visual feedback during slider movement
  }

  getStars(): number {
    if (!this.currentSet) return 0;
    if (this.currentSet.confidence >= 100) return 3;
    if (this.currentSet.confidence >= 85) return 2;
    if (this.currentSet.confidence >= 70) return 1;
    return 0;
  }

  async saveConfidence() {
    if (!this.currentSet) return;

    // Update confidence for each verse
    for (const verse of this.currentSet.verses) {
      await this.bibleService
        .saveVerse(
          this.userId,
          verse.bookId,
          verse.chapter,
          verse.verse,
          Math.max(1, Math.round(this.currentSet.confidence / 10)),
        )
        .toPromise();
    }

    this.showConfidence = false;

    if (this.currentSetIndex < this.verseSets.length - 1) {
      this.currentSetIndex++;
      this.currentSet = this.verseSets[this.currentSetIndex];
      this.stageCompleted = { full: false, initials: false };
      this.updateProgress();
    } else {
      this.completeAndAdvance();
    }
  }

  updateProgress() {
    const totalStages = this.verseSets.length * 3;
    const completedStages =
      this.currentSetIndex * 3 +
      (this.stageCompleted.full ? 1 : 0) +
      (this.stageCompleted.initials ? 1 : 0);
    this.overallProgress = (completedStages / totalStages) * 100;
  }

  async completeAndAdvance() {
    // Mark lesson complete
    await this.courseService
      .completeLesson(this.lessonId, this.userId)
      .toPromise();

    // Get course to find next lesson
    const course = await this.courseService
      .getCourse(this.courseId, this.userId)
      .toPromise();

    if (course?.lessons) {
      const currentIndex = course.lessons.findIndex(
        (l) => l.id === this.lessonId,
      );
      const nextLesson = course.lessons[currentIndex + 1];

      if (nextLesson) {
        this.router.navigate([
          '/courses',
          this.courseId,
          'lessons',
          nextLesson.id,
        ]);
      } else {
        // No more lessons - go to course completion
        this.router.navigate(['/courses', this.courseId], {
          queryParams: { completed: true },
        });
      }
    }
  }

  cleanup() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    this.verseSets.forEach((set) => {
      if (set.audioUrl) {
        URL.revokeObjectURL(set.audioUrl);
      }
    });
  }
}
