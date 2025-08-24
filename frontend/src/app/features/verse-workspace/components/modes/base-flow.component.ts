import { Component, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FlowStateManagerService } from '../../services/flow-state-manager.service';
import { VerseTransformationService } from '../../services/verse-transformation.service';
import { BaseVerse } from '../../models/verse-types.model';

/**
 * Base component for all flow modes
 * Provides shared functionality and common patterns
 */
export abstract class BaseFlowComponent<T extends BaseVerse> implements OnDestroy {
  @Input() verses: T[] = [];
  @Input() fontSize = 16;
  @Input() layoutMode: 'grid' | 'single' = 'grid';
  @Input() showFullText = false;
  @Input() searchTerm = '';
  
  @Output() verseClick = new EventEmitter<T>();
  @Output() verseDoubleClick = new EventEmitter<T>();
  @Output() contextMenu = new EventEmitter<{ event: MouseEvent; verse: T }>();
  @Output() selectionChange = new EventEmitter<Set<string>>();
  
  protected destroy$ = new Subject<void>();
  protected selectedVerses = new Set<string>();
  protected lastSelectedIndex = -1;
  protected isSelecting = false;
  
  constructor(
    protected stateManager: FlowStateManagerService,
    protected verseTransformer: VerseTransformationService
  ) {
    this.subscribeToState();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Subscribe to relevant state changes
   */
  protected subscribeToState(): void {
    this.stateManager.selectedVerses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(selected => {
        this.selectedVerses = selected;
      });
      
    this.stateManager.ui$
      .pipe(takeUntil(this.destroy$))
      .subscribe(ui => {
        this.fontSize = ui.fontSize;
        this.layoutMode = ui.layoutMode;
        this.showFullText = ui.showFullText;
        this.searchTerm = ui.searchTerm;
      });
  }
  
  /**
   * Handle verse click
   */
  handleVerseClick(verse: T, event: MouseEvent): void {
    event.preventDefault();
    const index = this.verses.indexOf(verse);
    
    if (event.shiftKey && this.lastSelectedIndex >= 0) {
      this.selectRange(this.lastSelectedIndex, index);
    } else if (event.ctrlKey || event.metaKey) {
      this.toggleVerseSelection(verse);
    } else {
      this.selectSingleVerse(verse);
    }
    
    this.lastSelectedIndex = index;
    this.verseClick.emit(verse);
  }
  
  /**
   * Handle verse double click
   */
  handleVerseDoubleClick(verse: T): void {
    this.verseDoubleClick.emit(verse);
  }
  
  /**
   * Handle context menu
   */
  handleContextMenu(event: MouseEvent, verse: T): void {
    event.preventDefault();
    this.contextMenu.emit({ event, verse });
    this.stateManager.showContextMenu(verse.verseCode, event.clientX, event.clientY);
  }
  
  /**
   * Handle mouse down for drag selection
   */
  handleMouseDown(index: number): void {
    this.isSelecting = true;
    this.lastSelectedIndex = index;
  }
  
  /**
   * Handle mouse enter for drag selection
   */
  handleMouseEnter(index: number): void {
    if (this.isSelecting && this.lastSelectedIndex >= 0) {
      this.selectRange(this.lastSelectedIndex, index);
    }
  }
  
  /**
   * Handle mouse up to end selection
   */
  handleMouseUp(): void {
    this.isSelecting = false;
  }
  
  /**
   * Select a single verse
   */
  protected selectSingleVerse(verse: T): void {
    this.stateManager.clearSelection();
    this.stateManager.selectVerse(verse.verseCode);
  }
  
  /**
   * Toggle verse selection
   */
  protected toggleVerseSelection(verse: T): void {
    this.stateManager.toggleVerseSelection(verse.verseCode);
  }
  
  /**
   * Select range of verses
   */
  protected selectRange(startIndex: number, endIndex: number): void {
    const [from, to] = startIndex < endIndex 
      ? [startIndex, endIndex] 
      : [endIndex, startIndex];
      
    this.stateManager.clearSelection();
    for (let i = from; i <= to; i++) {
      if (this.verses[i]) {
        this.stateManager.selectVerse(this.verses[i].verseCode);
      }
    }
  }
  
  /**
   * Check if verse is selected
   */
  isVerseSelected(verse: T): boolean {
    return this.selectedVerses.has(verse.verseCode);
  }
  
  /**
   * Get filtered verses based on search term
   */
  getFilteredVerses(): T[] {
    if (!this.searchTerm) return this.verses;
    
    return this.verseTransformer.filterVerses(this.verses, this.searchTerm);
  }
  
  /**
   * Get verse CSS classes
   */
  getVerseClasses(verse: T, index: number): string[] {
    const classes = ['verse-block'];
    
    if (this.isVerseSelected(verse)) {
      classes.push('selected');
    }
    
    if (this.isVerseHighlighted(verse)) {
      classes.push('highlighted');
    }
    
    // Add mode-specific classes
    classes.push(...this.getModeSpecificClasses(verse, index));
    
    return classes;
  }
  
  /**
   * Track by function for ngFor
   */
  trackByVerseCode(index: number, verse: T): string {
    return verse.verseCode;
  }
  
  /**
   * Abstract methods to be implemented by child components
   */
  protected abstract isVerseHighlighted(verse: T): boolean;
  protected abstract getModeSpecificClasses(verse: T, index: number): string[];
  abstract handleKeyboardShortcut(event: KeyboardEvent): void;
}