import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnimationManagerService {
  private animationIntervals: any[] = [];
  private fadeIntervals: any[] = [];
  private readonly FADE_CYCLE_DURATION = 7000;
  private isAnimating = false;

  startElementFadeCycle(
    elements: any[],
    onRelocate: (element: any) => void,
    initialDelay: number = 0
  ): void {
    // Only schedule initial appearance if not already animating
    if (!this.isAnimating) {
      this.scheduleInitialAppearance(elements, initialDelay);
    }
    
    // Recurring fade cycle
    const interval = this.createFadeCycleInterval(elements, onRelocate);
    this.fadeIntervals.push(interval);
  }

  clearAllIntervals(): void {
    this.animationIntervals.forEach(interval => clearInterval(interval));
    this.fadeIntervals.forEach(interval => clearInterval(interval));
    this.animationIntervals = [];
    this.fadeIntervals = [];
    this.isAnimating = false;
  }

  getAnimationIntervals(): any[] {
    return this.animationIntervals;
  }

  getFadeIntervals(): any[] {
    return this.fadeIntervals;
  }

  setAnimationIntervals(intervals: any[]): void {
    this.animationIntervals = intervals;
  }

  setFadeIntervals(intervals: any[]): void {
    this.fadeIntervals = intervals;
  }

  private scheduleInitialAppearance(elements: any[], delay: number): void {
    setTimeout(() => {
      elements.forEach((element, index) => {
        setTimeout(() => {
          if (!element.isHovered) {
            element.visible = true;
          }
        }, index * 500);
      });
      this.isAnimating = true;
    }, delay);
  }

  private createFadeCycleInterval(elements: any[], onRelocate: (element: any) => void): any {
    return setInterval(() => {
      elements.forEach((element, index) => {
        if (element.isHovered) return;
        
        setTimeout(() => {
          this.relocateElement(element, onRelocate);
        }, index * 1000);
      });
    }, this.FADE_CYCLE_DURATION);
  }

  private relocateElement(element: any, onRelocate: (element: any) => void): void {
    // Fade out
    element.visible = false;
    
    // Relocate and fade in
    setTimeout(() => {
      if (!element.isHovered) {
        onRelocate(element);
        element.visible = true;
      }
    }, 500);
  }
}