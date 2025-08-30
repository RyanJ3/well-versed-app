import { Injectable } from '@angular/core';
import { WorkspaceCrossReferencesService } from '../modes/workspace-cross-references.service';
import { WorkspaceSelectionService } from '../state/workspace-selection.service';
import { WorkspaceUIStateService } from '../state/workspace-ui-state.service';
import { NotificationService } from '@services/utils/notification.service';
import { Router } from '@angular/router';
import { WorkspaceVerse } from '../../models/workspace.models';
import { BibleBook } from '@models/bible';
import { WorkspaceFilterMode } from '../../models/workspace-filter-mode.enum';

@Injectable()
export class WorkspaceCrossReferencesFacade {
  constructor(
    private crossReferencesService: WorkspaceCrossReferencesService,
    private selectionService: WorkspaceSelectionService,
    private uiStateService: WorkspaceUIStateService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  // Delegate to service
  get verses(): WorkspaceVerse[] {
    return this.crossReferencesService.verses;
  }

  get selectedVerse(): any {
    return this.crossReferencesService.selectedVerse;
  }

  get count(): number {
    return this.crossReferencesService.count;
  }

  get isLoading(): boolean {
    return this.crossReferencesService.isLoading;
  }

  getFilteredVerses(activeFilter: WorkspaceFilterMode): WorkspaceVerse[] {
    return this.crossReferencesService.getFilteredVerses(activeFilter);
  }

  getUnmemorizedCount(): number {
    return this.crossReferencesService.getUnmemorizedCount();
  }

  selectVerse(verse: any, userId: number, preferredBible?: string) {
    this.crossReferencesService.selectVerse(verse, userId, preferredBible);
  }

  clearState() {
    this.crossReferencesService.clearState();
  }

  // Event handlers
  handleClick(verse: WorkspaceVerse, event: MouseEvent) {
    const index = this.verses.findIndex(v => v.verseCode === verse.verseCode);
    if (index >= 0) {
      this.selectionService.handleVerseClick(index, event, this.verses);
    }
  }

  handleMouseDown(index: number) {
    const filteredVerses = this.getFilteredVerses(this.uiStateService.currentState.activeFilter);
    if (index >= 0 && index < filteredVerses.length) {
      const verse = filteredVerses[index];
      const actualIndex = this.verses.findIndex(v => v.verseCode === verse.verseCode);
      this.selectionService.handleMouseDown(actualIndex);
    }
  }

  handleMouseEnter(index: number) {
    const filteredVerses = this.getFilteredVerses(this.uiStateService.currentState.activeFilter);
    if (index >= 0 && index < filteredVerses.length && this.selectionService.isDragging) {
      const verse = filteredVerses[index];
      const actualIndex = this.verses.findIndex(v => v.verseCode === verse.verseCode);
      this.selectionService.handleMouseMove(actualIndex, this.verses, filteredVerses);
    }
  }

  navigateToVerse(verse: WorkspaceVerse) {
    const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
    
    this.uiStateService.setTargetVerse(verseNum);
    this.uiStateService.setMode('chapter');
    this.selectionService.clearSelection();
    
    this.router.navigate([], {
      queryParams: { bookId, chapter },
      queryParamsHandling: 'merge'
    });
    
    this.notificationService.info(`Navigating to ${verse.fullReference}`);
  }

  createDefaultCrossRefVerse(currentBook: BibleBook | null, currentChapter: number, verses: WorkspaceVerse[]): any {
    const bookId = currentBook?.id || 1;
    const bookName = currentBook?.name || 'Genesis';
    const chapter = currentChapter || 1;
    const verseNum = verses.length > 0 ? verses[0].verse : 1;
    const verseCode = verses.length > 0 
      ? verses[0].verseCode 
      : `${bookId}-${chapter}-1`;
    
    return {
      bookId,
      bookName,
      chapter,
      verse: verseNum,
      verseCode,
      displayText: `${bookName} ${chapter}:${verseNum}`
    };
  }

  returnToChapterMode() {
    this.uiStateService.setMode('chapter');
    this.selectionService.clearSelection();
    this.clearState();
    this.notificationService.info('Returned to chapter mode');
  }
}