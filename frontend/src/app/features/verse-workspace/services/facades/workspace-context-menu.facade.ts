import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { WorkspaceUIStateService } from '../state/workspace-ui-state.service';
import { WorkspaceSelectionService } from '../state/workspace-selection.service';
import { WorkspaceVerseFacade } from './workspace-verse.facade';
import { WorkspaceNavigationFacade } from './workspace-navigation.facade';
import { WorkspaceDeckManagementService } from '../core/workspace-deck-management.service';
import { NotificationService } from '@services/utils/notification.service';
import { WorkspaceParsingService } from '@services/utils/workspace-parsing.service';
import { WorkspaceVerse } from '../../models/workspace.models';
import { WorkspaceMode } from '../../models/workspace-mode.enum';
import { DeckCreate } from '@services/api/deck.service';

@Injectable()
export class WorkspaceContextMenuFacade {
  private workspaceParsingService = inject(WorkspaceParsingService);
  private notificationService = inject(NotificationService);
  
  constructor(
    private uiStateService: WorkspaceUIStateService,
    private selectionService: WorkspaceSelectionService,
    private verseFacade: WorkspaceVerseFacade,
    private navigationFacade: WorkspaceNavigationFacade,
    private deckManagementService: WorkspaceDeckManagementService
  ) {}

  get contextMenu() {
    return this.uiStateService.currentState.contextMenu;
  }

  get selectedVerseIsMemorized$(): Observable<boolean> {
    return combineLatest([
      this.verseFacade.verses$,
      this.uiStateService.state$
    ]).pipe(
      map(([verses, state]) => {
        const contextMenu = state.contextMenu;
        if (!contextMenu.verseId) return false;
        const verse = verses.find(v => v.verseCode === contextMenu.verseId);
        return verse?.isMemorized || false;
      })
    );
  }

  get shouldShowMarkAsMemorized$(): Observable<boolean> {
    return combineLatest([
      this.verseFacade.verses$,
      this.verseFacade.selectedVerses$,
      this.uiStateService.state$
    ]).pipe(
      map(([verses, selectedVerses, state]) => {
        const contextMenu = state.contextMenu;
        if (contextMenu.selectedCount > 0) {
          const selectedVerseCodes = Array.from(selectedVerses);
          return selectedVerseCodes.some(verseCode => {
            const verse = verses.find(v => v.verseCode === verseCode);
            return verse && !verse.isMemorized;
          });
        }
        const verse = verses.find(v => v.verseCode === contextMenu.verseId);
        return verse ? !verse.isMemorized : false;
      })
    );
  }

  get shouldShowMarkAsUnmemorized$(): Observable<boolean> {
    return combineLatest([
      this.verseFacade.verses$,
      this.verseFacade.selectedVerses$,
      this.uiStateService.state$
    ]).pipe(
      map(([verses, selectedVerses, state]) => {
        const contextMenu = state.contextMenu;
        if (contextMenu.selectedCount > 0) {
          const selectedVerseCodes = Array.from(selectedVerses);
          return selectedVerseCodes.some(verseCode => {
            const verse = verses.find(v => v.verseCode === verseCode);
            return verse && verse.isMemorized;
          });
        }
        const verse = verses.find(v => v.verseCode === contextMenu.verseId);
        return verse ? verse.isMemorized : false;
      })
    );
  }

