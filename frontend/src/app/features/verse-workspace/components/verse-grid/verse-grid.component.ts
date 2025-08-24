import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  TrackByFunction
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseVerse } from '../../models/verse-types.model';
import { VerseCardComponent } from '../verse-card/verse-card.component';
import { VirtualScrollDirective } from '../../directives/virtual-scroll.directive';

/**
 * Dumb/Presentational Component
 * Only handles presentation logic, no state management or business logic
 */
@Component({
  selector: 'app-verse-grid',
  standalone: true,
  imports: [CommonModule, VerseCardComponent, VirtualScrollDirective],
  template: `
    <div class="verse-grid-container" [class.grid-layout]="layoutMode === 'grid'" [class.single-layout]="layoutMode === 'single'">
      <!-- Empty State -->
      <div *ngIf="verses?.length === 0" class="empty-state">
        <div class="empty-icon">📖</div>
        <p class="empty-message">No verses found</p>
      </div>
      
      <!-- Virtual Scroll for Performance -->
      <div
        *ngIf="enableVirtualScroll && verses?.length > 100"
        appVirtualScroll
        [appVirtualScroll]="verses"
        [virtualScrollOptions]="{
          itemHeight: getItemHeight(),
          bufferSize: 5,
          trackBy: trackByVerseCode
        }"
        [virtualScrollTemplate]="verseTemplate"
        virtualScrollContainerHeight="calc(100vh - 200px)"
      >
      </div>
      
      <!-- Regular Grid (for smaller lists) -->
      <div *ngIf="!enableVirtualScroll || verses?.length <= 100" class="verses-wrapper">
        <app-verse-card
          *ngFor="let verse of verses; trackBy: trackByVerseCode; let i = index"
          [verse]="verse"
          [isSelected]="isVerseSelected(verse)"
          [isMemorized]="isVerseMemorized(verse)"
          [fontSize]="fontSize"
          [showFullText]="showFullText"
          [highlightText]="searchTerm"
          [index]="i"
          (click)="onVerseClick(verse, $event)"
          (dblclick)="onVerseDoubleClick(verse)"
          (contextmenu)="onVerseContextMenu($event, verse)"
          (memorizedToggle)="onMemorizedToggle(verse)"
        />
      </div>
      
      <!-- Template for Virtual Scroll -->
      <ng-template #verseTemplate let-verse let-index="index">
        <app-verse-card
          [verse]="verse"
          [isSelected]="isVerseSelected(verse)"
          [isMemorized]="isVerseMemorized(verse)"
          [fontSize]="fontSize"
          [showFullText]="showFullText"
          [highlightText]="searchTerm"
          [index]="index"
          (click)="onVerseClick(verse, $event)"
          (dblclick)="onVerseDoubleClick(verse)"
          (contextmenu)="onVerseContextMenu($event, verse)"
          (memorizedToggle)="onMemorizedToggle(verse)"
        />
      </ng-template>
      
      <!-- Selection Info Bar -->
      <div class="selection-bar" *ngIf="selectedCount > 0" [@slideUp]>
        <div class="selection-info">
          <span class="count">{{ selectedCount }} verse{{ selectedCount > 1 ? 's' : '' }} selected</span>
        </div>
        <div class="selection-actions">
          <button class="btn btn-primary" (click)="selectionAction.emit('study')">
            Study Selected
          </button>
          <button class="btn btn-secondary" (click)="selectionAction.emit('memorize')">
            Toggle Memorized
          </button>
          <button class="btn btn-text" (click)="selectionAction.emit('clear')">
            Clear
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./verse-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    // Add slide up animation for selection bar
  ]
})
export class VerseGridComponent implements OnChanges {
  @Input() verses: BaseVerse[] | null = [];
  @Input() selectedVerses: BaseVerse[] | null = [];
  @Input() memorizedVerseIds: Set<string> | null = new Set();
  @Input() fontSize = 16;
  @Input() layoutMode: 'grid' | 'single' = 'grid';
  @Input() showFullText = false;
  @Input() searchTerm = '';
  @Input() enableVirtualScroll = true;
  
  @Output() verseClick = new EventEmitter<{ verse: BaseVerse; multiSelect: boolean }>();
  @Output() verseDoubleClick = new EventEmitter<BaseVerse>();
  @Output() verseContextMenu = new EventEmitter<{ verse: BaseVerse; x: number; y: number }>();
  @Output() verseMemorizedToggle = new EventEmitter<BaseVerse>();
  @Output() selectionChange = new EventEmitter<string[]>();
  @Output() selectionAction = new EventEmitter<string>();
  
  selectedCount = 0;
  private selectedVerseIds = new Set<string>();
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedVerses']) {
      this.updateSelectedVerseIds();
    }
  }
  
  private updateSelectedVerseIds(): void {
    this.selectedVerseIds.clear();
    if (this.selectedVerses) {
      this.selectedVerses.forEach(v => this.selectedVerseIds.add(v.verseCode));
      this.selectedCount = this.selectedVerses.length;
    }
  }
  
  isVerseSelected(verse: BaseVerse): boolean {
    return this.selectedVerseIds.has(verse.verseCode);
  }
  
  isVerseMemorized(verse: BaseVerse): boolean {
    return this.memorizedVerseIds?.has(verse.verseCode) || false;
  }
  
  onVerseClick(verse: BaseVerse, event: MouseEvent): void {
    const multiSelect = event.ctrlKey || event.metaKey || event.shiftKey;
    this.verseClick.emit({ verse, multiSelect });
  }
  
  onVerseDoubleClick(verse: BaseVerse): void {
    this.verseDoubleClick.emit(verse);
  }
  
  onVerseContextMenu(event: MouseEvent, verse: BaseVerse): void {
    event.preventDefault();
    this.verseContextMenu.emit({ 
      verse, 
      x: event.clientX, 
      y: event.clientY 
    });
  }
  
  onMemorizedToggle(verse: BaseVerse): void {
    this.verseMemorizedToggle.emit(verse);
  }
  
  getItemHeight(): number {
    // Calculate based on layout mode and font size
    const baseHeight = this.layoutMode === 'grid' ? 150 : 100;
    const fontAdjustment = (this.fontSize - 16) * 2;
    return baseHeight + fontAdjustment;
  }
  
  trackByVerseCode: TrackByFunction<BaseVerse> = (index: number, verse: BaseVerse) => {
    return verse.verseCode;
  };
}