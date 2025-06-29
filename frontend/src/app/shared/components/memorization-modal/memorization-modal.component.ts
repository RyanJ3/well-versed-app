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
import { Subject, takeUntil } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
  stageLevel: number; // 0 for individual, 1+ for review levels
}

interface ProgressMarker {
  position: number;
  type: 'star' | 'flag';
  completed: boolean;
  id: string;
  label?: string;
}

interface StarPopup {
  starId: string;
  groupNumber: number;
  show: boolean;
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

  visible = true;
  setup = true;
  groupSize = 2;

  // All stages including reviews
  allStages: ReviewStage[] = [];
  currentStageIndex = 0;
  currentSubStageIndex = 0;
  currentStepIndex = 0; // 0: Read, 1: Flow, 2: Memory

  promptSave = false;
  completedSteps = 0;
  totalSteps = 0;

  showExitConfirm = false;

  borderLeft = 0;
  borderWidth = 0;
  hasActiveBorder = false;

  progressMarkers: ProgressMarker[] = [];
  starPopup: StarPopup | null = null;

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
    return Math.round(groupCount * 3 * 1.5); // 1.5 minutes per stage average
  }

  get stageNames(): string[] {
    return ['Read', 'Flow', 'Memory'];
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && !this.setup && !this.promptSave) {
      this.confirmExit();
    } else if (event.key === 'Enter' && !this.setup) {
      this.next();
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
  }

  ngAfterViewChecked() {
    this.updateActiveBorder();
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

          this.borderLeft = firstRect.left - containerRect.left - 8;
          this.borderWidth = (lastRect.right - firstRect.left) + 16;
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
        
        // Center the active bubbles if possible
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
    this.buildAllStages();
    this.buildProgressMarkers();
    this.currentStageIndex = 0;
    this.currentSubStageIndex = 0;
    this.currentStepIndex = 0;
    this.completedSteps = 0;
    
    // Scroll to first verses
    this.scrollToActiveVerses();
  }

  buildAllStages() {
    this.allStages = [];
    
    // Individual stages
    const originalGroups = this.getOriginalGroups();
    this.allStages.push({
      groups: originalGroups,
      stageType: 'individual',
      stageLevel: 0
    });
    
    // Progressive review stages
    let currentGroups = [...originalGroups];
    let reviewLevel = 1;
    
    while (currentGroups.length > 1) {
      const nextGroups: Verse[][] = [];
      
      // Pair groups by 2s
      for (let i = 0; i < currentGroups.length; i += 2) {
        if (i + 1 < currentGroups.length) {
          // Combine two groups
          nextGroups.push([...currentGroups[i], ...currentGroups[i + 1]]);
        } else {
          // Odd group remains alone
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
    
    // Final review (all verses)
    this.allStages.push({
      groups: [this.verses],
      stageType: 'final',
      stageLevel: reviewLevel
    });
    
    // Calculate total steps
    this.totalSteps = 0;
    for (const stage of this.allStages) {
      this.totalSteps += stage.groups.length * 3; // 3 steps per group
    }
  }

  buildProgressMarkers() {
    this.progressMarkers = [];
    let stepCount = 0;
    
    for (let stageIdx = 0; stageIdx < this.allStages.length; stageIdx++) {
      const stage = this.allStages[stageIdx];
      
      // Stars for individual groups
      if (stage.stageType === 'individual') {
        for (let groupIdx = 0; groupIdx < stage.groups.length; groupIdx++) {
          stepCount += 3; // 3 steps per group
          const position = (stepCount / this.totalSteps) * 100;
          
          this.progressMarkers.push({
            position,
            type: 'star',
            completed: false,
            id: `star-${stageIdx}-${groupIdx}`,
            label: `Group ${groupIdx + 1}`
          });
        }
      } else {
        // Count steps for review stages
        stepCount += stage.groups.length * 3;
      }
      
      // Flag at the end of each stage
      const position = (stepCount / this.totalSteps) * 100;
      const phaseNumber = stage.stageType === 'individual' ? 1 : stage.stageLevel + 1;
      
      this.progressMarkers.push({
        position,
        type: 'flag',
        completed: false,
        id: `flag-${stageIdx}`,
        label: stage.stageType === 'final' ? 'Final' : `Phase ${phaseNumber}`
      });
    }
  }

  updateProgressMarkers() {
    let stepCount = 0;
    
    for (let stageIdx = 0; stageIdx < this.allStages.length; stageIdx++) {
      const stage = this.allStages[stageIdx];
      
      if (stage.stageType === 'individual') {
        for (let groupIdx = 0; groupIdx < stage.groups.length; groupIdx++) {
          stepCount += 3;
          
          // Update stars for individual groups
          const marker = this.progressMarkers.find(m => m.id === `star-${stageIdx}-${groupIdx}`);
          if (marker && !marker.completed && this.completedSteps >= stepCount) {
            // Show popup before marking complete
            this.showStarPopup(`star-${stageIdx}-${groupIdx}`, groupIdx + 1);
            setTimeout(() => {
              marker.completed = true;
              this.hideStarPopup();
            }, 1000);
          }
        }
      } else {
        stepCount += stage.groups.length * 3;
      }
      
      // Update flags for completed stages
      const flagMarker = this.progressMarkers.find(m => m.id === `flag-${stageIdx}`);
      if (flagMarker) {
        flagMarker.completed = this.completedSteps >= stepCount;
      }
    }
  }

  showStarPopup(starId: string, groupNumber: number) {
    this.starPopup = {
      starId,
      groupNumber,
      show: true
    };
  }

  hideStarPopup() {
    if (this.starPopup) {
      this.starPopup.show = false;
      setTimeout(() => {
        this.starPopup = null;
      }, 200);
    }
  }

  getGroupCount(): number {
    return Math.ceil(this.verses.length / this.groupSize);
  }

  next() {
    if (!this.currentStage) return;
    
    this.completedSteps++;
    
    if (this.currentStepIndex < 2) {
      // Move to next step (Read -> Flow -> Memory)
      this.currentStepIndex++;
    } else {
      // Completed current group
      this.currentStepIndex = 0;
      
      if (this.currentSubStageIndex < this.currentStage.groups.length - 1) {
        // Move to next group in current stage
        this.currentSubStageIndex++;
        this.scrollToActiveVerses();
      } else {
        // Completed current stage
        this.currentSubStageIndex = 0;
        this.currentStageIndex++;
        
        if (this.currentStageIndex >= this.allStages.length) {
          // All stages completed
          this.showSavePrompt();
        } else {
          // Scroll back to beginning for review stages
          if (this.verseBubblesContainer) {
            this.verseBubblesContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
          }
          this.scrollToActiveVerses();
        }
      }
    }
    
    // Update markers after state change
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
        // Move to previous stage
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
    this.visible = false;
    this.router.navigate(['/profile'], {
      queryParams: { memorized: save },
    });
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
      .map((word) => word[0] || '')
      .join(' ');
  }

  getVerseDisplay(v: Verse): string {
    if (this.currentStepIndex === 0) {
      return v.text;
    }
    if (this.currentStepIndex === 1) {
      return this.getInitials(v.text);
    }
    // Return dots for memory mode
    const wordCount = v.text.split(' ').length;
    return Array(Math.min(wordCount, 10)).fill('•').join(' ') + (wordCount > 10 ? '...' : '');
  }

  isGroupActive(originalGroupIndex: number): boolean {
    const activeIndices = this.getActiveGroupIndices();
    return activeIndices.includes(originalGroupIndex);
  }

  isGroupCompleted(originalGroupIndex: number): boolean {
    if (this.promptSave) return true;
    if (!this.currentStage || this.currentStage.stageType !== 'individual') return true;
    if (this.currentStageIndex > 0) return true; // All groups completed in individual stage
    return originalGroupIndex < this.currentSubStageIndex;
  }

  getStageChar(stage: string): string {
    return stage.charAt(0);
  }
}