  get shouldShowJumpToChapter$(): Observable<boolean> {
    return combineLatest([
      this.navigationFacade.mode$,
      this.navigationFacade.currentBook$,
      this.navigationFacade.currentChapter$,
      this.verseFacade.verses$,
      this.verseFacade.selectedVerses$
    ]).pipe(
      map(([mode, currentBook, currentChapter, verses, selectedVerses]) => {
        if (mode === WorkspaceMode.CHAPTER) return false;
        if (selectedVerses.size === 0) return false;
        
        const selectedVerseCodes = Array.from(selectedVerses);
        const selectedVerseList = selectedVerseCodes
          .map(code => verses.find(v => v.verseCode === code))
          .filter(v => v !== undefined) as WorkspaceVerse[];
        
        if (selectedVerseList.length === 0) return false;
        
        const firstVerse = selectedVerseList[0];
        const [firstBookId, firstChapter] = this.workspaceParsingService.parseVerseCode(firstVerse.verseCode);
        
        const allSameChapter = selectedVerseList.every(verse => {
          const [bookId, chapter] = this.workspaceParsingService.parseVerseCode(verse.verseCode);
          return bookId === firstBookId && chapter === firstChapter;
        });
        
        if (!allSameChapter) return false;
        
        return !(currentBook?.id === firstBookId && currentChapter === firstChapter);
      })
    );
  }

  showContextMenu(event: MouseEvent, verse: WorkspaceVerse) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.selectionService.isVerseSelected(verse)) {
      this.selectionService.selectedVerses.add(verse.verseCode);
    }
    
    this.uiStateService.showContextMenu(
      event.clientX,
      event.clientY,
      verse.verseCode,
      this.selectionService.selectedVerses.size
    );
  }

  hideContextMenu() {
    this.uiStateService.hideContextMenu();
  }

  openCreateDeckModal() {
    const versesToAdd = this.contextMenu.selectedCount > 0
      ? Array.from(this.selectionService.selectedVerses)
      : [this.contextMenu.verseId!];
    
    this.deckManagementService.openCreateDeckModal(versesToAdd);
    this.hideContextMenu();
  }

  closeCreateDeckModal() {
    this.deckManagementService.closeCreateDeckModal();
  }

  handleCreateDeck(deckData: DeckCreate, verses: WorkspaceVerse[], currentBook: any, userId: number) {
    this.deckManagementService.createDeck(deckData, verses, currentBook, userId);
  }

  addToFlashcardDeck(deckName: string, verses: WorkspaceVerse[], currentBook: any) {
    const versesToAdd = this.contextMenu.selectedCount > 0
      ? Array.from(this.selectionService.selectedVerses)
      : [this.contextMenu.verseId!];
    
    this.deckManagementService.addVersesToDeck(deckName, versesToAdd, verses, currentBook);
    this.hideContextMenu();
  }

  async copyVerseText(verses: WorkspaceVerse[], currentBookName?: string) {
    this.hideContextMenu();
    
    let versesToCopy: WorkspaceVerse[] = [];
    
    if (this.selectionService.selectedVerses.size > 0) {
      const selectedCodes = Array.from(this.selectionService.selectedVerses);
      versesToCopy = verses
        .filter(v => selectedCodes.includes(v.verseCode))
        .sort((a, b) => {
          const [aBook, aChap, aVerse] = this.workspaceParsingService.parseVerseCode(a.verseCode);
          const [bBook, bChap, bVerse] = this.workspaceParsingService.parseVerseCode(b.verseCode);
          return aBook - bBook || aChap - bChap || aVerse - bVerse;
        });
    } else if (this.contextMenu.verseId) {
      const verse = verses.find(v => v.verseCode === this.contextMenu.verseId);
      if (verse) {
        versesToCopy = [verse];
      }
    }
    
    if (versesToCopy.length === 0) {
      this.notificationService.warning('No verses selected to copy');
      return;
    }
    
    const textToCopy = versesToCopy
      .map(v => {
        const [bookId, chapter, verseNum] = this.workspaceParsingService.parseVerseCode(v.verseCode);
        const reference = `${v.bookName || currentBookName || ''} ${chapter}:${verseNum}`;
        return `${reference} - ${v.text}`;
      })
      .join('\n\n');
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      const verseCount = versesToCopy.length;
      this.notificationService.success(
        verseCount === 1 ? 'Verse copied to clipboard' : `${verseCount} verses copied to clipboard`,
        3000
      );
    } catch (err) {
      console.error('Failed to copy text:', err);
      this.notificationService.error('Failed to copy text to clipboard');
    }
  }
}