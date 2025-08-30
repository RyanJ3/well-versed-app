import { Injectable } from '@angular/core';
import { WorkspaceSelectionService } from '../state/workspace-selection.service';
import { WorkspaceFilteringService } from '../core/workspace-filtering.service';
import { WorkspaceVerse } from '../../models/workspace.models';

/**
 * Facade for handling verse interactions (click, drag, select)
 */
@Injectable()
export class WorkspaceVerseInteractionFacade {
  constructor(
    private selectionService: WorkspaceSelectionService,
    private filteringService: WorkspaceFilteringService
  ) {}

  handleVerseClick(index: number, event: MouseEvent, verses: WorkspaceVerse[]) {
    const actualIndex = this.getActualIndex(index, verses);
    this.selectionService.handleVerseClick(actualIndex, event, verses);
  }

  handleMouseDown(index: number, verses: WorkspaceVerse[]) {
    const actualIndex = this.getActualIndex(index, verses);
    this.selectionService.handleMouseDown(actualIndex);
  }

  handleMouseEnter(index: number, verses: WorkspaceVerse[], activeFilter: string, verseReviewData?: any) {
    const actualIndex = this.getActualIndex(index, verses);
    const filteredVerses = this.filteringService.filterVerses(verses, activeFilter, verseReviewData);
    this.selectionService.handleMouseMove(actualIndex, verses, filteredVerses);
  }

  handleMouseUp() {
    this.selectionService.handleMouseUp();
  }

  isVerseSelected(verse: WorkspaceVerse): boolean {
    return this.selectionService.isVerseSelected(verse);
  }

  clearSelection() {
    this.selectionService.clearSelection();
  }

  selectAll(verses: WorkspaceVerse[]) {
    this.selectionService.selectAll(verses);
  }

  private getActualIndex(filteredIndex: number, verses: WorkspaceVerse[]): number {
    // For simplicity, assuming we're working with unfiltered verses
    // This can be enhanced to handle filtered scenarios
    return filteredIndex;
  }
}