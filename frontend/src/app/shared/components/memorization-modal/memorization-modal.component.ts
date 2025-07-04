import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BibleService } from '../../../core/services/bible.service';
import { UserService } from '../../../core/services/user.service';
import { BibleBook } from '../../../core/models/bible';
import { Subject, takeUntil } from 'rxjs';

import { SetupStageComponent } from './components/setup-stage/setup-stage.component';
import { PracticeStageComponent } from './components/practice-stage/practice-stage.component';
import { CompletionStageComponent } from './components/completion-stage/completion-stage.component';
import { ProgressHeaderComponent } from './components/progress-header/progress-header.component';

import {
  Verse,
  ReviewStage,
  ProgressMarker,
  StarPopup,
  AnimatedStar,
  PracticeSettings,
  MemorizationState
} from './models/memorization.types';
import { BOOK_ORDER, STAGE_NAMES, PROGRESS_MESSAGES } from './models/memorization.constants';
import { memorizationAnimations } from './animations/memorization.animations';

@Component({
  selector: 'app-memorization-modal',
  standalone: true,
  imports: [
    CommonModule,
    SetupStageComponent,
    PracticeStageComponent,
    CompletionStageComponent,
    ProgressHeaderComponent
  ],
  animations: memorizationAnimations,
  templateUrl: './memorization-modal.component.html',
  styleUrls: ['./memorization-modal.component.scss'],
})
export class MemorizationModalComponent implements OnInit, OnDestroy {
  @Input() verses: Verse[] = [];
  @Input() chapterId = 0;
  @Input() chapterName = '';
  @Input() verseCount = 0;

  @Output() completed = new EventEmitter<{ memorized: boolean }>();

  state: MemorizationState = {
    visible: true,
    setup: true,
    groupSize: 2,
    allStages: [],
    currentStageIndex: 0,
    currentSubStageIndex: 0,
    currentStepIndex: 0,
    promptSave: false,
    completedSteps: 0,
    totalSteps: 0,
    showExitConfirm: false,
    showExitWithoutSaveConfirm: false
  };

  practiceSettings: PracticeSettings = {
    fontSize: 16,
    layoutMode: 'column'
  };

  startTime = 0;
  timeSpent = 0;

  progressMarkers: ProgressMarker[] = [];
  starPopup: StarPopup | null = null;
  floatingMessage = '';
  animatedStar: AnimatedStar = { show: false, startX: 0, startY: 0, endX: 0, endY: 0 };
  showConfetti = false;
  hasMarkedComplete = false;
  showNavigationOptions = false;
  nextChapterName = '';
  isSingleChapterBook = false;
  isLastChapterOfBible = false;
  isSaving = false;
  saveError = false;
  showSuccessCheck = false;

  private bookChapters = 0;
  currentBook = '';
  currentChapterNum = 0;

  Math = Math;
  private destroy$ = new Subject<void>();
  private userId = 1;

  get progressPercentage(): number {
    return this.state.totalSteps
      ? Math.round((this.state.completedSteps / this.state.totalSteps) * 100)
      : 0;
  }

  get currentStage(): ReviewStage | null {
    return this.state.allStages[this.state.currentStageIndex] || null;
  }

  get currentVerses(): Verse[] {
    if (!this.currentStage) return [];
    return this.currentStage.groups[this.state.currentSubStageIndex] || [];
  }

  get canGoBack(): boolean {
    if (this.state.setup || this.state.promptSave) return false;
    return this.state.completedSteps > 0;
  }

