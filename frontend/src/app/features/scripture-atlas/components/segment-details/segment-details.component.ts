import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JourneySegment, JourneyEvent } from '../../models/journey.models';

@Component({
  selector: 'app-segment-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './segment-details.component.html',
  styleUrls: ['./segment-details.component.scss']
})
export class SegmentDetailsComponent {
  @Input() segment: JourneySegment | null = null;
  @Input() collapsed = false;
  
  @Output() toggle = new EventEmitter<void>();
  
  toggleCollapse() {
    this.toggle.emit();
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