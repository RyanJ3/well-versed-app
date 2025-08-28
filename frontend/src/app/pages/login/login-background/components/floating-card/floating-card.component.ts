import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FloatingCard {
  id: number;
  verse: string;
  reference: string;
  x: number;
  y: number;
  rotation: number;
  animationDelay: string;
  depth: number;
  isFlipped?: boolean;
  visible: boolean;
  isHovered?: boolean;
}

@Component({
  selector: 'app-floating-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="flashcard"
      [class.flipped]="card.isFlipped"
      [class.visible]="card.visible || card.isHovered"
      [style.left.%]="card.x"
      [style.top.%]="card.y"
      [style.transform]="'scale(' + card.depth + ')'"
      [style.animation-delay]="card.animationDelay"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()">
      <div class="card-inner">
        <div class="card-front">
          <div class="reference-text">{{ card.reference }}</div>
          <div class="card-icon">📖</div>
        </div>
        <div class="card-back">
          <div class="verse-text">{{ card.verse }}</div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./floating-card.component.scss']
})
export class FloatingCardComponent {
  @Input() card!: FloatingCard;
  @Output() toggleCard = new EventEmitter<void>();
  @Output() hover = new EventEmitter<boolean>();

  onMouseEnter() {
    this.card.isHovered = true;
    this.toggleCard.emit();
    this.hover.emit(true);
  }

  onMouseLeave() {
    this.card.isHovered = false;
    this.toggleCard.emit();
    this.hover.emit(false);
  }
}