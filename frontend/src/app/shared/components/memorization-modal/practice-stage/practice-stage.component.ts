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
        // Separate the word from trailing punctuation
        const punctuationMatch = word.match(/^(.+?)([.,;:!?]*)$/);
        const wordPart = punctuationMatch ? punctuationMatch[1] : word;
        const trailingPunctuation = punctuationMatch ? punctuationMatch[2] : '';
        
        // Handle words with apostrophes (possessive and contractive)
        const processedWord = this.removeApostrophesFromWord(wordPart);
        
        // Find the first letter
        const match = processedWord.match(/[a-zA-Z]/);
        if (match) {
          const index = processedWord.indexOf(match[0]);
          return processedWord.substring(0, index + 1) + trailingPunctuation;
        }
        return word; // Return original if no letters found
      })
      .join(' ');
  }

  private removeApostrophesFromWord(word: string): string {
    // Common contractions and possessive patterns
    const contractionPatterns = [
      // Standard contractions
      /(\w+)'re$/g,     // they're, we're, you're
      /(\w+)'ve$/g,     // I've, we've, they've
      /(\w+)'ll$/g,     // I'll, we'll, they'll
      /(\w+)'d$/g,      // I'd, we'd, they'd
      /(\w+)n't$/g,     // don't, can't, won't
      /(\w+)'m$/g,      // I'm
      /(\w+)'s$/g,      // Possessive or contractions like "it's", "he's"
    ];

    let result = word;
    
    // Remove apostrophes from contractions and possessives
    contractionPatterns.forEach(pattern => {
      result = result.replace(pattern, (match, beforeApostrophe) => {
        // Extract the part after the apostrophe
        const afterApostrophe = match.substring(beforeApostrophe.length + 1);
        return beforeApostrophe + afterApostrophe;
      });
    });

    // Handle any remaining apostrophes in possessive cases (like names ending in 's)
    // Example: "Jesus'" becomes "Jesus"
    result = result.replace(/(\w+)'(\w*)$/g, '$1$2');

    return result;
  }
}