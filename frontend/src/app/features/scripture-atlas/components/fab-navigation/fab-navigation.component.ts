import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fab-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fab-navigation.component.html',
  styleUrls: ['./fab-navigation.component.scss']
})
export class FabNavigationComponent {
  @Input() currentSegmentIndex = 0;
  @Input() totalSegments = 0;
  @Input() hideOnDesktop = false;
  
  @Output() previousSegment = new EventEmitter<void>();
  @Output() nextSegment = new EventEmitter<void>();
  @Output() resetView = new EventEmitter<void>();
  
  isExpanded = false;
  
  get canGoPrevious(): boolean {
    return this.currentSegmentIndex > 0;
  }
  
  get canGoNext(): boolean {
    return this.currentSegmentIndex < this.totalSegments - 1;
  }
  
  get progressPercentage(): number {
    if (this.totalSegments === 0) return 0;
    return ((this.currentSegmentIndex + 1) / this.totalSegments) * 100;
  }
  
  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }
  
  onPrevious(): void {
    if (this.canGoPrevious) {
      this.previousSegment.emit();
      this.isExpanded = false;
    }
  }
  
  onNext(): void {
    if (this.canGoNext) {
      this.nextSegment.emit();
      this.isExpanded = false;
    }
  }
  
  onReset(): void {
    this.resetView.emit();
    this.isExpanded = false;
  }
  
  // Keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Don't trigger if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Arrow navigation
    if (!event.ctrlKey && !event.altKey && !event.metaKey) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.onPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.onNext();
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        this.onReset();
      }
    }
  }
  
  // Close on click outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.fab-navigation') && this.isExpanded) {
      this.isExpanded = false;
    }
  }
}