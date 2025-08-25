import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { WorkspaceParsingService } from '@services/utils/workspace-parsing.service';

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
  styleUrls: ['./practice-stage.component.scss']
})
export class PracticeStageComponent {
  @Input() currentVerses: Verse[] = [];
  @Input() currentStepIndex = 0;
  @Input() practiceSettings: PracticeSettings = {
    fontSize: 16,
    layoutMode: 'column'
  };

  constructor(private workspaceParsingService: WorkspaceParsingService) {}

  getVerseDisplay(v: Verse): string {
    if (this.currentStepIndex === 0) {
      // Full text mode
      return v.text;
    }
    if (this.currentStepIndex === 1) {
      // FLOW mode - first letters only
      return this.workspaceParsingService.extractFirstLetters(v.text);
    }
    // Memory mode - show dots
    return this.workspaceParsingService.getMemoryModeDisplay(v.text);
  }
}