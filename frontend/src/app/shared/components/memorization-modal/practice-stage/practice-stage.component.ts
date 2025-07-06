import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { FlowParsingService } from '../../../../core/services/flow-parsing.service';

export interface Verse {
  code: string;
  text: string;
  reference: string;
  bookId: number;
  chapter: number;
  verse: number;
}

export interface PracticeSettings {
  fontSize: number;
  layoutMode: 'column' | 'paragraph';
}

@Component({
  selector: 'app-practice-stage',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('verseTransition', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ],
  templateUrl: './practice-stage.component.html',
  styleUrls: ['./practice-stage.component.css']
})
export class PracticeStageComponent {
  @Input() currentVerses: Verse[] = [];
  @Input() currentStepIndex = 0;
  @Input() practiceSettings: PracticeSettings = {
    fontSize: 16,
    layoutMode: 'column'
  };

  constructor(private flowParsingService: FlowParsingService) {}

  getVerseDisplay(v: Verse): string {
    if (this.currentStepIndex === 0) {
      // Full text mode
      return v.text;
    }
    if (this.currentStepIndex === 1) {
      // FLOW mode - first letters only
      return this.flowParsingService.extractFirstLetters(v.text);
    }
    // Memory mode - show dots
    return this.flowParsingService.getMemoryModeDisplay(v.text);
  }
}