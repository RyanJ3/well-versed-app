import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BibleService } from '../../../core/services/bible.service';
import { UserService } from '../../../core/services/user.service';

interface Verse {
  id: number;
  reference: string;
  text: string;
  firstLetters: string;
}

interface Stage {
  type: 'individual' | 'review' | 'final';
  name: string;
  groups: number[];
  subSteps: ('read' | 'flow' | 'memory')[];
  completed: boolean;
}

@Component({
  selector: 'app-memorization-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="show" class="memorization-modal">
      <!-- Settings Screen -->
      <div *ngIf="showSettings" class="settings-screen">
        <div class="settings-card">
          <h2 class="title">Practice Settings</h2>
          <p class="subtitle">How many verses per group?</p>
          <div class="option-row">
            <button
              class="option-btn"
              *ngFor="let n of [1,2,3]"
              [class.selected]="versesPerGroup === n"
              (click)="versesPerGroup = n"
            >
              {{n}}
            </button>
          </div>
          <button class="start-btn" (click)="initPractice()">Start Practice</button>
        </div>
      </div>

      <!-- Practice Area -->
      <div *ngIf="!showSettings" class="practice-area">
        <div class="header">
          <h3 class="chapter">{{chapterName}}</h3>
          <span class="progress">{{progressPercent}}% Complete</span>
        </div>

        <div class="verses-box">
          <div *ngFor="let v of currentVerses; let i=index" class="verse">
            <p class="ref">{{v.reference}}</p>
            <p class="text" [ngClass]="{'memory': currentSubStep==='memory', 'flow': currentSubStep==='flow'}">
              {{ displayText(v) }}
            </p>
          </div>
        </div>

        <div class="instructions">
          <p *ngIf="currentSubStep==='read'">Read the verses aloud 2-3 times</p>
          <p *ngIf="currentSubStep==='flow'">Read aloud using only first letters</p>
          <p *ngIf="currentSubStep==='memory'">Recite from memory</p>
        </div>

        <div class="recording">
          <button class="record-btn" (click)="toggleRecording()" [disabled]="!canRecord">
            {{ isRecording ? 'Stop' : 'Record' }}
          </button>
          <button *ngIf="audioUrl && !isRecording" class="play-btn" (click)="playRecording()">Play</button>
          <button *ngIf="audioUrl && !isRecording" class="redo-btn" (click)="deleteRecording()">Redo</button>
        </div>

        <div class="nav">
          <button class="next-btn" (click)="advance()" [disabled]="isRecording">Continue</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .memorization-modal{position:fixed;inset:0;background:#f3f4f6;z-index:2000;overflow:auto;display:flex;align-items:center;justify-content:center;}
    .settings-screen{width:100%;display:flex;align-items:center;justify-content:center;}
    .settings-card{background:white;padding:2rem;border-radius:1rem;max-width:320px;width:100%;text-align:center;box-shadow:0 10px 20px rgba(0,0,0,0.1);}
    .option-row{display:flex;gap:1rem;justify-content:center;margin:1rem 0;}
    .option-btn{border:1px solid #ccc;border-radius:0.5rem;padding:0.5rem 1rem;cursor:pointer;background:white;}
    .option-btn.selected{background:#3b82f6;color:white;border-color:#3b82f6;}
    .start-btn{background:#3b82f6;color:white;border:none;padding:0.5rem 1rem;border-radius:0.5rem;cursor:pointer;}
    .practice-area{padding:1rem 0.5rem;width:100%;max-width:600px;margin:0 auto;}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;}
    .verses-box{background:white;padding:1rem;border-radius:0.5rem;margin-bottom:1rem;}
    .verse+.verse{margin-top:1rem;border-top:1px solid #e5e7eb;padding-top:1rem;}
    .text.flow{font-family:monospace;}
    .text.memory{color:#d1d5db;text-align:center;font-size:1.5rem;}
    .instructions{text-align:center;margin-bottom:1rem;}
    .recording{display:flex;justify-content:center;gap:1rem;margin-bottom:1rem;}
    .record-btn,.play-btn,.redo-btn{padding:0.5rem 1rem;border-radius:0.5rem;border:none;cursor:pointer;background:#3b82f6;color:white;}
    .redo-btn{background:#6b7280;}
    .nav{text-align:center;}
    .next-btn{padding:0.5rem 1rem;background:#10b981;color:white;border:none;border-radius:0.5rem;cursor:pointer;}
  `]
})
export class MemorizationModalComponent implements OnInit {
  @Input() show = false;
  @Input() verses: Verse[] = [];
  @Input() bookId = 0;
  @Input() chapter = 0;
  @Input() chapterName = '';
  @Input() verseCount = 0;

  @Output() complete = new EventEmitter<boolean>();

  showSettings = true;
  versesPerGroup = 2;

  groups: Verse[][] = [];
  stages: Stage[] = [];
  currentStageIndex = 0;
  currentSubStep: 'read' | 'flow' | 'memory' = 'read';
  totalSubSteps = 0;
  completedSubSteps = 0;

  mediaRecorder?: MediaRecorder;
  audioChunks: Blob[] = [];
  audioUrl: string | null = null;
  isRecording = false;
  canRecord = false;

  userId = 1;

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.currentUser$.subscribe((u) => {
      if (u) this.userId = typeof u.id === 'string' ? parseInt(u.id) : u.id;
    });
    this.checkMic();
  }

  async checkMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      this.canRecord = true;
    } catch {
      this.canRecord = false;
    }
  }

  initPractice() {
    this.showSettings = false;
    this.buildGroups();
    this.buildStages();
  }

  buildGroups() {
    this.groups = [];
    for (let i = 0; i < this.verses.length; i += this.versesPerGroup) {
      this.groups.push(this.verses.slice(i, i + this.versesPerGroup));
    }
  }

  buildStages() {
    this.stages = [];
    this.groups.forEach((_, idx) => {
      this.stages.push({
        type: 'individual',
        name: `Group ${idx + 1}`,
        groups: [idx],
        subSteps: ['read', 'flow', 'memory'],
        completed: false
      });
    });

    let level = this.groups.map((_, i) => i);
    let size = 2;
    while (level.length > 1) {
      for (let i = 0; i < level.length; i += size) {
        const ids = level.slice(i, i + size);
        this.stages.push({
          type: 'review',
          name: 'Review',
          groups: ids,
          subSteps: ['memory'],
          completed: false
        });
      }
      level = level.map((_, i) => i);
      size = Math.min(size * 2, level.length);
    }

    this.stages.push({
      type: 'final',
      name: 'Final Review',
      groups: this.groups.map((_, i) => i),
      subSteps: ['memory'],
      completed: false
    });

    this.totalSubSteps = this.stages.reduce((s, st) => s + st.subSteps.length, 0);
    this.currentSubStep = this.stages[0].subSteps[0];
  }

  get currentStage(): Stage | null {
    return this.stages[this.currentStageIndex] || null;
  }

  get currentVerses(): Verse[] {
    if (!this.currentStage) return [];
    return this.currentStage.groups.flatMap((i) => this.groups[i]);
  }

  get progressPercent(): number {
    return this.totalSubSteps ? Math.floor((this.completedSubSteps / this.totalSubSteps) * 100) : 0;
  }

  displayText(v: Verse): string {
    if (this.currentSubStep === 'flow') return v.firstLetters;
    if (this.currentSubStep === 'memory') return '• • •';
    return v.text;
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    if (!this.canRecord) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];
    this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioUrl = URL.createObjectURL(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    this.mediaRecorder.start();
    this.isRecording = true;
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  playRecording() {
    if (this.audioUrl) {
      const audio = new Audio(this.audioUrl);
      audio.play();
    }
  }

  deleteRecording() {
    this.audioUrl = null;
    this.audioChunks = [];
  }

  advance() {
    this.deleteRecording();
    this.completedSubSteps++;
    const stage = this.currentStage;
    if (!stage) return;
    const subIndex = stage.subSteps.indexOf(this.currentSubStep);
    if (subIndex < stage.subSteps.length - 1) {
      this.currentSubStep = stage.subSteps[subIndex + 1];
      return;
    }
    stage.completed = true;
    if (this.currentStageIndex < this.stages.length - 1) {
      this.currentStageIndex++;
      this.currentSubStep = this.stages[this.currentStageIndex].subSteps[0];
    } else {
      this.finish();
    }
  }

  finish() {
    this.bibleService.saveChapter(this.userId, this.bookId, this.chapter).subscribe({
      next: () => {
        this.complete.emit(true);
        this.router.navigate(['/profile'], { queryParams: { memorized: true } });
      },
      error: () => {
        this.complete.emit(false);
        this.router.navigate(['/profile']);
      }
    });
  }
}
