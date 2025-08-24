import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseFlowComponent } from '../base-flow.component';
import { MemorizationVerse } from '../../../models/verse-types.model';
import { FlowStateManagerService } from '../../../services/flow-state-manager.service';
import { VerseTransformationService } from '../../../services/verse-transformation.service';
import { BibleMemorizationService } from '../../../../../services/bible-memorization.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-memorization-flow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './memorization-flow.component.html',
  styleUrls: ['./memorization-flow.component.scss']
})
export class MemorizationFlowComponent extends BaseFlowComponent<MemorizationVerse> implements OnInit {
  @Input() bookId = 1;
  @Input() chapter = 1;
  
  @Output() startStudy = new EventEmitter<MemorizationVerse[]>();
  @Output() toggleMemorized = new EventEmitter<MemorizationVerse>();
  @Output() addToDeck = new EventEmitter<{ verses: MemorizationVerse[]; deckName: string }>();
  
  memorizedCount = 0;
  totalCount = 0;
  progressPercentage = 0;
  
  // Filter states
  showMemorizedOnly = false;
  showToLearnOnly = false;
  showReviewOnly = false;
  
  constructor(
    protected override stateManager: FlowStateManagerService,
    protected override verseTransformer: VerseTransformationService,
    private memorizationService: BibleMemorizationService
  ) {
    super(stateManager, verseTransformer);
  }
  
  ngOnInit(): void {
    this.loadVerses();
    this.subscribeToMemorizationChanges();
  }
  
  /**
   * Load verses for current book and chapter
   */
  async loadVerses(): Promise<void> {
    this.stateManager.setLoading(true, 'Loading verses...');
    
    try {
      // Get verse codes for the chapter
      const verseCodes = await this.getChapterVerseCodes(this.bookId, this.chapter);
      
      // Get memorized verses from service
      const memorizedSet = await this.getMemorizedVerses();
      
      // Transform to memorization verses
      this.verses = await this.verseTransformer.transformToMemorizationVerses(
        verseCodes,
        memorizedSet
      );
      
      this.updateProgress();
    } catch (error) {
      console.error('Error loading verses:', error);
    } finally {
      this.stateManager.setLoading(false);
    }
  }
  
  /**
   * Subscribe to memorization changes
   */
  private subscribeToMemorizationChanges(): void {
    this.memorizationService.memorizedVerses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(memorized => {
        this.updateVerseMemorizationStatus(memorized);
        this.updateProgress();
      });
  }
  
  /**
   * Update verse memorization status
   */
  private updateVerseMemorizationStatus(memorizedSet: Set<string>): void {
    this.verses.forEach(verse => {
      verse.isMemorized = memorizedSet.has(verse.verseCode);
    });
  }
  
  /**
   * Update progress statistics
   */
  private updateProgress(): void {
    this.totalCount = this.verses.length;
    this.memorizedCount = this.verses.filter(v => v.isMemorized).length;
    this.progressPercentage = this.totalCount > 0 
      ? Math.round((this.memorizedCount / this.totalCount) * 100)
      : 0;
  }
  
  /**
   * Get filtered verses based on active filters
   */
  override getFilteredVerses(): MemorizationVerse[] {
    let filtered = super.getFilteredVerses();
    
    if (this.showMemorizedOnly) {
      filtered = filtered.filter(v => v.isMemorized);
    } else if (this.showToLearnOnly) {
      filtered = filtered.filter(v => !v.isMemorized);
    } else if (this.showReviewOnly) {
      filtered = filtered.filter(v => v.isMemorized && this.needsReview(v));
    }
    
    return filtered;
  }
  
  /**
   * Toggle memorization status
   */
  handleToggleMemorized(verse: MemorizationVerse, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    verse.isMemorized = !verse.isMemorized;
    this.toggleMemorized.emit(verse);
    
    // Update in service
    if (verse.isMemorized) {
      this.memorizationService.markAsMemorized(verse.verseCode);
    } else {
      this.memorizationService.markAsNotMemorized(verse.verseCode);
    }
    
    this.updateProgress();
  }
  
  /**
   * Start study session with selected verses
   */
  startStudySession(): void {
    const selectedVerses = this.verses.filter(v => this.isVerseSelected(v));
    
    if (selectedVerses.length === 0) {
      // If no selection, study all non-memorized verses
      const toStudy = this.verses.filter(v => !v.isMemorized);
      this.startStudy.emit(toStudy);
    } else {
      this.startStudy.emit(selectedVerses);
    }
  }
  
