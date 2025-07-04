import { Component, Input } from '@angular/core';
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

  private getInitials(text: string): string {
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
}