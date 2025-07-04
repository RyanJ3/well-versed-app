import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { Verse, ReviewStage, ProgressMarker, PracticeSettings } from '../../models/memorization.types';

@Component({
  selector: 'app-progress-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-header.component.html',
  styleUrls: ['./progress-header.component.scss'],
  animations: [
    trigger('borderPulse', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
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
    trigger('progressPath', [
      transition(':enter', [
        style({ strokeDashoffset: 100 }),
        animate('1000ms ease-out', style({ strokeDashoffset: '*' }))
      ])
    ])
  ]
})
export class ProgressHeaderComponent implements AfterViewChecked {
  @ViewChild('verseBubblesContainer') verseBubblesContainer!: ElementRef<HTMLDivElement>;
  
  @Input() currentBook = '';
  @Input() currentChapterNum = 0;
  @Input() progressPercentage = 0;
  @Input() verses: Verse[] = [];
  @Input() groupSize = 2;
  @Input() currentStage: ReviewStage | null = null;
  @Input() currentVerses: Verse[] = [];
  @Input() currentStepIndex = 0;
  @Input() setup = false;
  @Input() progressMarkers: ProgressMarker[] = [];
  @Input() practiceSettings: PracticeSettings = {
    fontSize: 16,
    layoutMode: 'column'
  };
  
  @Output() confirmExit = new EventEmitter<void>();
  @Output() settingsChange = new EventEmitter<PracticeSettings>();
  
  borderLeft = 0;
  borderWidth = 0;
  hasActiveBorder = false;
  hoveredGroup = -1;
  showSettingsDropdown = false;
  isGearSpinning = false;

  ngAfterViewChecked() {
    this.updateActiveBorder();
  }

  toggleSettingsDropdown() {
    this.showSettingsDropdown = !this.showSettingsDropdown;
    this.isGearSpinning = true;
    setTimeout(() => (this.isGearSpinning = false), 600);
  }

  increaseFontSize() {
    if (this.practiceSettings.fontSize < 24) {
      const newSettings = { ...this.practiceSettings, fontSize: this.practiceSettings.fontSize + 2 };
      this.settingsChange.emit(newSettings);
    }
  }

  decreaseFontSize() {
    if (this.practiceSettings.fontSize > 12) {
      const newSettings = { ...this.practiceSettings, fontSize: this.practiceSettings.fontSize - 2 };
      this.settingsChange.emit(newSettings);
    }
  }

  setLayoutMode(mode: 'column' | 'paragraph') {
    const newSettings = { ...this.practiceSettings, layoutMode: mode };
    this.settingsChange.emit(newSettings);
  }

  getProgressColor(): string {
    const percentage = this.progressPercentage;
    if (percentage < 33) return '#3b82f6';
    if (percentage < 66) return '#8b5cf6';
    return '#10b981';
  }

  getOriginalGroups(): Verse[][] {
    const groups: Verse[][] = [];
    for (let i = 0; i < this.verses.length; i += this.groupSize) {
      groups.push(this.verses.slice(i, i + this.groupSize));
    }
    return groups;
  }

  isGroupActive(originalGroupIndex: number): boolean {
    const activeIndices = this.getActiveGroupIndices();
    return activeIndices.includes(originalGroupIndex);
  }

  isGroupCompleted(originalGroupIndex: number): boolean {
    if (!this.currentStage || this.currentStage.stageType !== 'individual') return false;
    return originalGroupIndex < this.currentSubStageIndex;
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

  updateActiveBorder() {
    if (this.setup || !this.currentStage) {
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

  private get currentSubStageIndex(): number {
    return 0;
  }

  onConfirmExit() {
    this.confirmExit.emit();
  }
}
