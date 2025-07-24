// frontend/src/app/features/courses/quiz-practice/quiz-practice.component.ts

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
import { ModalService } from '../../../../core/services/modal.service';

interface QuizVerse {
  code: string;
  reference: string;
  text: string;
  bookId: number;
  chapter: number;
  verse: number;
  currentStage: 'full' | 'initials' | 'memory';
  confidence: number;
  audioBlob?: Blob;
  audioUrl?: string;
}

@Component({
  selector: 'app-quiz-practice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="quiz-practice-container">
      <!-- Header -->
      <div class="quiz-header" *ngIf="!showResults">
        <div class="quiz-title">
          <h1>{{ lesson?.title }}</h1>
          <p>{{ lesson?.description }}</p>
        </div>

        <div class="quiz-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              [style.width.%]="progressPercentage"
            ></div>
          </div>
          <span class="progress-text"
            >{{ currentIndex + 1 }} of {{ quizVerses.length }}</span
          >
        </div>
      </div>

      <!-- Main Practice Area -->
      <div class="practice-area" *ngIf="currentVerse && !showResults">
        <!-- Stage Progress -->
        <div class="stage-progress">
          <div
            class="stage-item"
            [class.active]="currentVerse.currentStage === 'full'"
            [class.completed]="stageCompleted.full"
          >
            <div class="stage-dot"></div>
            <span>Read</span>
          </div>
          <div class="stage-line" [class.filled]="stageCompleted.full"></div>

          <div
            class="stage-item"
            [class.active]="currentVerse.currentStage === 'initials'"
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
            [class.active]="currentVerse.currentStage === 'memory'"
          >
            <div class="stage-dot"></div>
            <span>Recite</span>
          </div>
        </div>

        <!-- Verse Display -->
        <div class="verse-container">
          <div class="verse-reference">{{ currentVerse.reference }}</div>

          <div class="verse-content">
            <!-- Full Text -->
            <div class="full-text" *ngIf="currentVerse.currentStage === 'full'">
              <p class="verse-text">{{ currentVerse.text }}</p>
            </div>

            <!-- Initials -->
            <div
              class="initials-text"
              *ngIf="currentVerse.currentStage === 'initials'"
            >
              <p class="verse-initials">
                {{ getInitialsText(currentVerse.text) }}
              </p>
            </div>

            <!-- Memory -->
            <div
              class="memory-stage"
              *ngIf="currentVerse.currentStage === 'memory'"
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
          <p *ngIf="currentVerse.currentStage === 'full'">
            Read the verse out loud 2-3 times
          </p>
          <p *ngIf="currentVerse.currentStage === 'initials'">
            Read aloud using only the first letters as guides
          </p>
          <p *ngIf="currentVerse.currentStage === 'memory'">
            Recite from memory without any visual aids
          </p>
        </div>

        <!-- Recording Section -->
        <div class="recording-section">
          <button
            class="record-btn"
            [class.recording]="isRecording"
            [class.has-audio]="!!currentVerse.audioUrl"
            (click)="toggleRecording()"
            [disabled]="!canRecord"
          >
            <div
              class="record-icon"
              *ngIf="!currentVerse.audioUrl || isRecording"
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
            <span *ngIf="!currentVerse.audioUrl">{{
              isRecording ? 'Recording...' : 'Hold to Record'
            }}</span>
            <span *ngIf="currentVerse.audioUrl && !isRecording"
              >Recorded ✓</span
            >
          </button>

          <div
            class="audio-controls"
            *ngIf="currentVerse.audioUrl && !isRecording"
          >
            <audio #audioPlayer [src]="currentVerse.audioUrl"></audio>
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
              currentVerse.currentStage === 'full' && currentIndex === 0
            "
          >
            Back
          </button>

          <button class="nav-btn primary" (click)="nextStage()">
            {{ getNextButtonText() }}
          </button>
        </div>
      </div>

      <!-- Confidence Rating Modal -->
      <div class="confidence-modal" *ngIf="showConfidence && currentVerse">
        <div class="confidence-card">
          <h3>How confident do you feel?</h3>
          <p>{{ currentVerse.reference }}</p>

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
              [(ngModel)]="currentVerse.confidence"
              class="confidence-slider"
            />
            <div class="confidence-percentage">
              {{ currentVerse.confidence }}%
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
              currentIndex < quizVerses.length - 1
                ? 'Next Verse'
                : 'Complete Quiz'
            }}
          </button>
        </div>
      </div>

      <!-- Results Screen -->
      <div class="results-screen" *ngIf="showResults">
        <div class="results-card">
          <div class="results-icon" [class.passed]="passed">
            <svg
              *ngIf="passed"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <svg
              *ngIf="!passed"
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
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2>{{ passed ? 'Quiz Passed!' : 'Not Quite There' }}</h2>

          <div class="score-display">
            <div class="score-percentage">{{ averageScore }}%</div>
            <div class="score-label">Average Confidence</div>
          </div>

          <div class="star-rating">
            <svg
              *ngFor="let i of [1, 2, 3]"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              [class.filled]="finalStars >= i"
              fill="currentColor"
            >
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
          </div>

          <div class="verse-results">
            <h3>Verse Breakdown</h3>
            <div class="verse-result" *ngFor="let verse of quizVerses">
              <span class="verse-ref">{{ verse.reference }}</span>
              <div class="verse-score">
                <div class="score-bar">
                  <div
                    class="score-fill"
                    [style.width.%]="verse.confidence"
                  ></div>
                </div>
                <span class="score-text">{{ verse.confidence }}%</span>
              </div>
            </div>
          </div>

          <div class="results-message" *ngIf="!passed">
            <p>
              You need {{ passThreshold }}% average confidence to pass this
              quiz.
            </p>
            <p>Keep practicing and try again!</p>
          </div>

          <div class="results-actions">
            <button *ngIf="!passed" class="btn-secondary" (click)="retryQuiz()">
              Try Again
            </button>
            <button *ngIf="passed" class="btn-primary" (click)="completeQuiz()">
              Continue to Next Lesson
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./quiz-practice.component.scss'],
})
export class QuizPracticeComponent implements OnInit, OnDestroy {
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  // Route params
  courseId!: number;
  lessonId!: number;
  userId = 1;

