import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ChangeDetectionStrategy,
  HostBinding,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseVerse } from '../../models/verse-types.model';
import { HighlightPipe } from '../../pipes/highlight.pipe';

/**
 * Dumb/Presentational Component for individual verse card
 * Pure presentation, no business logic
 */
@Component({
  selector: 'app-verse-card',
  standalone: true,
  imports: [CommonModule, HighlightPipe],
  template: `
    <div class="verse-card-content">
      <!-- Memorization Status Indicator -->
      <div class="verse-status" *ngIf="isMemorized" (click)="onMemorizedClick($event)">
        <svg class="checkmark" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      
      <!-- Selection Indicator -->
      <div class="verse-selection" *ngIf="isSelected && !isMemorized">
        <svg class="checkmark" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      
      <!-- Verse Reference -->
      <div class="verse-reference">
        {{ verse.displayReference || verse.reference }}
      </div>
      
      <!-- Verse Text -->
      <div class="verse-text" [class.full]="showFullText">
        <span [innerHTML]="verse.text | highlight:highlightText"></span>
      </div>
      
      <!-- Additional Metadata (if available) -->
      <div class="verse-metadata" *ngIf="showMetadata">
        <span class="book-name" *ngIf="verse.bookName">{{ verse.bookName }}</span>
        <span class="chapter" *ngIf="verse.chapter">Ch {{ verse.chapter }}</span>
        <span class="verse-number" *ngIf="verse.verseNumber">v{{ verse.verseNumber }}</span>
      </div>
      
      <!-- Action Buttons (shown on hover) -->
      <div class="verse-actions">
        <button 
          class="action-btn memorize" 
          [class.active]="isMemorized"
          (click)="onMemorizedClick($event)"
          [attr.aria-label]="isMemorized ? 'Mark as not memorized' : 'Mark as memorized'"
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
        
        <button 
          class="action-btn more" 
          (click)="onMoreClick($event)"
          aria-label="More options"
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./verse-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerseCardComponent {
  @Input() verse!: BaseVerse;
  @Input() isSelected = false;
  @Input() isMemorized = false;
  @Input() fontSize = 16;
  @Input() showFullText = false;
  @Input() highlightText = '';
  @Input() index = 0;
  @Input() showMetadata = false;
  
  @Output() memorizedToggle = new EventEmitter<void>();
  @Output() moreActions = new EventEmitter<MouseEvent>();
  
  @HostBinding('class.verse-card') readonly verseCardClass = true;
  @HostBinding('class.selected') get selectedClass() { return this.isSelected; }
  @HostBinding('class.memorized') get memorizedClass() { return this.isMemorized; }
  @HostBinding('style.fontSize.px') get fontSizeStyle() { return this.fontSize; }
  @HostBinding('attr.data-verse-code') get verseCodeAttr() { return this.verse?.verseCode; }
  @HostBinding('attr.tabindex') readonly tabIndex = 0;
  @HostBinding('attr.role') readonly role = 'article';
  @HostBinding('attr.aria-selected') get ariaSelected() { return this.isSelected; }
  
  onMemorizedClick(event: MouseEvent): void {
    event.stopPropagation();
    this.memorizedToggle.emit();
  }
  
  onMoreClick(event: MouseEvent): void {
    event.stopPropagation();
    this.moreActions.emit(event);
  }
  
  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        // Trigger click
        break;
      case 'm':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.memorizedToggle.emit();
        }
        break;
    }
  }
}