  get stageNames(): string[] {
    return STAGE_NAMES;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && !this.state.setup && !this.state.promptSave) {
      this.confirmExit();
    } else if (event.key === 'Enter' && !this.state.setup && !this.isSaving) {
      this.next();
    }
  }

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
        }
      });

    this.parseChapterInfo();
    this.detectSingleChapterBook();
    this.getNextChapterName();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  parseChapterInfo() {
    const match = this.chapterName.match(/^(.+?)\s+(\d+)$/);
    if (match) {
      this.currentBook = match[1];
      this.currentChapterNum = parseInt(match[2]);
    } else {
      this.currentBook = this.chapterName;
      this.currentChapterNum = 1;
    }
  }

  async detectSingleChapterBook() {
    try {
      const books = await this.bibleService.getBooks().toPromise();
      const currentBookInfo = books?.find((book: BibleBook) =>
        book.name === this.currentBook || book.name === this.chapterName
      );
      if (currentBookInfo) {
        this.bookChapters = currentBookInfo.chapters?.length || 1;
        this.isSingleChapterBook = this.bookChapters === 1;
      }
    } catch (error) {
      this.isSingleChapterBook = this.verses.every(v => v.chapter === 1);
    }
  }

  getNextChapterName() {
    if (this.currentBook === 'Revelation' && this.currentChapterNum === 22) {
      this.isLastChapterOfBible = true;
      this.nextChapterName = '';
      return;
    }

    if (this.bookChapters > 0 && this.currentChapterNum >= this.bookChapters) {
      const currentBookIndex = BOOK_ORDER.findIndex(book =>
        book.toLowerCase() === this.currentBook.toLowerCase()
      );
      if (currentBookIndex >= 0 && currentBookIndex < BOOK_ORDER.length - 1) {
        const nextBook = BOOK_ORDER[currentBookIndex + 1];
        this.nextChapterName = `${nextBook} 1`;
      }
    } else {
      this.nextChapterName = `${this.currentBook} ${this.currentChapterNum + 1}`;
    }
  }

  onGroupSizeChange(size: number) {
    this.state.groupSize = size;
  }

  onSettingsChange(settings: PracticeSettings) {
    this.practiceSettings = settings;
  }

  start() {
    this.state.setup = false;
    this.startTime = Date.now();
    this.buildAllStages();
    this.buildProgressMarkers();
    this.state.currentStageIndex = 0;
    this.state.currentSubStageIndex = 0;
    this.state.currentStepIndex = 0;
    this.state.completedSteps = 0;
  }

  buildAllStages() {
    this.state.allStages = [];
    const originalGroups = this.getOriginalGroups();
    this.state.allStages.push({ groups: originalGroups, stageType: 'individual', stageLevel: 0 });

    let currentGroups = [...originalGroups];
    let reviewLevel = 1;

    while (currentGroups.length > 1) {
      const nextGroups: Verse[][] = [];
      for (let i = 0; i < currentGroups.length; i += 2) {
        if (i + 1 < currentGroups.length) {
          nextGroups.push([...currentGroups[i], ...currentGroups[i + 1]]);
        } else if (i === currentGroups.length - 1 && currentGroups.length > 2) {
          const lastGroup = nextGroups[nextGroups.length - 1];
          if (lastGroup) {
            lastGroup.push(...currentGroups[i]);
          }
        } else {
          nextGroups.push(currentGroups[i]);
        }
      }
      this.state.allStages.push({ groups: nextGroups, stageType: 'review', stageLevel: reviewLevel });
      currentGroups = nextGroups;
      reviewLevel++;
    }

    this.state.totalSteps = 0;
    for (const stage of this.state.allStages) {
      this.state.totalSteps += stage.groups.length * 3;
    }
  }

  getOriginalGroups(): Verse[][] {
    const groups: Verse[][] = [];
    for (let i = 0; i < this.verses.length; i += this.state.groupSize) {
      groups.push(this.verses.slice(i, i + this.state.groupSize));
    }
    return groups;
  }

  buildProgressMarkers() {
    this.progressMarkers = [];
    let stepCount = 0;

    for (let stageIdx = 0; stageIdx < this.state.allStages.length; stageIdx++) {
      const stage = this.state.allStages[stageIdx];
      const isLastStage = stageIdx === this.state.allStages.length - 1;
      for (let groupIdx = 0; groupIdx < stage.groups.length; groupIdx++) {
        stepCount += 3;
        const position = (stepCount / this.state.totalSteps) * 100;
        const isFinalMarker = isLastStage && groupIdx === stage.groups.length - 1;
        if (isFinalMarker) {
          this.progressMarkers.push({ position, type: 'finish', completed: false, id: 'finish-goal', label: 'Finish!' });
        } else if (groupIdx < stage.groups.length - 1 || isLastStage) {
          this.progressMarkers.push({ position, type: 'star', completed: false, id: `star-${stageIdx}-${groupIdx}`, label: `Group ${groupIdx + 1}` });
        }
      }
      if (!isLastStage) {
        const position = (stepCount / this.state.totalSteps) * 100;
        const phaseNumber = stage.stageType === 'individual' ? 1 : stage.stageLevel + 1;
        this.progressMarkers.push({ position, type: 'flag', completed: false, id: `flag-${stageIdx}`, label: `Phase ${phaseNumber}` });
      }
    }
  }

  updateProgressMarkers() {
    let stepCount = 0;
    for (let stageIdx = 0; stageIdx < this.state.allStages.length; stageIdx++) {
      const stage = this.state.allStages[stageIdx];
      const isLastStage = stageIdx === this.state.allStages.length - 1;
      for (let groupIdx = 0; groupIdx < stage.groups.length; groupIdx++) {
        stepCount += 3;
        const markerId = isLastStage && groupIdx === stage.groups.length - 1 ? 'finish-goal' : `star-${stageIdx}-${groupIdx}`;
        const marker = this.progressMarkers.find(m => m.id === markerId);
        if (marker && !marker.completed && this.state.completedSteps >= stepCount) {
          marker.completed = true;
        }
      }
      if (!isLastStage) {
        const flagMarker = this.progressMarkers.find(m => m.id === `flag-${stageIdx}`);
        if (flagMarker) {
          flagMarker.completed = this.state.completedSteps >= stepCount;
        }
      }
    }
  }

  showFloatingMessage(message: string) {
    this.floatingMessage = message;
    setTimeout(() => {
      this.floatingMessage = '';
    }, 2500);
  }

  jumpToStep(stepIndex: number) {
    if (this.state.setup || this.state.promptSave) return;
    const diff = stepIndex - this.state.currentStepIndex;
    this.state.currentStepIndex = stepIndex;
    this.state.completedSteps = Math.min(Math.max(this.state.completedSteps + diff, 0), this.state.totalSteps);
    this.updateProgressMarkers();
  }

  next() {
    if (!this.currentStage || this.isSaving) return;
    this.state.completedSteps++;
    if (this.state.currentStepIndex < 2) {
      this.state.currentStepIndex++;
    } else {
      this.state.currentStepIndex = 0;
      if (this.state.currentSubStageIndex < this.currentStage.groups.length - 1) {
        this.state.currentSubStageIndex++;
      } else {
        this.state.currentSubStageIndex = 0;
        this.state.currentStageIndex++;
        if (this.state.currentStageIndex >= this.state.allStages.length) {
          this.showSavePrompt();
        } else {
          const message = PROGRESS_MESSAGES[this.state.currentStageIndex % PROGRESS_MESSAGES.length];
          this.showFloatingMessage(message);
        }
      }
    }
    this.updateProgressMarkers();
  }

  prev() {
    if (this.state.completedSteps <= 0) return;
    this.state.completedSteps--;
    if (this.state.currentStepIndex > 0) {
      this.state.currentStepIndex--;
    } else {
      this.state.currentStepIndex = 2;
      if (this.state.currentSubStageIndex > 0) {
        this.state.currentSubStageIndex--;
      } else {
        this.state.currentStageIndex--;
        if (this.state.currentStageIndex >= 0 && this.state.allStages[this.state.currentStageIndex]) {
          this.state.currentSubStageIndex = this.state.allStages[this.state.currentStageIndex].groups.length - 1;
        }
      }
    }
    this.updateProgressMarkers();
  }

  showSavePrompt() {
    this.timeSpent = Date.now() - this.startTime;
    this.state.promptSave = true;
    this.showConfetti = true;
    setTimeout(() => { this.showConfetti = false; }, 2500);
  }

  async markAsComplete() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.saveError = false;
    try {
      const chapterNum = this.verses[0]?.chapter || 1;
      await this.bibleService.saveChapter(this.userId, this.chapterId, chapterNum).toPromise();
      this.hasMarkedComplete = true;
      this.showSuccessCheck = true;
      setTimeout(() => {
        this.showSuccessCheck = false;
        setTimeout(() => { this.showNavigationOptions = true; }, 300);
      }, 1200);
    } catch {
      this.saveError = true;
      this.hasMarkedComplete = false;
    } finally {
      this.isSaving = false;
    }
  }

  exitWithoutSaving() {
    this.state.showExitWithoutSaveConfirm = true;
  }

  cancelExitWithoutSave() {
    this.state.showExitWithoutSaveConfirm = false;
  }

  confirmExitWithoutSave() {
    this.state.visible = false;
    this.completed.emit({ memorized: false });
  }

  goToTracker() {
    this.state.visible = false;
    this.completed.emit({ memorized: true });
    this.router.navigate(['/tracker'], { queryParams: { memorized: true } });
  }

  goToFlow() {
    this.state.visible = false;
    this.completed.emit({ memorized: true });
    let queryParams: any = {};
    if (this.nextChapterName) {
      const match = this.nextChapterName.match(/^(.+?)\s+(\d+)$/);
      if (match) {
        const bookName = match[1];
        const chapterNum = parseInt(match[2], 10);
        const bibleData = this.bibleService.getBibleData();
        if (bibleData && bibleData.books) {
          const nextBook = bibleData.books.find((b: BibleBook) => b.name === bookName);
          if (nextBook) {
            queryParams = { bookId: nextBook.id, chapter: chapterNum };
          }
        }
      }
    }
    this.router.navigate(['/flow'], { queryParams });
  }

  closeModal() {
    this.state.visible = false;
    this.completed.emit({ memorized: this.hasMarkedComplete });
  }

  confirmExit() {
    this.state.showExitConfirm = true;
  }

  cancelExit() {
    this.state.showExitConfirm = false;
  }

  confirmExitAction() {
    this.state.visible = false;
    this.completed.emit({ memorized: false });
  }
}
