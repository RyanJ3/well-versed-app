import { Injectable } from '@angular/core';
import { WorkspaceVerse } from '../../models/workspace.models';
import { WorkspaceVerseUtils } from '../../utils/workspace-verse.utils';
import { WorkspaceFilterMode } from '../../models/workspace-filter-mode.enum';

@Injectable()
export class WorkspaceFilteringService {
  
  filterVerses(
    verses: WorkspaceVerse[], 
    filter: WorkspaceFilterMode | string, 
    verseReviewData?: Record<string, { lastReviewed: number; strength: number }>
  ): WorkspaceVerse[] {
    return WorkspaceVerseUtils.filterVerses(verses, filter as any, verseReviewData);
  }

  getFilteredVerses(
    verses: WorkspaceVerse[],
    activeFilter: WorkspaceFilterMode,
    verseReviewData?: Record<string, { lastReviewed: number; strength: number }>
  ): WorkspaceVerse[] {
    switch (activeFilter) {
      case WorkspaceFilterMode.UNMEMORIZED:
        return verses.filter(v => !v.isMemorized);
      case WorkspaceFilterMode.NEEDS_REVIEW:
        if (!verseReviewData) return [];
        return verses.filter(v => {
          if (!v.isMemorized) return false;
          const review = verseReviewData[v.verseCode];
          if (!review) return true;
          const daysSinceReview = (Date.now() - review.lastReviewed) / (1000 * 60 * 60 * 24);
          return daysSinceReview > 7;
        });
      default:
        return verses;
    }
  }

  getVerseCounts(verses: WorkspaceVerse[], verseReviewData?: Record<string, any>) {
    return WorkspaceVerseUtils.getVerseCounts(verses, verseReviewData);
  }

  getActualIndex(
    filteredIndex: number,
    filteredVerses: WorkspaceVerse[],
    allVerses: WorkspaceVerse[]
  ): number {
    return WorkspaceVerseUtils.getActualIndex(filteredIndex, filteredVerses, allVerses);
  }
}