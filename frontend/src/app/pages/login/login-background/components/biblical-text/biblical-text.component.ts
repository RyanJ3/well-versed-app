import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BiblicalText {
  id: number;
  text: string;
  translation: string;
  language: 'hebrew' | 'greek';
  x: number;
  y: number;
  animationDelay: string;
  showTranslation: boolean;
  visible: boolean;
  isHovered?: boolean;
}

@Component({
  selector: 'app-biblical-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="biblical-text"
      [class.visible]="text.visible || text.isHovered"
      [class.hebrew]="text.language === 'hebrew'"
      [class.greek]="text.language === 'greek'"
      [class.translating]="isTranslating"
      [style.left.%]="text.x"
      [style.top.%]="text.y"
      [style.animation-delay]="text.animationDelay"
      (mouseenter)="onHoverStart()"
      (mouseleave)="onHoverEnd()">
      <span class="original-text" [style.opacity]="1 - translationProgress">
        {{ text.text }}
      </span>
      <span class="translation-text" [style.opacity]="translationProgress">
        {{ displayedTranslation }}
      </span>
    </div>
  `,
  styleUrls: ['./biblical-text.component.scss']
})
export class BiblicalTextComponent implements OnDestroy {
  @Input() text!: BiblicalText;
  
  displayedTranslation: string = '';
  translationProgress: number = 0;
  isTranslating: boolean = false;
  private typewriterInterval?: any;
  private fadeInterval?: any;

  onHoverStart() {
    this.text.isHovered = true;
    this.startTranslation();
  }

  onHoverEnd() {
    this.text.isHovered = false;
    this.stopTranslation();
  }

  private startTranslation() {
    this.isTranslating = true;
    this.displayedTranslation = '';
    this.translationProgress = 0;
    
    // Clear any existing intervals
    this.stopIntervals();
    
    // Start fading original text
    this.fadeInterval = setInterval(() => {
      if (this.translationProgress < 1) {
        this.translationProgress = Math.min(1, this.translationProgress + 0.05);
      }
    }, 30);
    
    // Start typewriter effect for translation
    let charIndex = 0;
    this.typewriterInterval = setInterval(() => {
      if (charIndex < this.text.translation.length) {
        this.displayedTranslation += this.text.translation[charIndex];
        charIndex++;
      } else {
        clearInterval(this.typewriterInterval);
      }
    }, 50); // 50ms per character
  }

  private stopTranslation() {
    this.stopIntervals();
    
    // Quickly fade back to original
    this.fadeInterval = setInterval(() => {
      if (this.translationProgress > 0) {
        this.translationProgress = Math.max(0, this.translationProgress - 0.1);
      } else {
        clearInterval(this.fadeInterval);
        this.displayedTranslation = '';
        this.isTranslating = false;
      }
    }, 30);
  }
  
  private stopIntervals() {
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
    }
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }
  }

  ngOnDestroy() {
    this.stopIntervals();
  }
}