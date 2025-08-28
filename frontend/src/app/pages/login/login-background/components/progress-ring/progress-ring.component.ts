import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProgressRing {
  id: number;
  progress: number;
  targetProgress: number;
  x: number;
  y: number;
  size: number;
  animationDelay: string;
  isHovered: boolean;
  visible: boolean;
}

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="progress-ring-wrapper"
      [class.visible]="ring.visible || ring.isHovered"
      [style.left.%]="ring.x"
      [style.top.%]="ring.y"
      [style.animation-delay]="ring.animationDelay"
      (mouseenter)="onHoverStart()"
      (mouseleave)="onHoverEnd()">
      <svg class="progress-ring" [style.width.px]="ring.size" [style.height.px]="ring.size">
        <defs>
          <linearGradient [id]="'gradient-' + ring.id" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle
          class="progress-ring-bg"
          [attr.cx]="ring.size / 2"
          [attr.cy]="ring.size / 2"
          [attr.r]="(ring.size / 2) - 4"
          fill="none"
          stroke="rgba(148, 163, 184, 0.1)"
          stroke-width="3"
        />
        <circle
          class="progress-ring-fill"
          [attr.cx]="ring.size / 2"
          [attr.cy]="ring.size / 2"
          [attr.r]="(ring.size / 2) - 4"
          fill="none"
          [attr.stroke]="'url(#gradient-' + ring.id + ')'"
          stroke-width="3"
          stroke-linecap="round"
          [style.stroke-dasharray]="((ring.size / 2 - 4) * 2 * 3.14159) + 'px'"
          [style.stroke-dashoffset]="getProgressDashoffset() + 'px'"
          style="transition: stroke-dashoffset 0.5s ease"
        />
      </svg>
      <div class="progress-text">
        <span class="progress-value">{{ ring.progress }}</span>
        <span class="progress-percent">%</span>
      </div>
    </div>
  `,
  styleUrls: ['./progress-ring.component.scss']
})
export class ProgressRingComponent {
  @Input() ring!: ProgressRing;
  private animationInterval?: any;

  getProgressDashoffset(): number {
    const radius = (this.ring.size / 2) - 4;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (this.ring.progress / 100 * circumference);
    return offset;
  }

  onHoverStart() {
    this.ring.isHovered = true;
    this.startProgressAnimation();
  }

  onHoverEnd() {
    this.ring.isHovered = false;
    this.stopProgressAnimation();
    setTimeout(() => {
      this.ring.progress = 0;
    }, 500);
  }

  private startProgressAnimation() {
    this.animationInterval = setInterval(() => {
      if (this.ring.progress < this.ring.targetProgress) {
        this.ring.progress += 2; // Slower increment for smoother animation to 100
        if (this.ring.progress > this.ring.targetProgress) {
          this.ring.progress = this.ring.targetProgress;
        }
      }
    }, 30); // Faster interval but smaller increments
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