  // Lesson data
  lesson: any;
  passThreshold = 85;

  // Quiz verses
  quizVerses: QuizVerse[] = [];
  currentIndex = 0;
  currentVerse: QuizVerse | null = null;

  // Stage tracking
  stageCompleted = { full: false, initials: false };
  showConfidence = false;

  // Results
  showResults = false;
  averageScore = 0;
  finalStars = 0;
  passed = false;

  // Audio
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  isRecording = false;
  canRecord = false;

  // Progress
  progressPercentage = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bibleService: BibleService,
    private courseService: CourseService,
    private userService: UserService,
    private modalService: ModalService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.courseId = +params['courseId'];
      this.lessonId = +params['lessonId'];
      this.loadQuiz();
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

  async loadQuiz() {
    try {
      // Load lesson details
      const lesson = await this.courseService
        .getLesson(this.lessonId, this.userId)
        .toPromise();
      this.lesson = lesson;
      this.passThreshold =
        lesson?.content_data?.quiz_config?.pass_threshold || 85;

      // Get verses from previous lessons
      const verseCodes = await this.getQuizVerses();
      if (verseCodes.length === 0) {
        this.modalService.alert(
          'Error',
          'No verses available for quiz',
          'danger',
        );
        this.router.navigate(['/courses', this.courseId]);
        return;
      }

      // Load verse texts
      const texts = await this.bibleService
        .getVerseTexts(this.userId, verseCodes)
        .toPromise();

      this.quizVerses = verseCodes.map((code) => {
        const [bookId, chapter, verse] = code.split('-').map(Number);
        const book = this.bibleService.getBibleData().getBookById(bookId);

        return {
          code,
          reference: `${book?.name} ${chapter}:${verse}`,
          text: texts?.[code] || '',
          bookId,
          chapter,
          verse,
          currentStage: 'full',
          confidence: 50,
        };
      });

      if (this.quizVerses.length > 0) {
        this.currentVerse = this.quizVerses[0];
        this.updateProgress();
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      this.modalService.alert('Error', 'Failed to load quiz', 'danger');
      this.router.navigate(['/courses', this.courseId]);
    }
  }

  async getQuizVerses(): Promise<string[]> {
    // Get course with all lessons
    const course = await this.courseService
      .getCourse(this.courseId, this.userId)
      .toPromise();
    if (!course) return [];

    // Find current lesson position
    const currentLessonIndex = course.lessons.findIndex(
      (l) => l.id === this.lessonId,
    );
    if (currentLessonIndex <= 0) return []; // No previous lessons

    // Get all verse codes from previous lessons
    const allVerseCodes: string[] = [];
    for (let i = 0; i < currentLessonIndex; i++) {
      const lesson = course.lessons[i];
      if (lesson.content_type !== 'quiz') {
        // Get flashcards from this lesson
        const flashcards = await this.courseService
          .getLessonFlashcards(lesson.id!)
          .toPromise();
        flashcards?.forEach((card) => {
          if (card.verse_codes) {
            allVerseCodes.push(...card.verse_codes);
          }
        });
      }
    }

    // Remove duplicates
    const uniqueVerses = [...new Set(allVerseCodes)];

    // Select verses based on quiz config
    const verseCount = this.lesson?.content_data?.quiz_config?.verse_count || 5;
    const randomize =
      this.lesson?.content_data?.quiz_config?.randomize !== false;

    if (randomize) {
      // Shuffle and select
      const shuffled = uniqueVerses.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(verseCount, shuffled.length));
    } else {
      // Use spaced repetition logic - select verses with lowest confidence
      // For now, just take first N verses
      return uniqueVerses.slice(0, Math.min(verseCount, uniqueVerses.length));
    }
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
        if (this.currentVerse) {
          this.currentVerse.audioBlob = blob;
          this.currentVerse.audioUrl = URL.createObjectURL(blob);
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
    if (this.currentVerse?.audioUrl) {
      URL.revokeObjectURL(this.currentVerse.audioUrl);
      this.currentVerse.audioUrl = undefined;
      this.currentVerse.audioBlob = undefined;
    }
  }

  previousStage() {
    if (!this.currentVerse) return;

    if (this.currentVerse.currentStage === 'initials') {
      this.currentVerse.currentStage = 'full';
      this.stageCompleted.full = false;
    } else if (this.currentVerse.currentStage === 'memory') {
      this.currentVerse.currentStage = 'initials';
      this.stageCompleted.initials = false;
    } else if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentVerse = this.quizVerses[this.currentIndex];
      this.currentVerse.currentStage = 'memory';
      this.stageCompleted = { full: true, initials: true };
      this.updateProgress();
    }
  }

