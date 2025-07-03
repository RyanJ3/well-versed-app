import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BibleService } from '../../../core/services/bible.service';
import { UserService } from '../../../core/services/user.service';
import { BibleBook } from '../../../core/models/bible';
import { Subject, takeUntil } from 'rxjs';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

interface Verse {
  code: string;
  text: string;
  reference: string;
  bookId: number;
  chapter: number;
  verse: number;
}

interface ReviewStage {
  groups: Verse[][];
  stageType: 'individual' | 'review' | 'final';
  stageLevel: number;
}

interface ProgressMarker {
  position: number;
  type: 'star' | 'flag' | 'finish';
  completed: boolean;
  id: string;
  label?: string;
}

interface StarPopup {
  starId: string;
  message: string;
  show: boolean;
  visible: boolean;
}

interface AnimatedStar {
  show: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface PracticeSettings {
  fontSize: number;
  layoutMode: 'column' | 'paragraph';
}

@Component({
  selector: 'app-memorization-modal',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('celebration', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0)' }),
        animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('starFill', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0) rotate(180deg)' }),
        animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          style({ opacity: 1, transform: 'scale(1) rotate(0deg)' }))
      ])
    ]),
    trigger('flagRaise', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          style({ opacity: 1, transform: 'translateY(0)' }))
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
    trigger('borderPulse', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('verseTransition', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
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
    trigger('optionHover', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('progressPath', [
      transition(':enter', [
        style({ strokeDashoffset: 100 }),
        animate('1000ms ease-out', style({ strokeDashoffset: '*' }))
      ])
    ]),
    trigger('statReveal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms {{ delay }}ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })),
      ], { params: { delay: 0 } })
    ]),
    trigger('floatingNotification', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50%) translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(-50%) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(-50%) translateY(-20px)' }))
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
  templateUrl: './memorization-modal.component.html',
  styleUrls: ['./memorization-modal.component.scss'],
})
export class MemorizationModalComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() verses: Verse[] = [];
  @Input() chapterId = 0;
  @Input() chapterName = '';
  @Input() verseCount = 0;

  @Output() completed = new EventEmitter<{ memorized: boolean }>();

  @ViewChild('verseBubblesContainer') verseBubblesContainer!: ElementRef<HTMLDivElement>;

  // Canonical book order (66 books)
  private readonly bookOrder = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
    '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
    'Jude', 'Revelation'
  ];

  // Core state
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

  // Practice settings
  practiceSettings: PracticeSettings = {
    fontSize: 16,
    layoutMode: 'column'
  };

  // Time tracking
  startTime = 0;
  timeSpent = 0;

  // UI state
  borderLeft = 0;
  borderWidth = 0;
  hasActiveBorder = false;
  hoveredGroup = -1;
  progressMarkers: ProgressMarker[] = [];
  starPopup: StarPopup | null = null;
  floatingMessage = '';
  showSettingsDropdown = false;
  isGearSpinning = false;
  animatedStar: AnimatedStar = {
    show: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  };
  showConfetti = false;
  hasMarkedComplete = false;
  showNavigationOptions = false;
  nextChapterName = '';
  isSingleChapterBook = false;
  isLastChapterOfBible = false;
  isSaving = false;
  saveError = false;
  showSuccessCheck = false;

  // Book chapter data
  private bookChapters = 0;
  currentBook = '';
  currentChapterNum = 0;

  // Utilities
  Math = Math;
  private destroy$ = new Subject<void>();
  private userId = 1;

  get progressPercentage(): number {
    return this.totalSteps
      ? Math.round((this.completedSteps / this.totalSteps) * 100)
      : 0;
  }

  get currentStage(): ReviewStage | null {
    return this.allStages[this.currentStageIndex] || null;
  }

  get currentVerses(): Verse[] {
    if (!this.currentStage) return [];
    return this.currentStage.groups[this.currentSubStageIndex] || [];
  }

  get currentVerseRange(): string {
    const verses = this.currentVerses;
    if (!verses.length) return '';
    const start = verses[0].verse;
    const end = verses[verses.length - 1].verse;
    return start === end ? `${start}` : `${start} to ${end}`;
  }

  get progressDetail(): string {
    if (this.setup || this.promptSave || !this.currentStage) {
      return '';
    }

    if (this.currentStage.stageType === 'individual') {
      return `Group ${this.currentSubStageIndex + 1} of ${this.currentStage.groups.length}`;
    } else if (this.currentStage.stageType === 'review') {
      return `Review Level ${this.currentStage.stageLevel} - Set ${this.currentSubStageIndex + 1} of ${this.currentStage.groups.length}`;
    } else {
      return 'Final Review - All Verses';
    }
  }

  get canGoBack(): boolean {
    if (this.setup || this.promptSave) return false;
    return this.completedSteps > 0;
  }

  get currentInstruction(): string {
    if (this.promptSave) {
      return '';
    }
    switch (this.currentStepIndex) {
      case 0:
        return 'Read the verses aloud 2-3 times';
      case 1:
        return 'Read using only the first letters';
      default:
        return 'Recite from memory (dots are placeholders)';
    }
  }

  get estimatedTime(): number {
    const groupCount = Math.ceil(this.verses.length / this.groupSize);
    return Math.round(groupCount * 3 * 1.5);
  }

  get stageNames(): string[] {
    return ['Read', 'Flow', 'Memory'];
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
  ) { }

  ngOnInit() {
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.userId =
            typeof user.id === 'string' ? parseInt(user.id) : user.id;
        }
      });

    // Parse chapter info and get next chapter
    this.parseChapterInfo();
    this.detectSingleChapterBook();
    this.getNextChapterName();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked() {
    this.updateActiveBorder();
  }

  parseChapterInfo() {
    // Extract book name and chapter number from chapterName
    const match = this.chapterName.match(/^(.+?)\s+(\d+)$/);
    if (match) {
      this.currentBook = match[1];
      this.currentChapterNum = parseInt(match[2]);
    } else {
      // Single chapter book case
      this.currentBook = this.chapterName;
      this.currentChapterNum = 1;
    }
  }

  async detectSingleChapterBook() {
    try {
      const books = await this.bibleService.getBooks().toPromise();

      const currentBookInfo = books?.find((book: BibleBook) =>
        book.name === this.currentBook ||
        book.name === this.chapterName
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
    // Check if this is Revelation 22 (last chapter of the Bible)
    if (this.currentBook === 'Revelation' && this.currentChapterNum === 22) {
      this.isLastChapterOfBible = true;
      this.nextChapterName = '';
      return;
    }

    // Check if we're at the last chapter of the current book
    if (this.bookChapters > 0 && this.currentChapterNum >= this.bookChapters) {
      // Get next book
      const currentBookIndex = this.bookOrder.findIndex(book =>
        book.toLowerCase() === this.currentBook.toLowerCase()
      );

      if (currentBookIndex >= 0 && currentBookIndex < this.bookOrder.length - 1) {
        const nextBook = this.bookOrder[currentBookIndex + 1];
        this.nextChapterName = `${nextBook} 1`;
      }
    } else {
      // Next chapter in same book
      this.nextChapterName = `${this.currentBook} ${this.currentChapterNum + 1}`;
    }
  }

  getProgressColor(): string {
    const percentage = this.progressPercentage;
    if (percentage < 33) return '#3b82f6';
    if (percentage < 66) return '#8b5cf6';
    return '#10b981';
  }

  getStageColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    ];

    if (this.currentStepIndex > index) {
      return colors[2];
    }
    if (this.currentStepIndex === index) {
      return colors[index];
    }
    return 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
  }

  getStageIcon(stage: string): string {
    switch (stage) {
      case 'Read':
        return '📖';
      case 'Flow':
        return '〰️';
      case 'Memory':
        return '🧠';
      default:
        return stage.charAt(0);
    }
  }

  getStageChar(stage: string): string {
    return stage.charAt(0);
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

  increaseFontSize() {
    if (this.practiceSettings.fontSize < 24) {
      this.practiceSettings.fontSize += 2;
    }
  }

  decreaseFontSize() {
    if (this.practiceSettings.fontSize > 12) {
      this.practiceSettings.fontSize -= 2;
    }
  }

  setLayoutMode(mode: 'column' | 'paragraph') {
    this.practiceSettings.layoutMode = mode;
  }

  toggleSettingsDropdown() {
    this.showSettingsDropdown = !this.showSettingsDropdown;
    this.isGearSpinning = true;
    setTimeout(() => (this.isGearSpinning = false), 600);
  }

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

  updateActiveBorder() {
    if (this.setup || this.promptSave || !this.currentStage) {
      this.hasActiveBorder = false;
      return;
    }

    const activeIndices = this.getActiveGroupIndices();
    if (activeIndices.length === 0) {
      this.hasActiveBorder = false;
      return;
    }

    setTimeout(() => {
      const bubbles = document.querySelectorAll('.group-bubble');
      if (bubbles.length === 0) return;

      const firstIndex = Math.min(...activeIndices);
      const lastIndex = Math.max(...activeIndices);

      const firstBubble = bubbles[firstIndex] as HTMLElement;
      const lastBubble = bubbles[lastIndex] as HTMLElement;

      if (firstBubble && lastBubble) {
        const container = document.querySelector('.verse-bubbles') as HTMLElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const firstRect = firstBubble.getBoundingClientRect();
          const lastRect = lastBubble.getBoundingClientRect();

          this.borderLeft = firstRect.left - containerRect.left - 12;
          this.borderWidth = (lastRect.right - firstRect.left) + 24;
          this.hasActiveBorder = true;
        }
      }
    }, 50);
  }

  scrollToActiveVerses() {
    if (!this.verseBubblesContainer) return;

    setTimeout(() => {
      const activeIndices = this.getActiveGroupIndices();
      if (activeIndices.length === 0) return;

      const bubbles = document.querySelectorAll('.group-bubble');
      const firstIndex = Math.min(...activeIndices);
      const firstBubble = bubbles[firstIndex] as HTMLElement;

      if (firstBubble) {
        const container = this.verseBubblesContainer.nativeElement;
        const bubbleLeft = firstBubble.offsetLeft;
        const bubbleWidth = firstBubble.offsetWidth;
        const containerWidth = container.offsetWidth;

        const scrollPosition = bubbleLeft - (containerWidth / 2) + (bubbleWidth / 2);
        container.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      }
    }, 100);
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

  getOriginalGroups(): Verse[][] {
    const groups: Verse[][] = [];
    for (let i = 0; i < this.verses.length; i += this.groupSize) {
      groups.push(this.verses.slice(i, i + this.groupSize));
    }
    return groups;
  }

  setGroupSize(size: number) {
    this.groupSize = size;
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

    this.scrollToActiveVerses();
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
      this.totalSteps += stage.groups.length * 3;
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
    if (isFinal) {
      return 'Chapter Complete!';
    }

    if (stage.stageType === 'individual') {
      const groupNum = groupIdx + 1;
      return `Finished Group ${groupNum}`;
    } else if (stage.stageType === 'review') {
      return `Review Set ${groupIdx + 1} Complete!`;
    }
    return 'Great job!';
  }

  showStarPopup(starId: string, message: string) {
    this.starPopup = {
      starId,
      message,
      show: true,
      visible: false
    };

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

    // Set CSS variables for animation
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

  getGroupCount(): number {
    return Math.ceil(this.verses.length / this.groupSize);
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
        this.scrollToActiveVerses();
      } else {
        this.currentSubStageIndex = 0;
        this.currentStageIndex++;

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

          if (this.verseBubblesContainer) {
            this.verseBubblesContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
          }
          this.scrollToActiveVerses();
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
        }
      }
    }

    this.scrollToActiveVerses();
    this.updateProgressMarkers();
  }

  showSavePrompt() {
    this.timeSpent = Date.now() - this.startTime;
    this.promptSave = true;

    this.showConfetti = true;
    setTimeout(() => {
      this.showConfetti = false;
    }, 2500);
  }

  async markAsComplete() {
    if (this.isSaving) return;

    this.isSaving = true;
    this.saveError = false;

    try {
      const chapterNum = this.verses[0]?.chapter || 1;
      await this.bibleService
        .saveChapter(this.userId, this.chapterId, chapterNum)
        .toPromise();

      this.hasMarkedComplete = true;
      this.showSuccessCheck = true;

      // Hide success check and show options after delay
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

  async complete(save: boolean) {
    if (save) {
      await this.markAsComplete();
    } else {
      this.exitWithoutSaving();
    }
  }

  exitWithoutSaving() {
    this.showExitWithoutSaveConfirm = true;
  }

  cancelExitWithoutSave() {
    this.showExitWithoutSaveConfirm = false;
  }

  confirmExitWithoutSave() {
    this.visible = false;
    this.completed.emit({ memorized: false });
  }

  stopTimer() {
    // Stop any running timers or intervals
    // If you have timer references, clear them here
  }

  goToTracker() {
    this.stopTimer();
    this.visible = false;
    this.completed.emit({ memorized: true });
    this.router.navigate(['/tracker'], {
      queryParams: { memorized: true },
    });
  }

  goToFlow() {
    if (this.stopTimer) {
      this.stopTimer();
    }
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
    this.showExitConfirm = true;
  }

  cancelExit() {
    this.showExitConfirm = false;
  }

  confirmExitAction() {
    this.visible = false;
    this.completed.emit({ memorized: false });
  }

  getInitials(text: string): string {
    return text
      .split(' ')
      .map(word => {
        const match = word.match(/[a-zA-Z]/);
        if (match) {
          const index = word.indexOf(match[0]);
          return word.substring(0, index + 1);
        }
        return word;
      })
      .join(' ');
  }

  getVerseDisplay(v: Verse): string {
    if (this.currentStepIndex === 0) {
      return v.text;
    }
    if (this.currentStepIndex === 1) {
      return this.getInitials(v.text);
    }
    const wordCount = v.text.split(' ').length;
    return Array(Math.min(wordCount, 10)).fill('•').join(' ') + (wordCount > 10 ? '...' : '');
  }

  isGroupActive(originalGroupIndex: number): boolean {
    const activeIndices = this.getActiveGroupIndices();
    return activeIndices.includes(originalGroupIndex);
  }

  isGroupCompleted(originalGroupIndex: number): boolean {
    if (this.promptSave) return true;
    if (!this.currentStage || this.currentStage.stageType !== 'individual') return false;
    if (this.currentStageIndex > 0) return false;
    return originalGroupIndex < this.currentSubStageIndex;
  }
}
