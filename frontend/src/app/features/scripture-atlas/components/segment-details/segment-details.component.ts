import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JourneySegment, JourneyEvent } from '../../models/journey.models';

@Component({
  selector: 'app-segment-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './segment-details.component.html',
  styleUrls: ['./segment-details.component.scss']
})
export class SegmentDetailsComponent implements OnInit, OnChanges {
  @Input() segment: JourneySegment | null = null;
  @Input() collapsed = true;
  
  @Output() toggle = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();
  
  isMobile = false;
  isUpdating = false;
  private touchStartY = 0;
  private currentTranslateY = 0;
  private isDragging = false;
  
  ngOnInit() {
    this.checkMobile();
  }
  
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobile();
  }
  
  private checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
  
  ngOnChanges(changes: SimpleChanges) {
    // Handle segment changes while preserving panel state
    if (changes['segment'] && !changes['segment'].firstChange) {
      const prevSegment = changes['segment'].previousValue;
      const currSegment = changes['segment'].currentValue;
      
      // Show brief loading state when content changes
      if (prevSegment !== currSegment && currSegment) {
        this.isUpdating = true;
        setTimeout(() => {
          this.isUpdating = false;
        }, 300);
      }
      
      // Only auto-open if this is the first segment or if panel was previously closed
      if (prevSegment === null && currSegment && this.collapsed) {
        // First segment load - show peek mode on desktop, expanded on mobile
        this.collapsed = this.isMobile ? false : true;
        this.collapsedChange.emit(this.collapsed);
      }
      // If panel is already open (peek or expanded), keep it open
      // This allows users to navigate segments while keeping details visible
    }
  }
  
  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.toggle.emit();
    this.collapsedChange.emit(this.collapsed);
  }
  
  // Touch gesture handlers for mobile
  onTouchStart(event: TouchEvent) {
    this.touchStartY = event.touches[0].clientY;
    this.isDragging = true;
    
    const panel = (event.target as HTMLElement).closest('.details-panel');
    if (panel && this.isMobile) {
      panel.classList.add('dragging');
    }
  }
  
  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || !this.isMobile) return;
    
    const deltaY = event.touches[0].clientY - this.touchStartY;
    this.currentTranslateY = Math.max(0, deltaY);
    
    const panel = (event.target as HTMLElement).closest('.details-panel');
    if (panel) {
      (panel as HTMLElement).style.transform = `translateY(${this.currentTranslateY}px)`;
    }
  }
  
  onTouchEnd(event: TouchEvent) {
    this.isDragging = false;
    
    if (!this.isMobile) return;
    
    const panel = (event.target as HTMLElement).closest('.details-panel');
    if (panel) {
      panel.classList.remove('dragging');
      (panel as HTMLElement).style.transform = '';
      
      // If dragged down more than 100px, collapse
      if (this.currentTranslateY > 100) {
        this.collapsed = true;
        this.collapsedChange.emit(true);
      }
    }
    
    this.currentTranslateY = 0;
  }
  
  highlightEvent(event: JourneyEvent) {
    // Could emit event to map for visual effects
    console.log('Highlighting event:', event.title);
  }
  
  unhighlightEvent() {
    // Remove highlight
  }
  
  getEventIcon(event: JourneyEvent): string {
    // Return appropriate icon based on event type
    if (event.visualEffect) {
      switch (event.visualEffect) {
        case 'divine-light': return '✨';
        case 'storm': return '⛈️';
        case 'earthquake': return '🌋';
        case 'miracle': return '🌟';
        case 'teaching': return '📜';
        case 'conflict': return '⚔️';
        default: return '📍';
      }
    }
    
    // Default icons based on keywords
    const title = event.title.toLowerCase();
    if (title.includes('heal') || title.includes('miracle')) return '✨';
    if (title.includes('teach') || title.includes('sermon')) return '📜';
    if (title.includes('pray') || title.includes('worship')) return '🙏';
    if (title.includes('cross') || title.includes('crucif')) return '✝️';
    if (title.includes('resurrect')) return '🌅';
    
    return '📍';
  }
  
  getTravelIcon(mode: string): string {
    switch (mode) {
      case 'walk': return '🚶';
      case 'boat': return '⛵';
      case 'divine': return '☁️';
      case 'horse': return '🐎';
      case 'chariot': return '🛞';
      default: return '➡️';
    }
  }
  
  getTravelModeText(mode: string): string {
    switch (mode) {
      case 'walk': return 'On foot';
      case 'boat': return 'By boat';
      case 'divine': return 'Divine guidance';
      case 'horse': return 'On horseback';
      case 'chariot': return 'By chariot';
      default: return 'Travel';
    }
  }
}