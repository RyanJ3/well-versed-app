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
import { BibleService } from '@services/api/bible.service';
import { UserService } from '@services/api/user.service';
import { RecordingService } from '@services/utils/recording.service';
import { BibleBook } from '@models/bible';
import { Subject, takeUntil } from 'rxjs';
import { trigger, style, transition, animate, keyframes, state } from '@angular/animations';

// Import all child components
import { SetupStageComponent } from './components/setup-stage/setup-stage.component';
import { ProgressJourneyComponent, ProgressMarker } from './components/progress-journey/progress-journey.component';
import { VerseBubblesComponent, Verse } from './components/verse-bubbles/verse-bubbles.component';
import { PracticeStageComponent, PracticeSettings } from './components/practice-stage/practice-stage.component';
import { CompletionStageComponent } from './components/completion-stage/completion-stage.component';
import { SettingsMenuComponent } from './components/settings-menu/settings-menu.component';
import { NavigationControlsComponent } from './components/navigation-controls/navigation-controls.component';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';

// Import types
import { ReviewStage, StarPopup, AnimatedStar } from './memorization-modal.types';

@Component({
  selector: 'app-memorization-modal',
  standalone: true,
  imports: [
    CommonModule,
    SetupStageComponent,
    ProgressJourneyComponent,
    VerseBubblesComponent,
    PracticeStageComponent,
    CompletionStageComponent,
    SettingsMenuComponent,
    NavigationControlsComponent,
    ConfirmationModalComponent
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('popupSlide', [
      state('show', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      state('hide', style({
        opacity: 0,
        transform: 'translateY(10px)'
      })),
      transition('hide => show', animate('300ms ease-out')),
      transition('show => hide', animate('200ms ease-in'))
    ]),
    trigger('starMove', [
      transition(':enter', [
        animate('800ms cubic-bezier(0.4, 0, 0.2, 1)', keyframes([
          style({ 
            transform: 'translate(0, 0) scale(1)', 
            opacity: 1,
            offset: 0 
          }),
          style({ 
            transform: 'translate(var(--endX), var(--endY)) scale(0.8)', 
            opacity: 1,
            offset: 0.9 
          }),
          style({ 
            transform: 'translate(var(--endX), var(--endY)) scale(0)', 
            opacity: 0,
            offset: 1 
          })
        ]))
      ])
    ]),
    trigger('floatingNotification', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50%) translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(-50%) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(-50%) translateY(-20px)' }))
      ])
    ])
  ],
  templateUrl: './memorization-modal.component.html',
  styleUrls: ['./memorization-modal.component.scss']
})
export class MemorizationModalComponent implements OnInit, OnDestroy {
  @Input() verses: Verse[] = [];
  @Input() chapterId = 0;
  @Input() chapterName = '';
  @Input() verseCount = 0;

  @Output() completed = new EventEmitter<{ memorized: boolean }>();

  // Book order and core state
  private readonly bookOrder = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];
  
  visible = true;
  setup = true;
  groupSize = 2;
  allStages: ReviewStage[] = [];
  currentStageIndex = 0;
  currentSubStageIndex = 0;
  currentStepIndex = 0;
  promptSave = false;
  completedSteps = 0;
  totalSteps = 0;
  showExitConfirm = false;
  showExitWithoutSaveConfirm = false;

  practiceSettings: PracticeSettings = {
    fontSize: 16,
    layoutMode: 'column'
  };

  startTime = 0;
  timeSpent = 0;
  hoveredGroup = -1;
  progressMarkers: ProgressMarker[] = [];
  starPopup: StarPopup | null = null;
  floatingMessage = '';
  animatedStar: AnimatedStar = {
    show: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  };
  
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

  private destroy$ = new Subject<void>();
  private userId = 1;

  get progressPercentage(): number {
    return this.totalSteps ? Math.round((this.completedSteps / this.totalSteps) * 100) : 0;
  }

  get currentStage(): ReviewStage | null {
    return this.allStages[this.currentStageIndex] || null;
  }

  get currentVerses(): Verse[] {
    if (!this.currentStage) return [];
    return this.currentStage.groups[this.currentSubStageIndex] || [];
  }

  get canGoBack(): boolean {
    if (this.setup || this.promptSave) return false;
    return this.completedSteps > 0;
  }

  get displayChapterName(): string {
    return this.isSingleChapterBook ? this.currentBook : this.chapterName;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && !this.setup && !this.promptSave) {
      this.confirmExit();
    } else if (event.key === 'Enter' && !this.setup && !this.isSaving) {
      this.next();
    }
  }

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private router: Router,
    private recordingService: RecordingService
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

  // Parsing and initialization methods
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
      const currentBookIndex = this.bookOrder.findIndex(book =>
        book.toLowerCase() === this.currentBook.toLowerCase()
      );
      if (currentBookIndex >= 0 && currentBookIndex < this.bookOrder.length - 1) {
        const nextBook = this.bookOrder[currentBookIndex + 1];
        this.nextChapterName = `${nextBook} 1`;
      }
    } else {
      this.nextChapterName = `${this.currentBook} ${this.currentChapterNum + 1}`;
    }
  }

  // Group and stage management
  getOriginalGroups(): Verse[][] {
    const groups: Verse[][] = [];
    for (let i = 0; i < this.verses.length; i += this.groupSize) {
      groups.push(this.verses.slice(i, i + this.groupSize));
    }
    return groups;
  }

  getActiveGroupIndices(): number[] {
    if (!this.currentStage) return [];
    const currentVerses = this.currentVerses;
    const verseCodes = new Set(currentVerses.map(v => v.code));
    const indices: number[] = [];
    let groupIndex = 0;
    for (let i = 0; i < this.verses.length; i += this.groupSize) {
      const group = this.verses.slice(i, i + this.groupSize);
      if (group.some(v => verseCodes.has(v.code))) {
        indices.push(groupIndex);
      }
      groupIndex++;
    }
    return indices;
  }

  start() {
    this.setup = false;
    this.startTime = Date.now();
    this.buildAllStages();
    this.buildProgressMarkers();
    this.currentStageIndex = 0;
    this.currentSubStageIndex = 0;
    this.currentStepIndex = 0;
    this.completedSteps = 0;
  }

