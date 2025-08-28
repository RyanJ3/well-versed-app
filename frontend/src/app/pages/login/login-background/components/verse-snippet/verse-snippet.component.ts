import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface VerseSnippet {
  id: number;
  text: string;
  x: number;
  y: number;
  animationDelay: string;
  showFlow: boolean;
  visible: boolean;
  isHovered?: boolean;
}

@Component({
  selector: 'app-verse-snippet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="verse-snippet"
      [class.visible]="snippet.visible || snippet.isHovered"
      [style.left.%]="snippet.x"
      [style.top.%]="snippet.y"
      [style.animation-delay]="snippet.animationDelay"
      (mouseenter)="onHoverStart()"
      (mouseleave)="onHoverEnd()">
      <span class="snippet-text">
        <span *ngFor="let word of words; let i = index" class="word">
          <span class="first-letter">{{ word.firstLetter }}</span>
          <span class="rest-letters" [class.hidden]="snippet.showFlow">{{ word.rest }}</span>
          <span *ngIf="i < words.length - 1" class="space"> </span>
        </span>
      </span>
    </div>
  `,
  styleUrls: ['./verse-snippet.component.scss']
})
export class VerseSnippetComponent implements OnInit {
  @Input() snippet!: VerseSnippet;
  words: { firstLetter: string; rest: string }[] = [];

  ngOnInit() {
    this.parseWords();
  }

  private parseWords() {
    this.words = this.snippet.text.split(' ').map(word => ({
      firstLetter: word.charAt(0).toUpperCase(),
      rest: word.slice(1)
    }));
  }

  onHoverStart() {
    this.snippet.isHovered = true;
    this.snippet.showFlow = true;
  }

  onHoverEnd() {
    this.snippet.isHovered = false;
    this.snippet.showFlow = false;
  }
}