  /**
   * Add selected verses to deck
   */
  addSelectedToDeck(deckName: string): void {
    const selectedVerses = this.verses.filter(v => this.isVerseSelected(v));
    
    if (selectedVerses.length > 0) {
      this.addToDeck.emit({ verses: selectedVerses, deckName });
    }
  }
  
  /**
   * Check if verse needs review
   */
  private needsReview(verse: MemorizationVerse): boolean {
    if (!verse.lastReviewDate) return true;
    
    const daysSinceReview = Math.floor(
      (Date.now() - verse.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Simple spaced repetition intervals
    const reviewIntervals = [1, 3, 7, 14, 30, 60];
    const reviewCount = verse.reviewCount || 0;
    const interval = reviewIntervals[Math.min(reviewCount, reviewIntervals.length - 1)];
    
    return daysSinceReview >= interval;
  }
  
  /**
   * Get verse codes for a chapter
   */
  private async getChapterVerseCodes(bookId: number, chapter: number): Promise<string[]> {
    // This would typically come from an API
    // For now, returning mock data
    const verseCodes: string[] = [];
    const verseCount = this.getVerseCount(bookId, chapter);
    
    for (let verse = 1; verse <= verseCount; verse++) {
      const code = `${bookId.toString().padStart(2, '0')}${chapter.toString().padStart(3, '0')}${verse.toString().padStart(3, '0')}`;
      verseCodes.push(code);
    }
    
    return verseCodes;
  }
  
  /**
   * Get memorized verses from service
   */
  private async getMemorizedVerses(): Promise<Set<string>> {
    // This would come from the memorization service
    return new Set(this.memorizationService.getMemorizedVerses());
  }
  
  /**
   * Get verse count for a chapter (mock data)
   */
  private getVerseCount(bookId: number, chapter: number): number {
    // This would come from Bible metadata
    // Returning Genesis 1 verse count for now
    if (bookId === 1 && chapter === 1) return 31;
    return 20; // Default
  }
  
  /**
   * Check if verse is highlighted
   */
  protected isVerseHighlighted(verse: MemorizationVerse): boolean {
    return verse.isHighlighted || false;
  }
  
  /**
   * Get mode-specific CSS classes
   */
  protected getModeSpecificClasses(verse: MemorizationVerse, index: number): string[] {
    const classes: string[] = [];
    
    if (verse.isMemorized) {
      classes.push('memorized');
    }
    
    if (verse.isFirstInChapter) {
      classes.push('first-in-chapter');
    }
    
    if (verse.isLastInChapter) {
      classes.push('last-in-chapter');
    }
    
    if (this.needsReview(verse)) {
      classes.push('needs-review');
    }
    
    return classes;
  }
  
  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcut(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        if (this.selectedVerses.size > 0) {
          this.startStudySession();
        }
        break;
        
      case ' ':
        event.preventDefault();
        if (this.lastSelectedIndex >= 0) {
          const verse = this.verses[this.lastSelectedIndex];
          if (verse) {
            this.toggleVerseSelection(verse);
          }
        }
        break;
        
      case 'm':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          const selectedVerses = this.verses.filter(v => this.isVerseSelected(v));
          selectedVerses.forEach(v => this.handleToggleMemorized(v));
        }
        break;
        
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.verses.forEach(v => this.stateManager.selectVerse(v.verseCode));
        }
        break;
        
      case 'Escape':
        this.stateManager.clearSelection();
        break;
    }
  }
  
  /**
   * Toggle filter
   */
  toggleFilter(filter: 'memorized' | 'toLearn' | 'review'): void {
    switch (filter) {
      case 'memorized':
        this.showMemorizedOnly = !this.showMemorizedOnly;
        this.showToLearnOnly = false;
        this.showReviewOnly = false;
        break;
      case 'toLearn':
        this.showToLearnOnly = !this.showToLearnOnly;
        this.showMemorizedOnly = false;
        this.showReviewOnly = false;
        break;
      case 'review':
        this.showReviewOnly = !this.showReviewOnly;
        this.showMemorizedOnly = false;
        this.showToLearnOnly = false;
        break;
    }
  }
}