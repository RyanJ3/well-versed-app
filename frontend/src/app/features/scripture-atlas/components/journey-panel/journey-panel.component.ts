import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiblicalJourney, Testament } from '../../models/journey.models';

@Component({
  selector: 'app-journey-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journey-panel.component.html',
  styleUrls: ['./journey-panel.component.scss']
})
export class JourneyPanelComponent implements OnInit {
  @Input() testament: Testament = 'Old Testament';
  @Input() journeys: BiblicalJourney[] | null = [];
  @Input() currentJourney: BiblicalJourney | null = null;
  @Input() currentSegmentIndex: number = 0;
  @Input() totalSegments: number = 0;
  @Input() autoHide: boolean = false;
  
  @Output() testamentChange = new EventEmitter<Testament>();
  @Output() journeyChange = new EventEmitter<number>();
  
  collapsed = true;
  
  get progressPercentage(): number {
    if (this.totalSegments === 0) return 0;
    return ((this.currentSegmentIndex + 1) / this.totalSegments) * 100;
  }
  
  ngOnInit() {
    // Start with drawer closed
    this.collapsed = true;
  }
  
  selectTestament(testament: Testament) {
    this.testament = testament;
    this.testamentChange.emit(testament);
  }
  
  onJourneySelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const journeyId = parseInt(select.value);
    if (!isNaN(journeyId)) {
      this.journeyChange.emit(journeyId);
    }
  }
  
  formatYearRange(startYear: number | null, endYear: number | null): string {
    if (!startYear) return '';
    
    // Handle BC years
    const formatYear = (year: number) => {
      return year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
    };
    
    if (!endYear || startYear === endYear) {
      return formatYear(startYear);
    }
    
    return `${formatYear(startYear)} - ${formatYear(endYear)}`;
  }
  
  // Keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Toggle drawer with 'J' key
    if (event.key === 'j' || event.key === 'J') {
      if (!event.ctrlKey && !event.altKey && !event.metaKey) {
        // Don't trigger if user is typing in an input
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          this.collapsed = !this.collapsed;
        }
      }
    }
    // Close drawer with Escape key
    if (event.key === 'Escape' && !this.collapsed) {
      this.collapsed = true;
    }
  }
}