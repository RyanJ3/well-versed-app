import { Injectable } from '@angular/core';
import { WorkspaceTopicalService } from '../modes/workspace-topical.service';
import { WorkspaceSelectionService } from '../state/workspace-selection.service';
import { WorkspaceUIStateService } from '../state/workspace-ui-state.service';
import { NotificationService } from '@services/utils/notification.service';
import { Router } from '@angular/router';
import { WorkspaceVerse } from '../../models/workspace.models';
import { WorkspaceFilterMode } from '../../models/workspace-filter-mode.enum';
import { Topic } from '../../models/workspace-interfaces';
import { WorkspaceMode } from '../../models/workspace-mode.enum';

@Injectable()
export class WorkspaceTopicalFacade {
  constructor(
    private topicalService: WorkspaceTopicalService,
    private selectionService: WorkspaceSelectionService,
    private uiStateService: WorkspaceUIStateService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  // Delegate to service
  get verses(): WorkspaceVerse[] {
    return this.topicalService.verses;
  }

  get selectedTopic(): Topic | null {
    return this.topicalService.selectedTopic;
  }

  get count(): number {
    return this.topicalService.count;
  }

  get isLoading(): boolean {
    return this.topicalService.isLoading;
  }

  get availableTopics(): Topic[] {
    return this.topicalService.availableTopics;
  }

  getFilteredVerses(activeFilter: WorkspaceFilterMode): WorkspaceVerse[] {
    return this.topicalService.getFilteredVerses(activeFilter);
  }

  getUnmemorizedCount(): number {
    return this.topicalService.getUnmemorizedCount();
  }

  selectTopic(topic: Topic, userId: number, preferredBible?: string) {
    this.topicalService.selectTopic(topic, userId, preferredBible);
  }

  loadAvailableTopics() {
    this.topicalService.loadAvailableTopics();
  }

  clearState() {
    this.topicalService.clearState();
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
    this.uiStateService.setMode(WorkspaceMode.CHAPTER);
    this.selectionService.clearSelection();
    
    this.router.navigate([], {
      queryParams: { bookId, chapter },
      queryParamsHandling: 'merge'
    });
    
    this.notificationService.info(`Navigating to ${verse.fullReference}`);
  }
}