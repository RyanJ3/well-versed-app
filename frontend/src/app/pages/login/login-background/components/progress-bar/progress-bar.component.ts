import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProgressBar {
  id: number;
  progress: number;
  targetProgress: number;
  x: number;
  y: number;
  width: number;
  animationDelay: string;
  isHovered: boolean;
  visible: boolean;
}

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="progress-bar-wrapper"
      [class.visible]="bar.visible || bar.isHovered"
      [style.left.%]="bar.x"
      [style.top.%]="bar.y"
      [style.width.px]="bar.width"
      [style.animation-delay]="bar.animationDelay"
      (mouseenter)="onHoverStart()"
      (mouseleave)="onHoverEnd()">
      <div class="progress-bar-container">
        <div class="progress-bar-bg"></div>
        <div 
          class="progress-bar-fill" 
          [style.width.%]="bar.progress">
        </div>
        <div class="progress-text">
          <span class="progress-value">{{ bar.progress }}</span>
          <span class="progress-percent">%</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent {
  @Input() bar!: ProgressBar;
  private animationInterval?: any;

  onHoverStart() {
    this.bar.isHovered = true;
    this.startProgressAnimation();
  }

  onHoverEnd() {
    this.bar.isHovered = false;
    this.stopProgressAnimation();
    setTimeout(() => {
      this.bar.progress = 0;
    }, 500);
  }

  private startProgressAnimation() {
    this.animationInterval = setInterval(() => {
      if (this.bar.progress < this.bar.targetProgress) {
        this.bar.progress += 2; // Faster increment
        if (this.bar.progress > this.bar.targetProgress) {
          this.bar.progress = this.bar.targetProgress;
        }
      }
    }, 10); // Faster animation
  }

  private stopProgressAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }

  ngOnDestroy() {
    this.stopProgressAnimation();
  }
}