buildAllStages() {
    this.allStages = [];
    const originalGroups = this.getOriginalGroups();
    this.allStages.push({
      groups: originalGroups,
      stageType: 'individual',
      stageLevel: 0
    });

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
      this.allStages.push({
        groups: nextGroups,
        stageType: 'review',
        stageLevel: reviewLevel
      });
      currentGroups = nextGroups;
      reviewLevel++;
    }

    this.totalSteps = 0;
    for (const stage of this.allStages) {
      this.totalSteps += stage.groups.length * 4; // Changed from 3 to 4
    }
  }

  buildProgressMarkers() {
    this.progressMarkers = [];
    let stepCount = 0;
    for (let stageIdx = 0; stageIdx < this.allStages.length; stageIdx++) {
      const stage = this.allStages[stageIdx];
      const isLastStage = stageIdx === this.allStages.length - 1;
      for (let groupIdx = 0; groupIdx < stage.groups.length; groupIdx++) {
        stepCount += 3;
        const position = (stepCount / this.totalSteps) * 100;
        const isFinalMarker = isLastStage && groupIdx === stage.groups.length - 1;
        if (isFinalMarker) {
          this.progressMarkers.push({
            position,
            type: 'finish',
            completed: false,
            id: 'finish-goal',
            label: 'Finish!'
          });
        } else if (groupIdx < stage.groups.length - 1 || isLastStage) {
          this.progressMarkers.push({
            position,
            type: 'star',
            completed: false,
            id: `star-${stageIdx}-${groupIdx}`,
            label: `Group ${groupIdx + 1}`
          });
        }
      }
      if (!isLastStage) {
        const position = (stepCount / this.totalSteps) * 100;
        const phaseNumber = stage.stageType === 'individual' ? 1 : stage.stageLevel + 1;
        this.progressMarkers.push({
          position,
          type: 'flag',
          completed: false,
          id: `flag-${stageIdx}`,
          label: `Phase ${phaseNumber}`
        });
      }
    }
  }

  updateProgressMarkers() {
    let stepCount = 0;
    for (let stageIdx = 0; stageIdx < this.allStages.length; stageIdx++) {
      const stage = this.allStages[stageIdx];
      const isLastStage = stageIdx === this.allStages.length - 1;
      for (let groupIdx = 0; groupIdx < stage.groups.length; groupIdx++) {
        stepCount += 3;
        const markerId = isLastStage && groupIdx === stage.groups.length - 1
          ? 'finish-goal'
          : `star-${stageIdx}-${groupIdx}`;
        const marker = this.progressMarkers.find(m => m.id === markerId);
        if (marker && !marker.completed && this.completedSteps >= stepCount) {
          const message = this.getStarMessage(stage, groupIdx, marker.type === 'finish');
          this.showStarPopup(marker.id, message);
          this.animateStarToMarker(marker);
          setTimeout(() => {
            marker.completed = true;
            this.hideStarPopup();
          }, 800);
        }
      }
      if (!isLastStage) {
        const flagMarker = this.progressMarkers.find(m => m.id === `flag-${stageIdx}`);
        if (flagMarker) {
          flagMarker.completed = this.completedSteps >= stepCount;
        }
      }
    }
  }

  getStarMessage(stage: ReviewStage, groupIdx: number, isFinal: boolean): string {
    if (isFinal) return 'Chapter Complete!';
    if (stage.stageType === 'individual') return `Finished Group ${groupIdx + 1}`;
    if (stage.stageType === 'review') return `Review Set ${groupIdx + 1} Complete!`;
    return 'Great job!';
  }

  showStarPopup(starId: string, message: string) {
    this.starPopup = { starId, message, show: true, visible: false };
    setTimeout(() => {
      const starElement = document.querySelector(`[id="${starId}"]`)?.closest('.marker') as HTMLElement;
      const popup = document.querySelector('.star-popup') as HTMLElement;
      if (starElement && popup) {
        const starRect = starElement.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        const left = starRect.left + (starRect.width / 2) - (popupRect.width / 2);
        const top = starRect.top - popupRect.height - 20;
        popup.style.left = `${Math.max(10, Math.min(left, window.innerWidth - popupRect.width - 10))}px`;
        popup.style.top = `${Math.max(10, top)}px`;
        if (this.starPopup) {
          this.starPopup.visible = true;
        }
      }
    }, 50);
  }

  hideStarPopup() {
    if (this.starPopup) {
      this.starPopup.show = false;
      this.starPopup.visible = false;
      setTimeout(() => {
        this.starPopup = null;
      }, 200);
    }
  }

  animateStarToMarker(marker: ProgressMarker) {
    const popup = document.querySelector('.star-popup') as HTMLElement;
    const markerElement = document.querySelector(`[id="${marker.id}"]`) as HTMLElement;
    if (!popup || !markerElement) return;
    const popupRect = popup.getBoundingClientRect();
    const markerRect = markerElement.getBoundingClientRect();
    this.animatedStar = {
      show: true,
      startX: popupRect.left + popupRect.width / 2,
      startY: popupRect.top + popupRect.height / 2,
      endX: markerRect.left + markerRect.width / 2,
      endY: markerRect.top + markerRect.height / 2
    };
    setTimeout(() => {
      const starEl = document.querySelector('.animated-star') as HTMLElement;
      if (starEl) {
        starEl.style.setProperty('--endX', `${this.animatedStar.endX - this.animatedStar.startX}px`);
        starEl.style.setProperty('--endY', `${this.animatedStar.endY - this.animatedStar.startY}px`);
      }
    }, 10);
  }

  onStarAnimationDone() {
    this.animatedStar.show = false;
  }

  showFloatingMessage(message: string) {
    this.floatingMessage = message;
    setTimeout(() => {
      this.floatingMessage = '';
    }, 2500);
  }

  // Navigation methods
  jumpToStep(stepIndex: number) {
    if (this.setup || this.promptSave) return;
    const diff = stepIndex - this.currentStepIndex;
    this.currentStepIndex = stepIndex;
    this.completedSteps = Math.min(
      Math.max(this.completedSteps + diff, 0),
      this.totalSteps
    );
    this.updateProgressMarkers();
  }

  next() {
    if (!this.currentStage || this.isSaving) return;
    this.completedSteps++;
    if (this.currentStepIndex < 2) {
      this.currentStepIndex++;
    } else {
      this.currentStepIndex = 0;
      if (this.currentSubStageIndex < this.currentStage.groups.length - 1) {
        this.currentSubStageIndex++;
      } else {
        this.currentSubStageIndex = 0;
        this.currentStageIndex++;
        this.recordingService.resetRecording();
        if (this.currentStageIndex >= this.allStages.length) {
          this.showSavePrompt();
        } else {
          const messages = [
            "Let's combine what you've learned!",
            'Ready for the next level?',
            'Time to review together!',
            'Almost there, keep going!'
          ];
          this.showFloatingMessage(messages[this.currentStageIndex % messages.length]);
        }
      }
    }
    this.updateProgressMarkers();
  }

  prev() {
    if (this.completedSteps <= 0) return;
    this.completedSteps--;
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
    } else {
      this.currentStepIndex = 2;
      if (this.currentSubStageIndex > 0) {
        this.currentSubStageIndex--;
      } else {
        this.currentStageIndex--;
        if (this.currentStageIndex >= 0 && this.allStages[this.currentStageIndex]) {
          this.currentSubStageIndex = this.allStages[this.currentStageIndex].groups.length - 1;
          this.recordingService.resetRecording();
        }
      }
    }
    this.updateProgressMarkers();
  }

  // Save and completion methods
  showSavePrompt() {
    this.timeSpent = Date.now() - this.startTime;
    this.promptSave = true;
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
        setTimeout(() => {
          this.showNavigationOptions = true;
        }, 300);
      }, 1200);
    } catch (err) {
      console.error('Error marking chapter memorized', err);
      this.saveError = true;
      this.hasMarkedComplete = false;
    } finally {
      this.isSaving = false;
    }
  }

  // Navigation methods
  exitWithoutSaving() {
    this.showExitWithoutSaveConfirm = true;
  }

  confirmExitWithoutSave() {
    this.visible = false;
    this.completed.emit({ memorized: false });
  }

  goToTracker() {
    this.visible = false;
    this.completed.emit({ memorized: true });
    this.router.navigate(['/tracker'], { queryParams: { memorized: true } });
  }

  goToFlow() {
    this.visible = false;
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
    this.visible = false;
    this.completed.emit({ memorized: this.hasMarkedComplete });
  }

  confirmExit() {
    // If already saved, close directly without confirmation
    if (this.hasMarkedComplete || this.showNavigationOptions) {
      this.visible = false;
      this.completed.emit({ memorized: true });
      return;
    }
    
    // Otherwise show confirmation dialog
    this.showExitConfirm = true;
  }

  confirmExitAction() {
    this.visible = false;
    this.completed.emit({ memorized: false });
  }
}