  nextStage() {
    if (!this.currentVerse) return;

    if (this.currentVerse.currentStage === 'full') {
      this.currentVerse.currentStage = 'initials';
      this.stageCompleted.full = true;
    } else if (this.currentVerse.currentStage === 'initials') {
      this.currentVerse.currentStage = 'memory';
      this.stageCompleted.initials = true;
    } else {
      this.showConfidence = true;
    }
  }

  getNextButtonText(): string {
    if (!this.currentVerse) return 'Next';

    switch (this.currentVerse.currentStage) {
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

  getStars(): number {
    if (!this.currentVerse) return 0;
    if (this.currentVerse.confidence >= 100) return 3;
    if (this.currentVerse.confidence >= 85) return 2;
    if (this.currentVerse.confidence >= 70) return 1;
    return 0;
  }

  async saveConfidence() {
    if (!this.currentVerse) return;

    // Save confidence score
    await this.bibleService
      .saveVerse(
        this.userId,
        this.currentVerse.bookId,
        this.currentVerse.chapter,
        this.currentVerse.verse,
        Math.max(1, Math.round(this.currentVerse.confidence / 10)),
      )
      .toPromise();

    this.showConfidence = false;

    if (this.currentIndex < this.quizVerses.length - 1) {
      this.currentIndex++;
      this.currentVerse = this.quizVerses[this.currentIndex];
      this.stageCompleted = { full: false, initials: false };
      this.updateProgress();
    } else {
      this.calculateResults();
    }
  }

  calculateResults() {
    const totalConfidence = this.quizVerses.reduce(
      (sum, v) => sum + v.confidence,
      0,
    );
    this.averageScore = Math.round(totalConfidence / this.quizVerses.length);

    this.passed = this.averageScore >= this.passThreshold;

    // Stars: 3 for 100%, 2 for 85%+, 1 for 70%+
    if (this.averageScore >= 100) {
      this.finalStars = 3;
    } else if (this.averageScore >= 85) {
      this.finalStars = 2;
    } else if (this.averageScore >= 70) {
      this.finalStars = 1;
    } else {
      this.finalStars = 0;
    }

    this.showResults = true;
  }

  updateProgress() {
    const totalStages = this.quizVerses.length * 3;
    const completedStages =
      this.currentIndex * 3 +
      (this.stageCompleted.full ? 1 : 0) +
      (this.stageCompleted.initials ? 1 : 0);
    this.progressPercentage = (completedStages / totalStages) * 100;
  }

  async retryQuiz() {
    // Reset quiz
    this.quizVerses.forEach((v) => {
      v.confidence = 50;
      v.currentStage = 'full';
      v.audioUrl = undefined;
      v.audioBlob = undefined;
    });

    this.currentIndex = 0;
    this.currentVerse = this.quizVerses[0];
    this.stageCompleted = { full: false, initials: false };
    this.showResults = false;
    this.showConfidence = false;
    this.updateProgress();
  }

  async completeQuiz() {
    // Mark lesson as complete
    await this.courseService
      .completeLesson(this.lessonId, this.userId)
      .toPromise();

    // Navigate to next lesson
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

    this.quizVerses.forEach((verse) => {
      if (verse.audioUrl) {
        URL.revokeObjectURL(verse.audioUrl);
      }
    });
  }
}
