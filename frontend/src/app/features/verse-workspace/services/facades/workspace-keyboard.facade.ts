import { Injectable } from '@angular/core';
import { WorkspaceSelectionService } from '../state/workspace-selection.service';
import { WorkspaceUIStateService } from '../state/workspace-ui-state.service';
import { WorkspaceOrchestratorFacade } from './workspace-orchestrator.facade';
import { WorkspaceStudySessionFacade } from './workspace-study-session.facade';
import { WorkspaceCrossReferencesService } from '../modes/workspace-cross-references.service';
import { WorkspaceNavigationFacade } from './workspace-navigation.facade';
import { WorkspaceVerse } from '../../models/workspace.models';
import { WorkspaceMode } from '../../models/workspace-mode.enum';
import { WorkspaceFilterMode } from '../../models/workspace-filter-mode.enum';
import { Router } from '@angular/router';
import { NotificationService } from '@services/utils/notification.service';

@Injectable()
export class WorkspaceKeyboardFacade {
  constructor(
    private selectionService: WorkspaceSelectionService,
    private uiStateService: WorkspaceUIStateService,
    private orchestrator: WorkspaceOrchestratorFacade,
    private studySessionFacade: WorkspaceStudySessionFacade,
    private crossReferencesService: WorkspaceCrossReferencesService,
    private navigationFacade: WorkspaceNavigationFacade,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  handleKeyDown(event: KeyboardEvent, currentVerses: WorkspaceVerse[], currentBook: any, currentChapter: number) {
    if (event.key === 'Escape') {
      this.handleEscapeKey();
    } else if (event.key === 'Enter') {
      this.handleEnterKey(currentVerses, currentBook, currentChapter);
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      this.handleSelectAll();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
      event.preventDefault();
      this.handleToggleCrossReferences();
    }
  }

  handleDocumentClick() {
    this.uiStateService.hideContextMenu();
    this.uiStateService.closeSettings();
  }

  private handleEscapeKey() {
    this.selectionService.clearSelection();
    this.uiStateService.hideContextMenu();
  }

  private handleEnterKey(currentVerses: WorkspaceVerse[], currentBook: any, currentChapter: number) {
    const mode = this.navigationFacade.getCurrentMode();
    
    if (mode === WorkspaceMode.CROSS_REFERENCES && this.selectionService.selectedVerses.size === 1) {
      const selectedCode = Array.from(this.selectionService.selectedVerses)[0];
      const crossReferenceVerses = this.crossReferencesService.verses;
      const selectedVerse = crossReferenceVerses.find(v => v.verseCode === selectedCode);
      
      if (selectedVerse) {
        this.navigateToVerse(selectedVerse);
      }
    } else if (this.selectionService.selectedVerses.size > 0) {
      this.studySessionFacade.startStudySession(currentVerses, currentBook, currentChapter);
    }
  }

  private handleSelectAll() {
    this.orchestrator.selectAll();
  }

  private handleToggleCrossReferences() {
    const currentMode = this.orchestrator.getCurrentMode();
    const newMode = currentMode === WorkspaceMode.CHAPTER 
      ? WorkspaceMode.CROSS_REFERENCES 
      : WorkspaceMode.CHAPTER;
    
    this.orchestrator.setMode(newMode);
    
    if (newMode === WorkspaceMode.CROSS_REFERENCES) {
      this.uiStateService.setActiveFilter(WorkspaceFilterMode.ALL);
    }
  }

  private navigateToVerse(verse: WorkspaceVerse) {
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
}