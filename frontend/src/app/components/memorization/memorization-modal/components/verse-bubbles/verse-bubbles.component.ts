import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export interface Verse {
  code: string;
  text: string;
  reference: string;
  bookId: number;
  chapter: number;
  verse: number;
}

@Component({
  selector: 'app-verse-bubbles',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('borderPulse', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  templateUrl: './verse-bubbles.component.html',
  styleUrls: ['./verse-bubbles.component.css']
})
export class VerseBubblesComponent implements AfterViewChecked {
  @ViewChild('verseBubblesContainer') verseBubblesContainer!: ElementRef<HTMLDivElement>;

  @Input() verses: Verse[] = [];
  @Input() groupSize = 2;
  @Input() groups: Verse[][] = [];
  @Input() activeGroupIndices: number[] = [];
  @Input() currentStepIndex = 0;
  @Input() currentSubStageIndex = 0;
  @Input() showStageDots = true;
  @Input() showCheckmarks = true;
  @Input() isIndividualStage = false;
  @Output() groupHovered = new EventEmitter<number>();
  @Output() jumpToStep = new EventEmitter<number>();

  hoveredGroup = -1;
  stageNames = ['Read', 'Flow', 'Memory', 'Review'];
  borderLeft = 0;
  borderWidth = 0;
  hasActiveBorder = false;

  ngAfterViewChecked() {
    this.updateActiveBorder();
  }

  updateActiveBorder() {
    if (!this.showStageDots || this.activeGroupIndices.length === 0) {
      this.hasActiveBorder = false;
      return;
    }

    setTimeout(() => {
      const bubbles = document.querySelectorAll('.group-bubble');
      if (bubbles.length === 0) return;

      const firstIndex = Math.min(...this.activeGroupIndices);
      const lastIndex = Math.max(...this.activeGroupIndices);

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
      if (this.activeGroupIndices.length === 0) return;

      const bubbles = document.querySelectorAll('.group-bubble');
      const firstIndex = Math.min(...this.activeGroupIndices);
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

  isGroupActive(index: number): boolean {
    return this.activeGroupIndices.includes(index);
  }

  isGroupCompleted(index: number): boolean {
    if (!this.showCheckmarks || !this.isIndividualStage) return false;
    return index < this.currentSubStageIndex;
  }

  hasActiveGroups(): boolean {
    return this.activeGroupIndices.length > 0;
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
}